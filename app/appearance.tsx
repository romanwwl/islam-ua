/* Профиль → Оформление: шесть тем, узор на фоне, ночная Полночь, арабский шрифт. */
import React from 'react';
import { ScrollView, View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenTop } from '../components/ScreenTop';
import { Card, SectionHeader, Txt } from '../components/ui';
import { Icon } from '../components/Icons';
import { Toggle } from '../components/Toggle';
import { useTheme, THEME_IDS, THEME_NAMES, COLORS } from '../theme/ThemeProvider';
import { FONTS, RADIUS, SPACE } from '../theme/tokens';
import { hapticTap } from '../lib/haptics';
import { useThemeSettings } from '../lib/settings';

export default function Appearance() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useTheme();
  const s = useThemeSettings();
  return (
    <View style={{ flex: 1 }}>
      <ScreenTop title="Оформление" onClose={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + 32, gap: SPACE[24] }} showsVerticalScrollIndicator={false}>
        <View>
          <SectionHeader>Тема</SectionHeader>
          <View style={styles.grid}>
            {THEME_IDS.map(id => {
              const c = COLORS[id];
              const selected = s.theme === id;
              return (
                <Pressable key={id} onPress={() => { hapticTap(); t.setTheme(id); }} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={THEME_NAMES[id]}
                  style={[styles.swatch, { backgroundColor: c.bg, borderColor: selected ? t.colors.accent : 'rgba(128,128,128,0.25)', borderWidth: selected ? 2.5 : StyleSheet.hairlineWidth }]}>
                  <View style={[styles.mini, { backgroundColor: c.card }]}>
                    <View style={[styles.line, { width: '60%', backgroundColor: c.accent }]} />
                    <View style={[styles.line, { width: '85%', backgroundColor: c.label, opacity: 0.35 }]} />
                    <View style={[styles.line, { width: '45%', backgroundColor: c.label, opacity: 0.2 }]} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.label, fontSize: 15, fontWeight: '600', letterSpacing: -0.23 }}>{THEME_NAMES[id]}</Text>
                    {selected && <View style={[styles.check, { backgroundColor: c.accent }]}><Icon name="checkmark" size={14} color={c.onAccent} /></View>}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Txt kind="footnote" color="labelSecondary" style={{ paddingHorizontal: SPACE[16], paddingTop: 6 }}>Тема применяется ко всему приложению. Пергамент и Песок — светлые.</Txt>
        </View>

        <Card style={{ padding: 0 }}>
          <View style={styles.row}>
            <View style={{ flexShrink: 1 }}><Txt>Узор на фоне</Txt><Txt kind="subheadline" color="labelSecondary">Тонкий орнамент за карточками</Txt></View>
            <Toggle value={s.pattern} onChange={t.setPattern} label="Узор на фоне" />
          </View>
          <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.separator }]}>
            <View style={{ flexShrink: 1 }}><Txt>Ночью — Полночь</Txt><Txt kind="subheadline" color="labelSecondary">После Иша переключать на тёмную тему</Txt></View>
            <Toggle value={s.nightMidnight} onChange={t.setNightMidnight} label="Ночью переключать на тему Полночь" />
          </View>
        </Card>

        <View>
          <SectionHeader>Арабский шрифт</SectionHeader>
          <Card style={{ padding: 0 }}>
            {([['scheherazade', 'Scheherazade', FONTS.arabic], ['amiri', 'Amiri', FONTS.amiri]] as const).map(([key, label, family], i) => (
              <Pressable key={key} onPress={() => { hapticTap(); t.setArabicFont(key); }} accessibilityRole="radio" accessibilityState={{ selected: s.arabicFont === key }}
                style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.separator }, pressed && { opacity: 0.7 }]}>
                <Txt>{label}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Text style={{ fontFamily: family, fontSize: 24, lineHeight: 32, color: t.colors.arabic, writingDirection: 'rtl' }}>بِسْمِ اللَّهِ</Text>
                  <View style={{ width: 20 }}>{s.arabicFont === key && <Icon name="checkmark" size={20} color={t.colors.accent} />}</View>
                </View>
              </Pressable>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: '47.5%', minHeight: 124, padding: 14, borderRadius: 20, justifyContent: 'space-between', gap: 10 },
  mini: { padding: 10, borderRadius: 12, gap: 6 },
  line: { height: 6, borderRadius: 3 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 60, paddingHorizontal: SPACE[16], paddingVertical: 10 },
});
