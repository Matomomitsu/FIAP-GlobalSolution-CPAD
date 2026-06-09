import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/OperationsUI';
import { environment } from '@/config/environment';
import { Palette, Radius } from '@/constants/Colors';
import type { AlertHistoryItem, MissionAlert, MissionRisk, TelemetrySnapshot } from '@/types/mission';

type AiBriefingProps = {
  alertHistory: AlertHistoryItem[];
  alerts: MissionAlert[];
  batteryProjection: number;
  missionName: string;
  risk: MissionRisk;
  signalTrend: number;
  telemetry: TelemetrySnapshot;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const groqApiKey = environment.groqApiKey;
const groqModel = environment.groqModel;
const maxBriefingCharacters = 700;

function formatDateTime(value?: string) {
  if (!value) {
    return 'data nao informada';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'data nao informada';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  });
}

function describeHistoryItem(alert: AlertHistoryItem) {
  if (alert.status === 'resolved') {
    return `${alert.title} foi resolvido por ${alert.resolvedByName ?? 'operador'} em ${formatDateTime(alert.resolvedAt)}`;
  }

  return `${alert.title} foi registrado no historico e visto pela ultima vez em ${formatDateTime(alert.lastSeenAt)}`;
}

function describeAlertAction(alert: MissionAlert) {
  switch (alert.id) {
    case 'battery-low':
      return 'reduzir cargas nao essenciais e priorizar energia para comunicacao e controle de atitude';
    case 'latency-high':
      return 'adiar comandos nao criticos e enviar somente instrucoes essenciais ate estabilizar o enlace';
    case 'radiation-high':
      return 'limitar operacoes externas, priorizar protecao dos modulos e acompanhar a tendencia';
    case 'signal-low':
      return 'reorientar antenas, aguardar melhor janela de comunicacao ou reduzir volume de telemetria';
    case 'stability-low':
      return 'revisar atitude orbital e preparar microcorrecoes antes da proxima janela operacional';
    case 'temperature-high':
      return 'redistribuir carga termica e reduzir consumo dos modulos menos prioritarios';
    default:
      return 'manter monitoramento proximo e priorizar acoes de mitigacao do subsistema afetado';
  }
}

function sanitizeBriefingText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function limitBriefingText(text: string) {
  const sanitized = sanitizeBriefingText(text);

  if (sanitized.length <= maxBriefingCharacters) {
    return sanitized;
  }

  const shortened = sanitized.slice(0, maxBriefingCharacters);
  const sentenceEnd = Math.max(shortened.lastIndexOf('.'), shortened.lastIndexOf('?'), shortened.lastIndexOf('!'));

  if (sentenceEnd > 180) {
    return shortened.slice(0, sentenceEnd + 1).trim();
  }

  return `${shortened.trim().replace(/[,:;\s]+$/, '')}.`;
}

function buildFallbackBriefing({ alertHistory, alerts, batteryProjection, missionName, risk, signalTrend, telemetry }: AiBriefingProps) {
  const observations: string[] = [];

  if (alerts.length) {
    const alertActions = alerts
      .slice(0, 2)
      .map((alert) => `${alert.title}: ${describeAlertAction(alert)}.`)
      .join(' ');

    observations.push(`Operacao imediata: ${alertActions}`);
  }

  if (batteryProjection < 35) {
    observations.push(`Bateria prevista em ${batteryProjection.toFixed(1)}%; reduza cargas nao essenciais.`);
  }

  if (signalTrend < -4) {
    observations.push(`Sinal caiu ${Math.abs(signalTrend).toFixed(1)} pontos; acompanhe a proxima janela de comunicacao.`);
  }

  if (telemetry.latency > 500) {
    observations.push(`Latencia em ${telemetry.latency} ms; priorize comandos essenciais.`);
  }

  if (alertHistory.length) {
    observations.push(`Historico recente: ${describeHistoryItem(alertHistory[0])}.`);
  }

  const prioritySummary = observations.length
    ? observations.slice(0, 3).join(' ')
    : 'Sem prioridade imediata; indicadores principais seguem sem alerta ativo relevante.';

  return [
    `Missao: ${missionName}. Risco ${risk.label} (${risk.score}/100).`,
    `Observacoes principais: ${prioritySummary}`,
  ].join('\n\n');
}

