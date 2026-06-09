import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import Colors from '@/constants/Colors';
import { Palette, Radius } from '@/constants/Colors';

type TabIconProps = {
  color: ComponentProps<typeof SymbolView>['tintColor'];
  focused: boolean;
  name: ComponentProps<typeof SymbolView>['name'];
};

function TabIcon({ color, focused, name }: TabIconProps) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.activeDot, focused && styles.activeDotVisible]} />
      <SymbolView name={name} tintColor={color} size={23} />
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const colorScheme = scheme === 'light' ? 'light' : 'dark';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '900',
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: Palette.panel,
          borderColor: Palette.border,
          borderRadius: Radius.xl,
          borderTopColor: Palette.border,
          borderWidth: 1,
          bottom: 16,
          elevation: 14,
          height: 84,
          left: 18,
          overflow: 'visible',
          paddingBottom: 10,
          paddingTop: 8,
          position: 'absolute',
          right: 18,
          shadowColor: Palette.ink,
          shadowOffset: { height: 12, width: 0 },
          shadowOpacity: 0.32,
          shadowRadius: 22,
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          marginHorizontal: 3,
          minHeight: 60,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Missao',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{
                ios: 'paperplane.fill',
                android: 'rocket_launch',
                web: 'rocket_launch',
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboards"
        options={{
          title: 'Dados',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{
                ios: 'chart.bar.xaxis',
                android: 'monitoring',
                web: 'monitoring',
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    height: 7,
    marginBottom: 5,
    width: 7,
  },
  activeDotVisible: {
    backgroundColor: Palette.accent,
  },
  iconWrap: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
});
