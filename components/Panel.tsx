import { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/Colors';

type PanelProps = PropsWithChildren<{
  caption?: string;
  right?: ReactNode;
  title: string;
}>;

export function Panel({ title, caption, children, right }: PanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <View style={styles.titleRow}>
            <View style={styles.titleMark} />
            <Text style={styles.title}>{title}</Text>
          </View>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Palette.panel,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  titleMark: {
    backgroundColor: Palette.accent,
    borderRadius: 999,
    height: 6,
    width: 28,
  },
  title: {
    color: Palette.text,
    flex: 1,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.25,
  },
  caption: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  right: {
    minHeight: 36,
    justifyContent: 'center',
  },
});