function buildPrompt({ alertHistory, alerts, batteryProjection, missionName, risk, signalTrend, telemetry }: AiBriefingProps) {
  const activeAlerts = alerts
    .slice(0, 3)
    .map((alert) => `${alert.title}: ${alert.metric} ${alert.value}, faixa ${alert.threshold}, severidade ${alert.severity}, acao recomendada: ${describeAlertAction(alert)}`)
    .join('; ');
  const historyAlerts = alertHistory
    .slice(0, 3)
    .map((alert) => describeHistoryItem(alert))
    .join('; ');

  return [
    'Voce e um analista de operacoes espaciais. Gere um resumo muito curto em portugues, objetivo e acionavel.',
    'Use texto puro. Nao use Markdown, asteriscos, negrito, titulos com #, listas ou emojis.',
    'Limite maximo: 600 caracteres. Use no maximo 3 paragrafos curtos. Finalize a ultima frase dentro do limite.',
    'Nao descreva todas as metricas. Cite uma metrica somente se houver alerta ativo, risco elevado, tendencia ruim ou historico relevante.',
    'Quando houver alertas ativos, priorize eles. Para cada alerta citado, explique em poucas palavras o impacto operacional e o que a equipe deve fazer agora.',
    'Se tudo estiver nominal, diga isso em 1 ou 2 frases e indique apenas manter monitoramento.',
    'Priorize observacoes importantes, relacao com historico e uma acao recomendada curta.',
    `Missao: ${missionName}.`,
    `Risco: ${risk.label} (${risk.score}%).`,
    `Dados disponiveis para contexto, sem obrigacao de citar: temperatura ${telemetry.temperature} C, bateria ${telemetry.battery}%, sinal ${telemetry.signal}%, latencia ${telemetry.latency} ms, estabilidade ${telemetry.orbitalStability}%.`,
    `Bateria prevista: ${batteryProjection.toFixed(1)}%. Tendencia de sinal: ${signalTrend.toFixed(1)} pontos.`,
    `Alertas ativos: ${activeAlerts || 'nenhum'}.`,
    `Historico de alertas: ${historyAlerts || 'nenhum registro historico'}.`,
  ].join(' ');
}

export function AiBriefing(props: AiBriefingProps) {
  const briefingProps = {
    ...props,
    alertHistory: props.alertHistory.filter((alert) => alert.status !== 'active'),
  };
  const [briefing, setBriefing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [visibleBriefing, setVisibleBriefing] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reducedMotionRef.current = enabled;
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reducedMotionRef.current = enabled;
    });

    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      subscription.remove();
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (!briefing) {
      setTyping(false);
      setVisibleBriefing(null);
      return undefined;
    }

    if (reducedMotionRef.current) {
      setTyping(false);
      setVisibleBriefing(briefing);
      return undefined;
    }

    let index = 0;
    setTyping(true);
    setVisibleBriefing('');

    typingIntervalRef.current = setInterval(() => {
      index += 1;
      setVisibleBriefing(briefing.slice(0, index));

      if (index >= briefing.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }

        setTyping(false);
      }
    }, 16);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [briefing]);

  async function generateBriefing() {
    const fallback = limitBriefingText(buildFallbackBriefing(briefingProps));

    if (!groqApiKey) {
      setBriefing(fallback);
      setGeneratedAt(new Date().toISOString());
      setError('');
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        body: JSON.stringify({
          max_tokens: 220,
          messages: [
            {
              content: 'Voce responde como analista de operacoes espaciais. Escreva somente texto puro em portugues, curto, completo, sem Markdown e sem asteriscos.',
              role: 'system',
            },
            { content: buildPrompt(briefingProps), role: 'user' },
          ],
          model: groqModel,
          temperature: 0.25,
        }),
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Resumo indisponivel');
      }

      const data = (await response.json()) as GroqResponse;
      const text = limitBriefingText(data.choices?.[0]?.message?.content ?? '');

      if (mountedRef.current) {
        setBriefing(text || fallback);
        setGeneratedAt(new Date().toISOString());
      }
    } catch (requestError) {
      if (mountedRef.current && !(requestError instanceof Error && requestError.name === 'AbortError')) {
        setBriefing(fallback);
        setGeneratedAt(new Date().toISOString());
        setError('Resumo local exibido porque nao foi possivel atualizar agora.');
      }
    } finally {
      if (mountedRef.current && requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={styles.labelRow}>
            <View style={styles.signal} />
            <Text style={styles.label}>Resumo inteligente</Text>
          </View>
          <Text style={styles.helper}>Gere sob demanda com a leitura atual, alertas ativos e historico sem duplicar eventos abertos.</Text>
        </View>
        {generatedLabel ? <Text style={styles.time}>Gerado {generatedLabel}</Text> : null}
      </View>
      <Text accessibilityLiveRegion={typing ? 'none' : 'polite'} style={[styles.briefing, !visibleBriefing && styles.placeholder]}>
        {visibleBriefing ? `${visibleBriefing}${typing ? '|' : ''}` : 'Clique em Gerar Resumo Missao para criar uma analise fixa deste momento operacional.'}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <ActionButton disabled={loading} onPress={generateBriefing}>
          {loading ? 'Gerando resumo...' : 'Gerar Resumo Missao'}
        </ActionButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  signal: {
    backgroundColor: Palette.accent,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  label: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  helper: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  time: {
    color: Palette.subtle,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    paddingTop: 1,
  },
  briefing: {
    color: Palette.text,
    fontSize: 15,
    lineHeight: 23,
  },
  placeholder: {
    color: Palette.muted,
  },
  error: {
    color: Palette.yellow,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 10,
  },
  actions: {
    marginTop: 14,
  },
});
