import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/OperationsUI';
import { Palette, Radius } from '@/constants/Colors';
import type { AlertHistoryItem, MissionAlert } from '@/types/mission';

type AlertCardProps = {
  alert: AlertHistoryItem | MissionAlert;
  mode?: 'active' | 'history';
  onDelete?: (historyId: string) => void;
  onResolve?: (id: string) => void;
  onResolveHistory?: (historyId: string) => void;
};

const severityColors = {
  critical: Palette.red,
  warning: Palette.yellow,
  info: Palette.cyan,
};

const severityLabels = {
  critical: 'Critico',
  warning: 'Atencao',
  info: 'Info',
};

function isHistoryAlert(alert: AlertHistoryItem | MissionAlert): alert is AlertHistoryItem {
  return 'historyId' in alert;
}

export function AlertCard({ alert, mode = 'active', onDelete, onResolve, onResolveHistory }: AlertCardProps) {
  const color = severityColors[alert.severity];
  const time = new Date(alert.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const historyAlert = isHistoryAlert(alert) ? alert : null;
  const resolvedAt = historyAlert?.resolvedAt
    ? new Date(historyAlert.resolvedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
      })
    : null;
  const lastSeenAt = historyAlert
    ? new Date(historyAlert.lastSeenAt).toLocaleString('pt-BR', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: '2-digit',
      })
    : null;
  const historyStatusColor = historyAlert?.status === 'resolved' ? Palette.green : historyAlert?.status === 'active' ? Palette.yellow : Palette.muted;
  const historyStatusLabel = historyAlert?.status === 'resolved' ? 'Resolvido' : historyAlert?.status === 'active' ? 'Ativo agora' : 'Historico';
  const historyStatusText = historyAlert?.status === 'resolved'
    ? `Resolvido por ${historyAlert.resolvedByName ?? 'operador'}${resolvedAt ? ` em ${resolvedAt}` : ''}`
    : historyAlert?.status === 'active'
      ? 'Este alerta tambem esta ativo no ciclo atual.'
      : `Registrado no historico${lastSeenAt ? `, visto pela ultima vez em ${lastSeenAt}` : ''}.`;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}> 
      <View style={styles.header}>
        <View style={[styles.badge, { borderColor: color }]}> 
          <View style={[styles.badgeDot, { backgroundColor: color }]} />
          <Text style={[styles.badgeText, { color }]}>{severityLabels[alert.severity]}</Text>
        </View>
        <Text style={[styles.time, historyAlert && { color: historyStatusColor }]}>{historyAlert ? historyStatusLabel : time}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.description}>{alert.description}</Text>
        {historyAlert ? (
          <Text style={[styles.statusText, { color: historyStatusColor }]}>{historyStatusText}</Text>
        ) : null}
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Metrica</Text>
          <Text style={styles.metric}>{alert.metric}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Medido</Text>
          <Text style={[styles.value, { color }]}>{alert.value}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Faixa</Text>
          <Text style={styles.threshold}>{alert.threshold}</Text>
        </View>
      </View>
      {mode === 'active' && onResolve ? (
        <View style={styles.actionRow}>
          <ActionButton onPress={() => onResolve(alert.id)} variant="secondary">Marcar como Resolvido</ActionButton>
        </View>
      ) : null}
      {historyAlert && mode === 'history' && (onDelete || (onResolveHistory && historyAlert.status === 'inactive')) ? (
        <View style={styles.actionRow}>
          {onResolveHistory && historyAlert.status === 'inactive' ? (
            <ActionButton onPress={() => onResolveHistory(historyAlert.historyId)} variant="secondary">Marcar como Resolvido</ActionButton>
          ) : null}
          {onDelete ? <ActionButton onPress={() => onDelete(historyAlert.historyId)} variant="danger">Deletar registro</ActionButton> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderColor: Palette.border,
    borderLeftWidth: 5,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 13,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Palette.cardMuted,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  badgeDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  time: {
    color: Palette.muted,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  body: {
    gap: 6,
  },
  title: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  description: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  statusText: {
    color: Palette.green,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 20,
  },
  metricRow: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
  },
  metricBlock: {
    flex: 1,
    minWidth: 82,
  },
  metricLabel: {
    color: Palette.subtle,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metric: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
  },
  value: {
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    marginTop: 2,
  },
  threshold: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  actionRow: {
    gap: 10,
  },
});
