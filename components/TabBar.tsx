/* Плавающий стеклянный таб-бар: Сегодня · Учёба · Профиль. 62 pt, в 25 pt от низа (плюс безопасная зона). */
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
import { Glass } from './Glass';
import { Icon, type IconName } from './Icons';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS, SIZE } from '../theme/tokens';
import { hapticTap } from '../lib/haptics';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Сегодня', icon: 'house' },
  learn: { label: 'Учёба', icon: 'book' },
  profile: { label: 'Профиль', icon: 'person' },
};

export const TAB_BAR_SPACE = SIZE['tab-bar-height'] + 25 + 24; // место под контентом, чтобы ничего не пряталось под таб-баром

export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 13;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Glass style={styles.bar} contentStyle={{ flexDirection: 'row' }}>
        {state.routes.map((route: { key: string; name: string }, i: number) => {
          const t = TABS[route.name] ?? { label: route.name, icon: 'house' as IconName };
          const focused = state.index === i;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={t.label}
              onPress={() => { hapticTap(); if (!focused) navigateToTab(route.key); }}
              style={[styles.tab, focused && { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)' }]}
            >
              <Icon name={t.icon} size={26} color={focused ? colors.accent : colors.label} />
              <Text style={[styles.label, { color: focused ? colors.accent : colors.label }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 21, right: 21, alignItems: 'center' },
  bar: { height: SIZE['tab-bar-height'], padding: 4, borderRadius: RADIUS.capsule, width: '100%', maxWidth: 360 },
  tab: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: RADIUS.capsule, paddingVertical: 6 },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '600' },
});
