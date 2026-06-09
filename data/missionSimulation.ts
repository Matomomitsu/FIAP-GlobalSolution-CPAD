import type {
  AlertThresholds,
  MissionAlert,
  MissionProfile,
  MissionRisk,
  TelemetrySnapshot,
} from '@/types/mission';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const jitter = (amount: number) => (Math.random() * 2 - 1) * amount;

export const defaultProfile: MissionProfile = {
  name: 'Astra-7 Orbital Lab',
  orbit: 'LEO 408 km',
  crew: '3 operadores',
  objective: 'Monitorar telemetria, energia e estabilidade orbital em tempo real simulado.',
};

export const defaultThresholds: AlertThresholds = {
  temperatureMax: 42,
  radiationMax: 1.4,
  batteryMin: 35,
  signalMin: 70,
  latencyMax: 420,
  stabilityMin: 82,
};

function snapshotFromOffset(minutesAgo: number, overrides: Partial<TelemetrySnapshot> = {}): TelemetrySnapshot {
  const timestamp = new Date(Date.now() - minutesAgo * 60_000).toISOString();

  return {
    id: `${timestamp}-${minutesAgo}`,
    timestamp,
    temperature: round(35 + minutesAgo * 0.25),
    radiation: round(0.6 + minutesAgo * 0.03),
    battery: round(82 - minutesAgo * 1.6),
    solarInput: round(62 - minutesAgo * 0.4),
    powerDraw: round(49 + minutesAgo * 0.8),
    signal: round(86 - minutesAgo * 2.1),
    latency: round(240 + minutesAgo * 18, 0),
    packetLoss: round(0.8 + minutesAgo * 0.18),
    orbitalStability: round(96 - minutesAgo * 1.2),
    ...overrides,
  };
}

export const initialHistory: TelemetrySnapshot[] = [
  snapshotFromOffset(8),
  snapshotFromOffset(7),
  snapshotFromOffset(6),
  snapshotFromOffset(5),
  snapshotFromOffset(4),
  snapshotFromOffset(3),
  snapshotFromOffset(2),
  snapshotFromOffset(1, {
    signal: 68,
    latency: 436,
    orbitalStability: 84,
  }),
];

export function createSnapshot(previous = initialHistory.at(-1)): TelemetrySnapshot {
  const now = new Date();
  const phase = now.getTime() / 90_000;
  const solarWave = Math.sin(phase) * 5;
  const communicationWave = Math.cos(phase * 0.8) * 3;

  return {
    id: `${now.getTime()}`,
    timestamp: now.toISOString(),
    temperature: round(clamp((previous?.temperature ?? 37) + jitter(1.3), 24, 58)),
    radiation: round(clamp((previous?.radiation ?? 0.8) + jitter(0.08), 0.2, 2.4)),
    battery: round(clamp((previous?.battery ?? 72) + solarWave * 0.08 - jitter(1.2), 8, 100)),
    solarInput: round(clamp((previous?.solarInput ?? 58) + solarWave + jitter(2.8), 14, 98)),
    powerDraw: round(clamp((previous?.powerDraw ?? 54) + jitter(2.2), 28, 94)),
    signal: round(clamp((previous?.signal ?? 76) + communicationWave + jitter(2.5), 35, 100)),
    latency: round(clamp((previous?.latency ?? 310) - communicationWave * 8 + jitter(32), 90, 720), 0),
    packetLoss: round(clamp((previous?.packetLoss ?? 1.5) + jitter(0.5), 0, 12)),
    orbitalStability: round(clamp((previous?.orbitalStability ?? 91) + jitter(1.1), 62, 100)),
  };
}

