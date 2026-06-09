import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, type Ref } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedStarfield } from '@/components/AnimatedStarfield';
import { Palette } from '@/constants/Colors';

type ScreenProps = PropsWithChildren<{
  scrollRef?: Ref<ScrollView>;
}>;

export function Screen({ children, scrollRef }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <AnimatedStarfield />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.background,
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    alignSelf: 'center',
    gap: 18,
    maxWidth: 920,
    padding: 20,
    paddingBottom: 144,
    paddingTop: 20,
    width: '100%',
    zIndex: 1,
  },
});
