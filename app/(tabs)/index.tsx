import { StyleSheet, Text, View } from 'react-native';

import { AiBriefing } from '@/components/AiBriefing';
import { AsteroidMonitorPanel } from '@/components/AsteroidMonitorPanel';
import { MetricCard } from '@/components/MetricCard';
import { DataRow, Grid, PageHeader, Readout, Stack, StatusBadge } from '@/components/OperationsUI';
import { Panel } from '@/components/Panel';
import { Screen } from '@/components/Screen';
import { Palette, Radius } from '@/constants/Colors';
import { useMission } from '@/context/MissionContext';

export default function MissionScreen() {
  const { alertHistory, alerts, history, profile, risk, telemetry, thresholds } = useMission();
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
  const visibleAlertHistory = alertHistory.filter((alert) => alert.status !== 'active');
  const lastUpdated = new Date(telemetry.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const first = history[0] ?? telemetry;
  const batteryProjection = Math.max(0, telemetry.battery - Math.max(telemetry.powerDraw - telemetry.solarInput, 0) * 0.05);
  const signalTrend = telemetry.signal - first.signal;
  const energyBalance = telemetry.solarInput - telemetry.powerDraw;
  const activeAlertColor = activeAlerts.some((alert) => alert.severity === 'critical') ? Palette.red : activeAlerts.length ? Palette.yellow : Palette.green;

  return (
    <Screen>
      <PageHeader
        description="Painel mobile para acompanhar telemetria, risco, predicao e consciencia orbital da missao simulada."
        eyebrow="Astra command"
        right={<StatusBadge color={risk.color} label={risk.label} tone="solid" />}
        title="Centro preditivo"
      />

      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.missionIdentity}>
            <Text style={styles.kicker}>Missao ativa</Text>
            <Text style={styles.missionName}>{profile.name}</Text>
            <Text style={styles.missionMeta}>{profile.orbit} | {profile.crew}</Text>
          </View>
          <View style={[styles.riskDial, { borderColor: risk.color }]}> 
            <Text style={styles.riskDialLabel}>Risco</Text>
            <Text style={[styles.riskDialValue, { color: risk.color }]}>{risk.score}</Text>
            <Text style={styles.riskDialUnit}>/100</Text>
          </View>
        </View>

        <Text style={styles.heroSummary}>{risk.summary}</Text>

        <View style={styles.readoutGrid}>
          <Readout accent={Palette.accent} label="Ultima leitura" value={lastUpdated} />
          <Readout accent={activeAlertColor} label="Alertas" suffix="ativos" value={activeAlerts.length} />
          <Readout accent={energyBalance < 0 ? Palette.yellow : Palette.green} label="Balanco" suffix="kW" value={`${energyBalance >= 0 ? '+' : ''}${energyBalance.toFixed(1)}`} />
        </View>
      </View>

      <Grid>
        <MetricCard
          color={telemetry.battery <= thresholds.batteryMin ? Palette.red : Palette.green}
          helper="Reserva dos sistemas essenciais."
          label="Energia"
          progress={telemetry.battery}
          unit="%"
          value={telemetry.battery}
        />
        <MetricCard
          color={telemetry.temperature >= thresholds.temperatureMax ? Palette.red : Palette.yellow}
          helper="Media termica dos modulos."
          label="Temperatura"
          progress={(telemetry.temperature / 58) * 100}
          unit="C"
          value={telemetry.temperature}
        />
        <MetricCard
          color={telemetry.signal <= thresholds.signalMin ? Palette.red : Palette.cyan}
          helper="Qualidade do enlace atual."
          label="Sinal"
          progress={telemetry.signal}
          unit="%"
          value={telemetry.signal}
        />
        <MetricCard
          color={telemetry.orbitalStability <= thresholds.stabilityMin ? Palette.red : Palette.indigo}
          helper="Atitude e estabilidade orbital."
          label="Estabilidade"
          progress={telemetry.orbitalStability}
          unit="%"
          value={telemetry.orbitalStability}
        />
      </Grid>

      <Panel title="Analise de bordo" caption="Briefing operacional e predicoes de curto prazo.">
        <AiBriefing
          alertHistory={visibleAlertHistory}
          alerts={activeAlerts}
          batteryProjection={batteryProjection}
          missionName={profile.name}
          risk={risk}
          signalTrend={signalTrend}
          telemetry={telemetry}
        />
        <Stack>
          <DataRow
            detail="Estimativa considerando consumo acima da geracao."
            label="Bateria prevista"
            value={`${batteryProjection.toFixed(1)}%`}
            valueColor={batteryProjection < thresholds.batteryMin ? Palette.yellow : Palette.green}
          />
          <DataRow
            detail="Comparacao entre a primeira e a ultima leitura da janela."
            label="Tendencia de sinal"
            value={`${signalTrend >= 0 ? '+' : ''}${signalTrend.toFixed(1)} pts`}
            valueColor={signalTrend < 0 ? Palette.yellow : Palette.green}
          />
        </Stack>
      </Panel>

      <Panel title="Consciencia orbital" caption="Monitoramento de objetos proximos a Terra para contexto de risco externo.">
        <AsteroidMonitorPanel />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Palette.panel,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    gap: 16,
    overflow: 'hidden',
    padding: 20,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  missionIdentity: {
    flex: 1,
  },
  kicker: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  missionName: {
    color: Palette.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 31,
  },
  missionMeta: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  riskDial: {
    alignItems: 'center',
    backgroundColor: Palette.cardMuted,
    borderRadius: 999,
    borderWidth: 2,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  riskDialLabel: {
    color: Palette.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  riskDialValue: {
    fontSize: 36,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 40,
  },
  riskDialUnit: {
    color: Palette.subtle,
    fontSize: 11,
    fontWeight: '800',
  },
  heroSummary: {
    color: Palette.textSoft,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  readoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