export function buildAlerts(
  telemetry: TelemetrySnapshot,
  thresholds: AlertThresholds,
  acknowledgedIds: string[] = []
): MissionAlert[] {
  const createdAt = telemetry.timestamp;
  const alerts: MissionAlert[] = [];

  const pushAlert = (alert: Omit<MissionAlert, 'createdAt' | 'acknowledged'>) => {
    alerts.push({
      ...alert,
      createdAt,
      acknowledged: acknowledgedIds.includes(alert.id),
    });
  };

  if (telemetry.temperature >= thresholds.temperatureMax) {
    pushAlert({
      id: 'temperature-high',
      title: 'Temperatura acima do limite',
      description: 'Modulo termico exige redistribuicao de carga e verificacao de dissipadores.',
      severity: telemetry.temperature >= thresholds.temperatureMax + 8 ? 'critical' : 'warning',
      metric: 'Temperatura',
      value: telemetry.temperature,
      threshold: `max ${thresholds.temperatureMax} C`,
    });
  }

  if (telemetry.radiation >= thresholds.radiationMax) {
    pushAlert({
      id: 'radiation-high',
      title: 'Radiacao elevada',
      description: 'Blindagem e rotas de operacao devem ser priorizadas ate estabilizacao.',
      severity: telemetry.radiation >= thresholds.radiationMax + 0.5 ? 'critical' : 'warning',
      metric: 'Radiacao',
      value: telemetry.radiation,
      threshold: `max ${thresholds.radiationMax} mSv/h`,
    });
  }

  if (telemetry.battery <= thresholds.batteryMin) {
    pushAlert({
      id: 'battery-low',
      title: 'Energia abaixo do seguro',
      description: 'Consumo supera a geracao prevista. Reduza cargas nao essenciais.',
      severity: telemetry.battery <= thresholds.batteryMin - 12 ? 'critical' : 'warning',
      metric: 'Bateria',
      value: telemetry.battery,
      threshold: `min ${thresholds.batteryMin}%`,
    });
  }

  if (telemetry.signal <= thresholds.signalMin) {
    pushAlert({
      id: 'signal-low',
      title: 'Sinal de telemetria degradado',
      description: 'Janela de comunicacao instavel. Reoriente antenas ou aguarde proximo enlace.',
      severity: telemetry.signal <= thresholds.signalMin - 12 ? 'critical' : 'warning',
      metric: 'Sinal',
      value: telemetry.signal,
      threshold: `min ${thresholds.signalMin}%`,
    });
  }

  if (telemetry.latency >= thresholds.latencyMax) {
    pushAlert({
      id: 'latency-high',
      title: 'Latencia de comunicacao alta',
      description: 'Pacotes de comando podem sofrer atraso. Priorize telemetria essencial.',
      severity: telemetry.latency >= thresholds.latencyMax + 140 ? 'critical' : 'warning',
      metric: 'Latencia',
      value: telemetry.latency,
      threshold: `max ${thresholds.latencyMax} ms`,
    });
  }

  if (telemetry.orbitalStability <= thresholds.stabilityMin) {
    pushAlert({
      id: 'stability-low',
      title: 'Estabilidade orbital critica',
      description: 'Modelo preditivo recomenda revisar atitude e microcorrecoes de trajetoria.',
      severity: telemetry.orbitalStability <= thresholds.stabilityMin - 8 ? 'critical' : 'warning',
      metric: 'Estabilidade',
      value: telemetry.orbitalStability,
      threshold: `min ${thresholds.stabilityMin}%`,
    });
  }

  return alerts;
}

export function calculateRisk(alerts: MissionAlert[], telemetry: TelemetrySnapshot): MissionRisk {
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const warningCount = alerts.filter((alert) => alert.severity === 'warning').length;
  const energyPressure = telemetry.powerDraw > telemetry.solarInput ? 8 : 0;
  const score = Math.min(99, 18 + criticalCount * 28 + warningCount * 14 + energyPressure);

  if (score >= 70) {
    return {
      label: 'Critico',
      score,
      color: '#ff5a7a',
      summary: 'Intervencao recomendada antes da proxima janela operacional.',
    };
  }

  if (score >= 42) {
    return {
      label: 'Atencao',
      score,
      color: '#ffbe55',
      summary: 'Acompanhe tendencias e ajuste limites se a missao mudar de fase.',
    };
  }

  return {
    label: 'Nominal',
    score,
    color: '#63f7b4',
    summary: 'Sistemas dentro da faixa esperada para a missao simulada.',
  };
}
