import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/Colors';

type MetricCardProps = {
  color?: string;
  helper?: string;
  label: string;
  progress?: number;
  unit?: string;
  value: string | number;
};

export function MetricCard({ color = Palette.accent, helper, label, progress, unit, value }: MetricCardProps) {
  const safeProgress = typeof progress === 'number' ? Math.min(Math.max(progress, 0), 100) : undefined;

  return (
    <View style={[styles.card, { borderColor: Palette.border }]}> 
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.statusLight, { backgroundColor: color }]} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {typeof safeProgress === 'number' ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${safeProgress}%`, backgroundColor: color }]} />
          <View style={styles.targetMarker} />
        </View>
      ) : null}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 148,
    padding: 15,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  label: {
    color: Palette.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  statusLight: {
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  valueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 13,
  },
  value: {
    fontSize: 31,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: -0.9,
    lineHeight: 35,
  },
  unit: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '800',
    paddingBottom: 4,
  },
  track: {
    backgroundColor: Palette.track,
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  targetMarker: {
    backgroundColor: Palette.text,
    height: '100%',
    opacity: 0.45,
    position: 'absolute',
    right: '18%',
    width: 2,
  },
  helper: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});
