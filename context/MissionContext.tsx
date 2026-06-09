import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useReducer } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  buildAlerts,
  calculateRisk,
  createSnapshot,
  defaultProfile,
  defaultThresholds,
  initialHistory,
} from '@/data/missionSimulation';
import type {
  AlertHistoryItem,
  AlertHistoryStatus,
  AlertThresholds,
  AppUser,
  MissionAlert,
  MissionProfile,
  MissionRisk,
  StoredMission,
  TelemetrySnapshot,
} from '@/types/mission';

type MissionState = {
  acknowledgedAlertIds: string[];
  activeMissionId: string | null;
  alertHistory: AlertHistoryItem[];
  alerts: MissionAlert[];
  history: TelemetrySnapshot[];
  hydrated: boolean;
  missions: StoredMission[];
  profile: MissionProfile;
  risk: MissionRisk;
  telemetry: TelemetrySnapshot;
  thresholds: AlertThresholds;
};

type MissionContextValue = MissionState & {
  activeMission: StoredMission | null;
  createMission: (profile: MissionProfile, thresholds: AlertThresholds) => void;
  deleteAlertHistory: (historyId: string) => void;
  leaveMission: (missionId: string) => void;
  resetSimulation: () => void;
  resolveAlert: (id: string) => void;
  resolveAlertHistory: (historyId: string) => void;
  selectMission: (missionId: string) => void;
  updateProfile: (profile: MissionProfile) => void;
  updateThresholds: (thresholds: AlertThresholds) => void;
};

type HydratePayload = {
  activeMissionId: string;
  missions: StoredMission[];
};

type MissionAction =
  | { type: 'create_mission'; payload: { ownerId: string; profile: MissionProfile; thresholds: AlertThresholds } }
  | { type: 'delete_alert_history'; payload: string }
  | { type: 'hydrate'; payload: HydratePayload }
  | { type: 'leave_mission'; payload: { missionId: string; ownerId: string } }
  | { type: 'loading' }
  | { type: 'reset_simulation' }
  | { type: 'resolve_alert'; payload: { alertId: string; user: AppUser } }
  | { type: 'resolve_alert_history'; payload: { historyId: string; user: AppUser } }
  | { type: 'select_mission'; payload: string }
  | { type: 'tick' }
  | { type: 'update_profile'; payload: MissionProfile }
  | { type: 'update_thresholds'; payload: AlertThresholds };

const initialTelemetry = initialHistory[initialHistory.length - 1];
const initialAlerts = buildAlerts(initialTelemetry, defaultThresholds);

const initialState: MissionState = {
  acknowledgedAlertIds: [],
  activeMissionId: null,
  alertHistory: [],
  alerts: initialAlerts,
  history: initialHistory,
  hydrated: false,
  missions: [],
  profile: defaultProfile,
  risk: calculateRisk(initialAlerts, initialTelemetry),
  telemetry: initialTelemetry,
  thresholds: defaultThresholds,
};

const MissionContext = createContext<MissionContextValue | null>(null);

