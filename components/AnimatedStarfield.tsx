import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/Colors';

const stars = [
  { left: '8%', top: 24, size: 3, delay: 0 },
  { left: '22%', top: 58, size: 2, delay: 220 },
  { left: '44%', top: 16, size: 4, delay: 420 },
  { left: '73%', top: 48, size: 2, delay: 620 },
  { left: '89%', top: 22, size: 3, delay: 820 },
] as const;

export function AnimatedStarfield() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let mounted = true;
    let animation: ReturnType<typeof Animated.loop> | null = null;

    function startPulse() {
      pulse.setValue(0.35);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(pulse, {
            toValue: 0.35,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      animation.start();
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!mounted || enabled) {
          return;
        }

        startPulse();
      })
      .catch(() => {
        if (mounted) {
          startPulse();
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      animation?.stop();
      animation = null;
      pulse.setValue(0.35);

      if (!enabled) {
        startPulse();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
      animation?.stop();
    };
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0.35, 1], outputRange: [0.18, 0.52] });
  const scale = pulse.interpolate({ inputRange: [0.35, 1], outputRange: [0.96, 1.12] });
  const scanShift = pulse.interpolate({ inputRange: [0.35, 1], outputRange: [-16, 16] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.orbit, { opacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.scan, { opacity, transform: [{ translateX: scanShift }] }]} />
      {stars.map((star) => (
        <Animated.View
          key={`${star.left}-${star.top}`}
          style={[
            styles.star,
            {
              height: star.size,
              left: star.left,
              opacity,
              top: star.top + star.delay / 90,
              transform: [{ scale }],
              width: star.size,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  orbit: {
    borderColor: Palette.border,
    borderRadius: 160,
    borderWidth: 1,
    height: 180,
    position: 'absolute',
    right: -88,
    top: -86,
    width: 180,
  },
  scan: {
    backgroundColor: Palette.borderStrong,
    height: 1,
    left: 24,
    position: 'absolute',
    right: 24,
    top: 118,
  },
  star: {
    backgroundColor: Palette.accent,
    borderRadius: 99,
    position: 'absolute',
  },
});
