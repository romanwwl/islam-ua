/* Таб-бар: Сегодня · Учёба · Профиль. Вид зависит от стиля (Оформление → Стиль):
   floating — плавающая стеклянная капсула; flat — классическая полоса во всю ширину; pill — плавающая, выбранная вкладка цветной «таблеткой»;
   icons — только иконки; labels — только слова. */
import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
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
  const { colors, isDark, style, ui } = useTheme();
  const insets = useSafeAreaInsets();
  const kind = style.tabbar;
  const floating = kind === 'floating' || kind === 'pill' || kind === 'icons';
  const bottom = Math.max(insets.bottom, 12) + 13;

  const tabs = state.routes.map((route: { key: string; name: string }, i: number) => {
    const t = TABS[route.name] ?? { label: route.name, icon: 'house' as IconName };
    const focused = state.index === i;
    const onPress = () => { hapticTap(); if (!focused) navigateToTab(route.key); };
    const a11y = { accessibilityRole: 'tab' as const, accessibilityState: { selected: focused }, accessibilityLabel: t.label };
    if (kind === 'pill') {
      return (
        <Pressable key={route.key} {...a11y} onPress={onPress} style={[styles.tab, styles.pillTab, focused && { backgroundColor: colors.accent }]}>
          <Icon name={t.icon} size={22} color={focused ? colors.onAccent : colors.label} />
          {focused && <Text style={[styles.pillLabel, { color: colors.onAccent, fontFamily: ui(700) }]}>{t.label}</Text>}
        </Pressable>
      );
    }
    if (kind === 'icons') {
      return (
        <Pressable key={route.key} {...a11y} onPress={onPress} style={[styles.tab, focused && { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)' }]}>
          <Icon name={t.icon} size={28} color={focused ? colors.accent : colors.label} />
        </Pressable>
      );
    }
    if (kind === 'labels') {
      return (
        <Pressable key={route.key} {...a11y} onPress={onPress} style={styles.tab}>
          <Text style={[styles.wordLabel, { color: focused ? colors.accent : colors.labelSecondary, fontFamily: ui(focused ? 700 : 500), fontWeight: focused ? '700' : '500' }]}>{t.label}</Text>
          <View style={[styles.underline, { backgroundColor: focused ? colors.accent : 'transparent' }]} />
        </Pressable>
      );
    }
    return (
      <Pressable key={route.key} {...a11y} onPress={onPress} style={[styles.tab, kind === 'floating' && focused && { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)' }]}>
        <Icon name={t.icon} size={26} color={focused ? colors.accent : colors.label} />
        <Text style={[styles.label, { color: focused ? colors.accent : colors.label, fontFamily: ui(600) }]}>{t.label}</Text>
      </Pressable>
    );
  });

  if (floating) {
    return (
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        {kind === 'pill'
          ? <View style={[styles.bar, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.separator, flexDirection: 'row' }]}>{tabs}</View>
          : <Glass style={styles.bar} contentStyle={{ flexDirection: 'row' }}>{tabs}</Glass>}
      </View>
    );
  }

  // flat / labels — полоса во всю ширину, размытие под ней, тонкая линия сверху
  return (
    <View style={[styles.flat, { paddingBottom: Math.max(insets.bottom, 8), borderTopColor: colors.separator }]}>
      {Platform.OS === 'web'
        ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass, backdropFilter: 'blur(22px) saturate(150%)' } as any]} />
        : <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass, opacity: Platform.OS === 'web' ? 0 : 0.7 }]} />
      <View style={{ flexDirection: 'row', height: kind === 'labels' ? 50 : 56 }}>{tabs}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 21, right: 21, alignItems: 'center' },
  bar: { height: SIZE['tab-bar-height'], padding: 4, borderRadius: RADIUS.capsule, width: '100%', maxWidth: 360 },
  flat: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tab: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: RADIUS.capsule, paddingVertical: 6 },
  pillTab: { flexDirection: 'row', gap: 6, paddingHorizontal: 10 },
  pillLabel: { fontSize: 13, lineHeight: 16, fontWeight: '700' },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '600' },
  wordLabel: { fontSize: 15, lineHeight: 20, letterSpacing: -0.2 },
  underline: { width: 22, height: 3, borderRadius: 2, marginTop: 4 },
});
