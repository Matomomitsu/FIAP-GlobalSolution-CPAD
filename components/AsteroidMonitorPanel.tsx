import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { environment } from '@/config/environment';
import { Palette, Radius } from '@/constants/Colors';

type NeoWsAsteroid = {
  close_approach_data: Array<{
    close_approach_date: string;
    miss_distance: {
      kilometers: string;
      lunar: string;
    };
    orbiting_body: string;
    relative_velocity: {
      kilometers_per_second: string;
    };
  }>;
  estimated_diameter: {
    meters: {
      estimated_diameter_max: number;
      estimated_diameter_min: number;
    };
  };
  id: string;
  is_potentially_hazardous_asteroid: boolean;
  name: string;
};

type NeoWsResponse = {
  near_earth_objects: Record<string, NeoWsAsteroid[]>;
};

type AsteroidApproach = {
  date: string;
  diameterMeters: number;
  distanceKm: number;
  distanceLunar: number;
  id: string;
  name: string;
  orbitingBody: string;
  potentiallyHazardous: boolean;
  velocityKps: number;
  diameterMinMeters: number;
  diameterMaxMeters: number;
};

type AsteroidMonitorData = {
  approaches?: AsteroidApproach[];
  averageDiameterMeters?: number;
  averageDistanceLunar?: number;
  averageVelocityKps?: number;
  closest?: AsteroidApproach;
  fastest?: AsteroidApproach;
  hazardous: number;
  largest?: AsteroidApproach;
  total: number;
  windowEnd: string;
  windowStart: string;
};

type AsteroidState =
  | { status: 'loading' }
  | { status: 'ready'; data: AsteroidMonitorData }
  | { status: 'error'; message: string };

type CachedAsteroidMonitor = {
  cachedForDate: string;
  data: AsteroidMonitorData;
};

const ASTEROID_CACHE_KEY = '@global-solution-cpad/asteroid-monitor';
const nasaApiKey = environment.nasaApiKey;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function parseCachedMonitor(value: string | null): CachedAsteroidMonitor | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CachedAsteroidMonitor;
  } catch {
    return null;
  }
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeApproach(approach: AsteroidApproach | undefined): AsteroidApproach | undefined {
  if (!approach) {
    return undefined;
  }

  const diameterMeters = safeNumber(approach.diameterMeters);
  const diameterMinMeters = safeNumber(approach.diameterMinMeters, diameterMeters);
  const diameterMaxMeters = safeNumber(approach.diameterMaxMeters, diameterMeters);

  return {
    date: typeof approach.date === 'string' ? approach.date : 'data nao informada',
    diameterMaxMeters,
    diameterMeters,
    diameterMinMeters,
    distanceKm: safeNumber(approach.distanceKm),
    distanceLunar: safeNumber(approach.distanceLunar),
    id: typeof approach.id === 'string' ? approach.id : `${approach.name}-${approach.date}`,
    name: typeof approach.name === 'string' ? approach.name : 'Objeto monitorado',
    orbitingBody: typeof approach.orbitingBody === 'string' ? approach.orbitingBody : 'Terra',
    potentiallyHazardous: Boolean(approach.potentiallyHazardous),
    velocityKps: safeNumber(approach.velocityKps),
  };
}

function uniqueApproaches(approaches: AsteroidApproach[]) {
  const byId = new Map<string, AsteroidApproach>();

  approaches.forEach((approach) => {
    byId.set(approach.id, approach);
  });

  return Array.from(byId.values());
}

