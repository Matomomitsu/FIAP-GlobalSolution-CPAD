export type NumericTelemetryKey =
  | 'temperature'
  | 'radiation'
  | 'battery'
  | 'solarInput'
  | 'powerDraw'
  | 'signal'
  | 'latency'
  | 'packetLoss'
  | 'orbitalStability';

export type TelemetrySnapshot = Record<NumericTelemetryKey, number> & {
  id: string;
  timestamp: string;
};

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertHistoryStatus = 'active' | 'inactive' | 'resolved';

export type MissionAlert = {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  metric: string;
  value: number;
  threshold: string;
  createdAt: string;
  acknowledged: boolean;
};

export type AlertHistoryItem = MissionAlert & {
  firstSeenAt: string;
  historyId: string;
  lastSeenAt: string;
  missionId: string;
  missionName: string;
  resolvedAt?: string;
  resolvedByName?: string;
  resolvedByUserId?: string;
  sourceAlertId: string;
  status: AlertHistoryStatus;
};

export type AlertThresholds = {
  temperatureMax: number;
  radiationMax: number;
  batteryMin: number;
  signalMin: number;
  latencyMax: number;
  stabilityMin: number;
};

export type MissionProfile = {
  name: string;
  orbit: string;
  crew: string;
  objective: string;
};

export type AppUser = {
  createdAt: string;
  email: string;
  id: string;
  name: string;
};

export type StoredMission = {
  acknowledgedAlertIds: string[];
  alertHistory: AlertHistoryItem[];
  createdAt: string;
  history: TelemetrySnapshot[];
  id: string;
  ownerId: string;
  profile: MissionProfile;
  thresholds: AlertThresholds;
  updatedAt: string;
};

export type MissionRisk = {
  label: string;
  score: number;
  color: string;
  summary: string;
};
