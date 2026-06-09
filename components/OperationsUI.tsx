import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/Colors';

type PageHeaderProps = {
  description?: string;
  eyebrow: string;
  right?: ReactNode;
  title: string;
};

export function PageHeader({ description, eyebrow, right, title }: PageHeaderProps) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerRail}>
        <View style={styles.headerDot} />
        <View style={styles.headerLine} />
      </View>
      <View style={styles.pageCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
        {description ? <Text style={styles.pageDescription}>{description}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

type StatusBadgeProps = {
  color?: string;
  label: string;
  tone?: 'solid' | 'outline';
};

export function StatusBadge({ color = Palette.accent, label, tone = 'outline' }: StatusBadgeProps) {
  const isSolid = tone === 'solid';

  return (
    <View style={[styles.badge, isSolid && { backgroundColor: color, borderColor: color }, !isSolid && { borderColor: color }]}> 
      <View style={[styles.badgeDot, { backgroundColor: isSolid ? Palette.ink : color }]} />
      <Text style={[styles.badgeText, { color: isSolid ? Palette.ink : color }]}>{label}</Text>
    </View>
  );
}

type DataRowProps = {
  detail?: string;
  label: string;
  value: string | number;
  valueColor?: string;
};

export function DataRow({ detail, label, value, valueColor = Palette.text }: DataRowProps) {
  return (
    <View style={styles.dataRow}>
      <View style={styles.dataCopy}>
        <Text style={styles.dataLabel}>{label}</Text>
        {detail ? <Text style={styles.dataDetail}>{detail}</Text> : null}
      </View>
      <Text style={[styles.dataValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

type ReadoutProps = {
  accent?: string;
  label: string;
  suffix?: string;
  value: string | number;
};

export function Readout({ accent = Palette.accent, label, suffix, value }: ReadoutProps) {
  return (
    <View style={[styles.readout, { borderTopColor: accent }]}> 
      <Text style={styles.readoutLabel}>{label}</Text>
      <View style={styles.readoutValueRow}>
        <Text style={[styles.readoutValue, { color: accent }]}>{value}</Text>
        {suffix ? <Text style={styles.readoutSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

type EmptyStateProps = {
  description: string;
  title: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyGlyph} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

type ActionButtonProps = PropsWithChildren<{
  disabled?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}>;

export function ActionButton({ children, disabled, onPress, variant = 'primary' }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'primary' && styles.actionButtonPrimary,
        variant === 'secondary' && styles.actionButtonSecondary,
        variant === 'danger' && styles.actionButtonDanger,
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}>
      <Text
        style={[
          styles.actionButtonText,
          variant === 'primary' && styles.actionButtonTextPrimary,
          variant !== 'primary' && styles.actionButtonTextSecondary,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function Stack({ children }: PropsWithChildren) {
  return <View style={styles.stack}>{children}</View>;
}

export function Grid({ children }: PropsWithChildren) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  pageHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  headerRail: {
    alignItems: 'center',
    paddingTop: 6,
    width: 18,
  },
  headerDot: {
    backgroundColor: Palette.accent,
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  headerLine: {
    backgroundColor: Palette.borderStrong,
    flex: 1,
    marginTop: 7,
    minHeight: 46,
    width: 1,
  },
  pageCopy: {
    flex: 1,
    maxWidth: 680,
  },
  eyebrow: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
    lineHeight: 38,
  },
  pageDescription: {
    color: Palette.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },
  headerRight: {
    minHeight: 44,
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: Palette.cardMuted,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 13,
  },
  badgeDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dataRow: {
    alignItems: 'center',
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dataCopy: {
    flex: 1,
  },
  dataLabel: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '900',
  },
  dataDetail: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  dataValue: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    textAlign: 'right',
  },
  readout: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderTopWidth: 3,
    borderWidth: 1,
    flex: 1,
    minWidth: 112,
    padding: 13,
  },
  readoutLabel: {
    color: Palette.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  readoutValueRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  readoutValue: {
    fontSize: 25,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  readoutSuffix: {
    color: Palette.muted,
    fontSize: 12,
    fontWeight: '800',
    paddingBottom: 3,
  },
  emptyState: {
    backgroundColor: Palette.cardMuted,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 17,
  },
  emptyGlyph: {
    backgroundColor: Palette.green,
    borderRadius: 999,
    height: 8,
    marginBottom: 12,
    width: 44,
  },
  emptyTitle: {
    color: Palette.text,
    fontSize: 17,
    fontWeight: '900',
  },
  emptyDescription: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  actionButtonPrimary: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  actionButtonSecondary: {
    backgroundColor: Palette.panelRaised,
    borderColor: Palette.border,
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(255, 88, 118, 0.12)',
    borderColor: 'rgba(255, 88, 118, 0.42)',
  },
  actionButtonPressed: {
    opacity: 0.78,
  },
  actionButtonDisabled: {
    opacity: 0.48,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  actionButtonTextPrimary: {
    color: Palette.ink,
  },
  actionButtonTextSecondary: {
    color: Palette.text,
  },
  stack: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