function normalizeMonitorData(data: AsteroidMonitorData): AsteroidMonitorData {
  const cachedApproaches = [
    ...(data.approaches ?? []),
    data.closest,
    data.fastest,
    data.largest,
  ]
    .map(normalizeApproach)
    .filter((approach): approach is AsteroidApproach => Boolean(approach));
  const approaches = uniqueApproaches(cachedApproaches).sort((a, b) => a.distanceKm - b.distanceKm);
  const closest = normalizeApproach(data.closest) ?? approaches[0];
  const fastest = normalizeApproach(data.fastest) ?? [...approaches].sort((a, b) => b.velocityKps - a.velocityKps)[0];
  const largest = normalizeApproach(data.largest) ?? [...approaches].sort((a, b) => b.diameterMeters - a.diameterMeters)[0];
  const totals = approaches.reduce(
    (acc, approach) => ({
      diameter: acc.diameter + approach.diameterMeters,
      distance: acc.distance + approach.distanceLunar,
      velocity: acc.velocity + approach.velocityKps,
    }),
    { diameter: 0, distance: 0, velocity: 0 }
  );
  const totalForAverage = approaches.length || 1;

  return {
    approaches,
    averageDiameterMeters: safeNumber(data.averageDiameterMeters, totals.diameter / totalForAverage),
    averageDistanceLunar: safeNumber(data.averageDistanceLunar, totals.distance / totalForAverage),
    averageVelocityKps: safeNumber(data.averageVelocityKps, totals.velocity / totalForAverage),
    closest,
    fastest,
    hazardous: safeNumber(data.hazardous, approaches.filter((approach) => approach.potentiallyHazardous).length),
    largest,
    total: safeNumber(data.total, approaches.length),
    windowEnd: data.windowEnd,
    windowStart: data.windowStart,
  };
}

function getDiameterMeters(asteroid: NeoWsAsteroid) {
  const meters = asteroid.estimated_diameter.meters;
  return (meters.estimated_diameter_min + meters.estimated_diameter_max) / 2;
}

function getDiameterRange(asteroid: NeoWsAsteroid) {
  const meters = asteroid.estimated_diameter.meters;

  return {
    max: meters.estimated_diameter_max,
    min: meters.estimated_diameter_min,
  };
}

function mapAsteroid(asteroid: NeoWsAsteroid): AsteroidApproach | null {
  const approach = asteroid.close_approach_data[0];

  if (!approach) {
    return null;
  }

  const diameterRange = getDiameterRange(asteroid);

  return {
    date: approach.close_approach_date,
    diameterMaxMeters: diameterRange.max,
    diameterMeters: getDiameterMeters(asteroid),
    diameterMinMeters: diameterRange.min,
    distanceKm: toNumber(approach.miss_distance.kilometers),
    distanceLunar: toNumber(approach.miss_distance.lunar),
    id: asteroid.id,
    name: asteroid.name.replace(/[()]/g, ''),
    orbitingBody: approach.orbiting_body,
    potentiallyHazardous: asteroid.is_potentially_hazardous_asteroid,
    velocityKps: toNumber(approach.relative_velocity.kilometers_per_second),
  };
}

function buildMonitorData(response: NeoWsResponse, windowStart: string, windowEnd: string): AsteroidMonitorData {
  const approaches = Object.values(response.near_earth_objects)
    .flatMap((asteroids) => asteroids)
    .map(mapAsteroid)
    .filter((approach): approach is AsteroidApproach => Boolean(approach));

  const byDistance = [...approaches].sort((a, b) => a.distanceKm - b.distanceKm);
  const closest = byDistance[0];
  const fastest = [...approaches].sort((a, b) => b.velocityKps - a.velocityKps)[0];
  const largest = [...approaches].sort((a, b) => b.diameterMeters - a.diameterMeters)[0];
  const totals = approaches.reduce(
    (acc, approach) => ({
      diameter: acc.diameter + approach.diameterMeters,
      distance: acc.distance + approach.distanceLunar,
      velocity: acc.velocity + approach.velocityKps,
    }),
    { diameter: 0, distance: 0, velocity: 0 }
  );
  const total = approaches.length || 1;

  return normalizeMonitorData({
    approaches: byDistance.slice(0, 5),
    averageDiameterMeters: totals.diameter / total,
    averageDistanceLunar: totals.distance / total,
    averageVelocityKps: totals.velocity / total,
    closest,
    fastest,
    hazardous: approaches.filter((approach) => approach.potentiallyHazardous).length,
    largest,
    total: approaches.length,
    windowEnd,
    windowStart,
  });
}