function userMissionKeys(userId: string) {
  return {
    activeMissionId: `@global-solution-cpad/users/${userId}/active-mission-id`,
    missions: `@global-solution-cpad/users/${userId}/missions`,
  };
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneInitialHistory() {
  return initialHistory.map((snapshot) => ({ ...snapshot }));
}

function createDefaultMission(ownerId: string, profile?: Partial<MissionProfile>, thresholds?: Partial<AlertThresholds>): StoredMission {
  const now = new Date().toISOString();
  const nextProfile = { ...defaultProfile, ...profile };

  return {
    acknowledgedAlertIds: [],
    alertHistory: [],
    createdAt: now,
    history: cloneInitialHistory(),
    id: createId('mission'),
    ownerId,
    profile: {
      ...nextProfile,
      name: nextProfile.name?.trim() || defaultProfile.name,
    },
    thresholds: { ...defaultThresholds, ...thresholds },
    updatedAt: now,
  };
}

function parseMissions(value: string | null): StoredMission[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as StoredMission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMission(mission: StoredMission): StoredMission {
  const normalizedMission = {
    ...mission,
    profile: { ...defaultProfile, ...mission.profile },
  };

  return {
    acknowledgedAlertIds: Array.isArray(mission.acknowledgedAlertIds) ? mission.acknowledgedAlertIds : [],
    alertHistory: Array.isArray(mission.alertHistory)
      ? mission.alertHistory.map((item) => normalizeAlertHistoryItem(item, normalizedMission)).filter((item): item is AlertHistoryItem => Boolean(item))
      : [],
    createdAt: mission.createdAt,
    history: Array.isArray(mission.history) && mission.history.length ? mission.history.slice(-18) : cloneInitialHistory(),
    id: mission.id,
    ownerId: mission.ownerId,
    profile: normalizedMission.profile,
    thresholds: { ...defaultThresholds, ...mission.thresholds },
    updatedAt: mission.updatedAt,
  };
}

function normalizeAlertHistoryItem(item: AlertHistoryItem, mission: Pick<StoredMission, 'createdAt' | 'id' | 'profile'>): AlertHistoryItem | null {
  const sourceAlertId = item.sourceAlertId || item.id;

  if (!sourceAlertId || !item.title) {
    return null;
  }

  const firstSeenAt = item.firstSeenAt || item.createdAt || item.resolvedAt || mission.createdAt;
  const lastSeenAt = item.lastSeenAt || item.resolvedAt || item.createdAt || firstSeenAt;
  const status: AlertHistoryStatus = item.status || (item.resolvedAt ? 'resolved' : 'inactive');

  return {
    ...item,
    acknowledged: status === 'resolved' || Boolean(item.acknowledged),
    createdAt: item.createdAt || firstSeenAt,
    firstSeenAt,
    historyId: item.historyId || createId('alert-history'),
    lastSeenAt,
    missionId: item.missionId || mission.id,
    missionName: item.missionName || mission.profile.name,
    resolvedAt: item.resolvedAt,
    resolvedByName: item.resolvedByName,
    resolvedByUserId: item.resolvedByUserId,
    sourceAlertId,
    status,
  };
}

function getActiveMission(state: MissionState) {
  return state.missions.find((mission) => mission.id === state.activeMissionId) ?? null;
}

function rebuildMission(mission: StoredMission, overrides: Partial<StoredMission> = {}) {
  const merged: StoredMission = {
    ...mission,
    ...overrides,
    profile: { ...mission.profile, ...overrides.profile },
    thresholds: { ...mission.thresholds, ...overrides.thresholds },
  };
  const history = merged.history.length ? merged.history.slice(-18) : cloneInitialHistory();
  const telemetry = history[history.length - 1] ?? initialTelemetry;
  const rawAlerts = buildAlerts(telemetry, merged.thresholds);
  const rawAlertIds = rawAlerts.map((alert) => alert.id);
  const acknowledgedAlertIds = merged.acknowledgedAlertIds.filter((id) => rawAlertIds.includes(id));
  const alerts = buildAlerts(telemetry, merged.thresholds, acknowledgedAlertIds);
  const alertHistory = syncAlertHistory({ ...merged, acknowledgedAlertIds, history }, alerts);
  const updatedMission: StoredMission = {
    ...merged,
    acknowledgedAlertIds,
    alertHistory,
    history,
    updatedAt: new Date().toISOString(),
  };

  return {
    alerts,
    mission: updatedMission,
    risk: calculateRisk(alerts, telemetry),
    telemetry,
  };
}

function replaceMission(missions: StoredMission[], mission: StoredMission) {
  return missions.map((item) => (item.id === mission.id ? mission : item));
}

function sortAlertHistory(alertHistory: AlertHistoryItem[]) {
  return [...alertHistory]
    .sort((a, b) => new Date(b.resolvedAt || b.lastSeenAt || b.createdAt).getTime() - new Date(a.resolvedAt || a.lastSeenAt || a.createdAt).getTime())
    .slice(0, 80);
}

function syncAlertHistory(mission: StoredMission, alerts: MissionAlert[]) {
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
  const activeAlertIds = new Set(activeAlerts.map((alert) => alert.id));
  const nextHistory = mission.alertHistory.map((item) => {
    if (item.status === 'active' && !activeAlertIds.has(item.sourceAlertId)) {
      return {
        ...item,
        acknowledged: false,
        status: 'inactive' as const,
      };
    }

    return item;
  });

  activeAlerts.forEach((alert) => {
    const currentIndex = nextHistory.findIndex((item) => item.sourceAlertId === alert.id && item.status === 'active');

    if (currentIndex >= 0) {
      nextHistory[currentIndex] = {
        ...nextHistory[currentIndex],
        ...alert,
        firstSeenAt: nextHistory[currentIndex].firstSeenAt,
        historyId: nextHistory[currentIndex].historyId,
        lastSeenAt: alert.createdAt,
        missionId: mission.id,
        missionName: mission.profile.name,
        resolvedAt: undefined,
        resolvedByName: undefined,
        resolvedByUserId: undefined,
        sourceAlertId: alert.id,
        status: 'active',
      };

      return;
    }

    nextHistory.unshift({
      ...alert,
      firstSeenAt: alert.createdAt,
      historyId: createId('alert-history'),
      lastSeenAt: alert.createdAt,
      missionId: mission.id,
      missionName: mission.profile.name,
      resolvedAt: undefined,
      resolvedByName: undefined,
      resolvedByUserId: undefined,
      sourceAlertId: alert.id,
      status: 'active',
    });
  });

  return sortAlertHistory(nextHistory);
}

function applyActiveMission(state: MissionState, missions: StoredMission[], activeMissionId: string | null, hydrated = state.hydrated): MissionState {
  const activeMission = missions.find((mission) => mission.id === activeMissionId) ?? missions[0] ?? null;

  if (!activeMission) {
    return {
      ...initialState,
      hydrated,
    };
  }

  const rebuilt = rebuildMission(activeMission);
  const nextMissions = replaceMission(missions, rebuilt.mission);

  return {
    acknowledgedAlertIds: rebuilt.mission.acknowledgedAlertIds,
    activeMissionId: rebuilt.mission.id,
    alertHistory: rebuilt.mission.alertHistory,
    alerts: rebuilt.alerts,
    history: rebuilt.mission.history,
    hydrated,
    missions: nextMissions,
    profile: rebuilt.mission.profile,
    risk: rebuilt.risk,
    telemetry: rebuilt.telemetry,
    thresholds: rebuilt.mission.thresholds,
  };
}

function reducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case 'loading':
      return { ...initialState, hydrated: false };

    case 'hydrate':
      return applyActiveMission(state, action.payload.missions.map(normalizeMission), action.payload.activeMissionId, true);

    case 'tick': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const telemetry = createSnapshot(activeMission.history[activeMission.history.length - 1]);
      const history = [...activeMission.history.slice(-17), telemetry];
      const rebuilt = rebuildMission(activeMission, { history });

      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'update_thresholds': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const rebuilt = rebuildMission(activeMission, { thresholds: action.payload });
      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'update_profile': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const rebuilt = rebuildMission(activeMission, { profile: action.payload });
      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'resolve_alert': {
      const activeMission = getActiveMission(state);
      const alert = state.alerts.find((item) => item.id === action.payload.alertId && !item.acknowledged);

      if (!activeMission || !alert) {
        return state;
      }

      const now = new Date().toISOString();
      const existingHistoryIndex = activeMission.alertHistory.findIndex((item) => item.sourceAlertId === alert.id && item.status === 'active');
      const nextHistory = [...activeMission.alertHistory];

      if (existingHistoryIndex >= 0) {
        nextHistory[existingHistoryIndex] = {
          ...nextHistory[existingHistoryIndex],
          ...alert,
          acknowledged: true,
          lastSeenAt: alert.createdAt,
          missionId: activeMission.id,
          missionName: activeMission.profile.name,
          resolvedAt: now,
          resolvedByName: action.payload.user.name,
          resolvedByUserId: action.payload.user.id,
          sourceAlertId: alert.id,
          status: 'resolved',
        };
      } else {
        nextHistory.unshift({
          ...alert,
          acknowledged: true,
          firstSeenAt: alert.createdAt,
          historyId: createId('alert-history'),
          lastSeenAt: alert.createdAt,
          missionId: activeMission.id,
          missionName: activeMission.profile.name,
          resolvedAt: now,
          resolvedByName: action.payload.user.name,
          resolvedByUserId: action.payload.user.id,
          sourceAlertId: alert.id,
          status: 'resolved',
        });
      }

      const rebuilt = rebuildMission(activeMission, {
        acknowledgedAlertIds: Array.from(new Set([...activeMission.acknowledgedAlertIds, alert.id])),
        alertHistory: sortAlertHistory(nextHistory),
      });

      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'resolve_alert_history': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const now = new Date().toISOString();
      const nextHistory = activeMission.alertHistory.map((item) => {
        if (item.historyId !== action.payload.historyId || item.status !== 'inactive') {
          return item;
        }

        return {
          ...item,
          acknowledged: true,
          resolvedAt: now,
          resolvedByName: action.payload.user.name,
          resolvedByUserId: action.payload.user.id,
          status: 'resolved' as const,
        };
      });

      const rebuilt = rebuildMission(activeMission, {
        alertHistory: sortAlertHistory(nextHistory),
      });

      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'delete_alert_history': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const rebuilt = rebuildMission(activeMission, {
        alertHistory: activeMission.alertHistory.filter((item) => item.historyId !== action.payload),
      });

      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'reset_simulation': {
      const activeMission = getActiveMission(state);

      if (!activeMission) {
        return state;
      }

      const rebuilt = rebuildMission(activeMission, {
        acknowledgedAlertIds: [],
        alertHistory: [],
        history: cloneInitialHistory(),
      });

      return applyActiveMission(state, replaceMission(state.missions, rebuilt.mission), rebuilt.mission.id);
    }

    case 'create_mission': {
      const nextMission = createDefaultMission(action.payload.ownerId, action.payload.profile, action.payload.thresholds);
      return applyActiveMission(state, [...state.missions, nextMission], nextMission.id);
    }

    case 'select_mission':
      return applyActiveMission(state, state.missions, action.payload);

    case 'leave_mission': {
      const remaining = state.missions.filter((mission) => mission.id !== action.payload.missionId);
      const nextMissions = remaining.length ? remaining : [createDefaultMission(action.payload.ownerId)];
      const activeMissionId = state.activeMissionId === action.payload.missionId ? nextMissions[0].id : state.activeMissionId;

      return applyActiveMission(state, nextMissions, activeMissionId);
    }

    default:
      return state;
  }
}

export function MissionProvider({ children }: PropsWithChildren) {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;

    async function loadStoredState(user: AppUser) {
      dispatch({ type: 'loading' });

      const keys = userMissionKeys(user.id);
      const [[, missionsValue], [, activeMissionIdValue]] = await AsyncStorage.multiGet([keys.missions, keys.activeMissionId]);
      let missions = parseMissions(missionsValue)
        .filter((mission) => mission.ownerId === user.id)
        .map(normalizeMission);

      if (!missions.length) {
        missions = [createDefaultMission(user.id)];
      }

      const activeMissionId = missions.some((mission) => mission.id === activeMissionIdValue)
        ? String(activeMissionIdValue)
        : missions[0].id;

      await AsyncStorage.multiSet([
        [keys.missions, JSON.stringify(missions)],
        [keys.activeMissionId, activeMissionId],
      ]);

      if (mounted) {
        dispatch({ type: 'hydrate', payload: { activeMissionId, missions } });
      }
    }

    if (!currentUser) {
      dispatch({ type: 'loading' });
      return () => {
        mounted = false;
      };
    }

    loadStoredState(currentUser).catch(() => {
      if (mounted) {
        const mission = createDefaultMission(currentUser.id);
        dispatch({ type: 'hydrate', payload: { activeMissionId: mission.id, missions: [mission] } });
      }
    });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!state.hydrated || !currentUser) {
      return;
    }

    const keys = userMissionKeys(currentUser.id);
    AsyncStorage.multiSet([
      [keys.missions, JSON.stringify(state.missions)],
      [keys.activeMissionId, state.activeMissionId ?? ''],
    ]).catch(() => undefined);
  }, [currentUser, state.activeMissionId, state.hydrated, state.missions]);

  useEffect(() => {
    if (!currentUser || !state.hydrated) {
      return undefined;
    }

    const interval = setInterval(() => dispatch({ type: 'tick' }), 4000);

    return () => clearInterval(interval);
  }, [currentUser, state.hydrated]);

  const activeMission = getActiveMission(state);
  const value: MissionContextValue = {
    ...state,
    activeMission,
    createMission: (profile, thresholds) => {
      if (currentUser) {
        dispatch({ type: 'create_mission', payload: { ownerId: currentUser.id, profile, thresholds } });
      }
    },
    deleteAlertHistory: (historyId) => dispatch({ type: 'delete_alert_history', payload: historyId }),
    leaveMission: (missionId) => {
      if (currentUser) {
        dispatch({ type: 'leave_mission', payload: { missionId, ownerId: currentUser.id } });
      }
    },
    resetSimulation: () => dispatch({ type: 'reset_simulation' }),
    resolveAlert: (id) => {
      if (currentUser) {
        dispatch({ type: 'resolve_alert', payload: { alertId: id, user: currentUser } });
      }
    },
    resolveAlertHistory: (historyId) => {
      if (currentUser) {
        dispatch({ type: 'resolve_alert_history', payload: { historyId, user: currentUser } });
      }
    },
    selectMission: (missionId) => dispatch({ type: 'select_mission', payload: missionId }),
    updateProfile: (profile) => dispatch({ type: 'update_profile', payload: profile }),
    updateThresholds: (thresholds) => dispatch({ type: 'update_thresholds', payload: thresholds }),
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const context = useContext(MissionContext);

  if (!context) {
    throw new Error('useMission must be used inside MissionProvider');
  }

  return context;
}