function getRisk(data: AsteroidMonitorData) {
  if (data.hazardous > 0) {
    return {
      color: Palette.yellow,
      label: 'Monitorar',
      summary: 'Ha objetos classificados para acompanhamento prioritario na janela analisada.',
    };
  }

  if ((data.closest?.distanceLunar ?? 99) < 3) {
    return {
      color: Palette.accent,
      label: 'Proximo',
      summary: 'A aproximacao mais proxima merece acompanhamento, mas nao indica risco critico.',
    };
  }

  return {
    color: Palette.green,
    label: 'Nominal',
    summary: 'Nenhum objeto monitorado indica prioridade critica para a janela atual.',
  };
}

export function AsteroidMonitorPanel() {
  const [state, setState] = useState<AsteroidState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    async function loadAsteroids() {
      const today = new Date();
      const windowStart = formatDate(today);
      const windowEnd = formatDate(addDays(today, 6));

      try {
        const cached = parseCachedMonitor(await AsyncStorage.getItem(ASTEROID_CACHE_KEY));

        if (cached?.cachedForDate === windowStart) {
          const data = normalizeMonitorData(cached.data);

          await AsyncStorage.setItem(
            ASTEROID_CACHE_KEY,
            JSON.stringify({
              cachedForDate: windowStart,
              data,
            } satisfies CachedAsteroidMonitor)
          );

          if (mounted) {
            setState({ status: 'ready', data });
          }

          return;
        }

        if (!nasaApiKey) {
          if (cached) {
            const data = normalizeMonitorData(cached.data);

            if (mounted) {
              setState({ status: 'ready', data });
            }

            return;
          }

          throw new Error('Nao foi possivel atualizar o monitoramento de asteroides no momento.');
        }

        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${windowStart}&end_date=${windowEnd}&api_key=${encodeURIComponent(nasaApiKey)}`;
        const response = await fetch(url);

        if (!response.ok) {
          if (cached) {
            const data = normalizeMonitorData(cached.data);

            if (mounted) {
              setState({ status: 'ready', data });
            }

            return;
          }

          throw new Error('Monitoramento de asteroides indisponivel no momento.');
        }

        const data = buildMonitorData((await response.json()) as NeoWsResponse, windowStart, windowEnd);

        await AsyncStorage.setItem(
          ASTEROID_CACHE_KEY,
          JSON.stringify({
            cachedForDate: windowStart,
            data,
          } satisfies CachedAsteroidMonitor)
        );

        if (mounted) {
          setState({ status: 'ready', data });
        }
      } catch (error) {
        if (mounted) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Nao foi possivel carregar o monitoramento de asteroides.',
          });
        }
      }
    }

    loadAsteroids();

    return () => {
      mounted = false;
    };
  }, []);

  if (state.status === 'loading') {
    return <Text style={styles.muted}>Atualizando janela de objetos proximos...</Text>;
  }

  if (state.status === 'error') {
    return <Text style={styles.muted}>{state.message}</Text>;
  }

  const data = normalizeMonitorData(state.data);
  const risk = getRisk(data);
  const closest = data.closest;
  const fastest = data.fastest;
  const largest = data.largest;
  const topApproaches = data.approaches ?? [];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.riskStrip, { borderLeftColor: risk.color }]}> 
        <View style={styles.riskHeader}>
          <View style={[styles.riskDot, { backgroundColor: risk.color }]} />
          <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
        </View>
        <Text style={styles.riskSummary}>{risk.summary}</Text>
      </View>

      <View style={styles.grid}>
        <Stat label="Objetos proximos" value={data.total} />
        <Stat label="Potencial risco" value={data.hazardous} color={data.hazardous ? Palette.yellow : Palette.green} />
        <Stat label="Janela" value="7 dias" />
        <Stat label="Vel. media" value={`${safeNumber(data.averageVelocityKps).toFixed(1)} km/s`} />
      </View>

      {closest ? (
        <View style={styles.detailCard}>
          <Text style={styles.sectionLabel}>Aproximacao mais proxima</Text>
          <Text style={styles.name}>{closest.name}</Text>
          <Text style={styles.description}>
            Passagem em {closest.date}, a {safeNumber(closest.distanceLunar).toFixed(2)} distancias lunares de {closest.orbitingBody}. Status: {closest.potentiallyHazardous ? 'monitoramento prioritario' : 'sem prioridade critica'}.
          </Text>
          <View style={styles.metricsRow}>
            <Metric label="Distancia" value={`${Math.round(closest.distanceKm).toLocaleString('pt-BR')} km`} />
            <Metric label="Dist. lunar" value={`${safeNumber(closest.distanceLunar).toFixed(2)} LD`} />
            <Metric label="Velocidade" value={`${safeNumber(closest.velocityKps).toFixed(1)} km/s`} />
            <Metric label="Diametro" value={`${safeNumber(closest.diameterMinMeters, closest.diameterMeters).toFixed(0)}-${safeNumber(closest.diameterMaxMeters, closest.diameterMeters).toFixed(0)} m`} />
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>Nenhum objeto proximo encontrado para a janela atual.</Text>
      )}

      <View style={styles.insightGrid}>
        {largest ? (
          <View style={styles.insightCard}>
            <Text style={styles.sectionLabel}>Maior objeto</Text>
            <Text style={styles.insightTitle}>{largest.name}</Text>
            <Text style={styles.fastest}>{safeNumber(largest.diameterMeters).toFixed(0)} m estimados | {safeNumber(largest.distanceLunar).toFixed(2)} LD</Text>
          </View>
        ) : null}
        {fastest ? (
          <View style={styles.insightCard}>
            <Text style={styles.sectionLabel}>Maior velocidade</Text>
            <Text style={styles.insightTitle}>{fastest.name}</Text>
            <Text style={styles.fastest}>{safeNumber(fastest.velocityKps).toFixed(1)} km/s | {fastest.date}</Text>
          </View>
        ) : null}
      </View>

      {topApproaches.length ? (
        <View style={styles.listCard}>
          <Text style={styles.sectionLabel}>Objetos mais proximos</Text>
          <View style={styles.objectList}>
            {topApproaches.slice(0, 4).map((approach) => (
              <View key={approach.id} style={styles.objectRow}>
                <View style={styles.objectCopy}>
                  <Text style={styles.objectName}>{approach.name}</Text>
                  <Text style={styles.objectMeta}>{approach.date} | {safeNumber(approach.diameterMeters).toFixed(0)} m | {safeNumber(approach.velocityKps).toFixed(1)} km/s</Text>
                </View>
                <View style={styles.distancePill}>
                  <Text style={styles.distanceValue}>{safeNumber(approach.distanceLunar).toFixed(2)} LD</Text>
                  <Text style={[styles.priority, { color: approach.potentiallyHazardous ? Palette.yellow : Palette.green }]}>
                    {approach.potentiallyHazardous ? 'prioritario' : 'nominal'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

type StatProps = {
  color?: string;
  label: string;
  value: number | string;
};

function Stat({ color = Palette.accent, label, value }: StatProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  muted: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  riskStrip: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 14,
  },
  riskHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  riskDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  riskSummary: {
    color: Palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 94,
    padding: 12,
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    marginTop: 6,
  },
  detailCard: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  sectionLabel: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    color: Palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  description: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metric: {
    flex: 1,
    minWidth: 96,
  },
  metricLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    color: Palette.text,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    marginTop: 4,
  },
  fastest: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  insightCard: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 142,
    padding: 12,
  },
  insightTitle: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 6,
  },
  listCard: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  objectList: {
    gap: 10,
    marginTop: 12,
  },
  objectRow: {
    alignItems: 'center',
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 11,
  },
  objectCopy: {
    flex: 1,
  },
  objectName: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  objectMeta: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  distancePill: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  distanceValue: {
    color: Palette.accent,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  priority: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },
});
