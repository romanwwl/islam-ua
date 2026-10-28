/* Учёба: приветствие, «Повторение (N)», четыре раздела по 2–3 карточки и испытание «Все 99 имён по памяти». */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Card, Txt, Ar, Tap } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { useTheme } from '../../theme/ThemeProvider';
import { MODES, MODE_KEYS, statsOf, pendingSession, type ModeKey } from '../../lib/quiz';
import { dueAcross, getName, onProgress, type ModeStats } from '../../lib/progress';
import { loadState as names99State } from '../../lib/names99';
import { SPACE, RADIUS } from '../../theme/tokens';

const SECTIONS: { title: string; sub: string; modes: ModeKey[] }[] = [
  { title: 'Арабский язык', sub: 'буквы, цифры, слова', modes: ['alphabet', 'numbers', 'dict'] },
  { title: 'Коран',         sub: 'слова, суры, чтение на слух', modes: ['quran', 'surah', 'listen'] },
  { title: 'Правописание',  sub: 'собрать, дописать, огласовать', modes: ['spell', 'missing', 'harakat'] },
  { title: 'Вера и история', sub: 'имена Аллаха, жизнь Пророка ﷺ', modes: ['names', 'sira'] },
];

export default function Learn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, style } = useTheme();
  const learnKind = style.learn;
  const TINTS = [colors.prayerIsha, colors.prayerDhuhr, colors.prayerFajr, colors.prayerAsr, colors.prayerMaghrib, colors.prayerSunrise, colors.accent, colors.prayerIsha, colors.prayerFajr, colors.prayerAsr, colors.prayerDhuhr];
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => onProgress(bump), [bump]);
  useFocusEffect(useCallback(() => { bump(); }, [bump]));

  const name = getName();
  const stats = {} as Record<ModeKey, ModeStats>;
  for (const m of MODE_KEYS) stats[m] = statsOf(m);
  const src: Record<string, { items: any[]; idOf: (x: any) => string }> = {};
  for (const m of MODE_KEYS) src[m] = { items: MODES[m].data, idOf: MODES[m].id };
  const due = dueAcross(src);
  const pendingReview = pendingSession('review');
  const n99 = names99State();
  const found = n99.revealed.length - n99.hinted.length;
  void tick;

  const open = (m: ModeKey) => router.push(MODES[m].custom === 'spell' ? '/spell' : { pathname: '/quiz', params: { mode: m } });

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_SPACE + insets.bottom }} showsVerticalScrollIndicator={false}>
      <Header title="Учёба" subtitle={name ? `Ассаляму алейкум, ${name}` : 'Ассаляму алейкум'} />

      <View style={{ paddingHorizontal: SPACE[16], paddingTop: 8, gap: SPACE[24] }}>
        {(pendingReview || due.length > 0) && (
          <Tap onPress={() => router.push({ pathname: '/quiz', params: { mode: 'review' } })} accessibilityRole="button">
            <Card strong style={styles.review}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Txt kind="headline">Повторение</Txt>
                <Txt kind="headline" color="labelSecondary" style={{ fontWeight: '400' }}>({pendingReview ? pendingReview.total - pendingReview.pos : due.length})</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Txt kind="subheadline" color="accent" style={{ fontWeight: '600' }}>{pendingReview ? 'Продолжить' : 'Начать'}</Txt>
                <Icon name="chevronRight" size={14} color={colors.accent} />
              </View>
            </Card>
          </Tap>
        )}

        {SECTIONS.map(sec => (
          <View key={sec.title} style={{ gap: 10 }}>
            <View style={{ paddingHorizontal: 4 }}>
              <Txt kind="title">{sec.title}</Txt>
              <Txt kind="footnote" color="labelSecondary">{sec.sub}</Txt>
            </View>
            {learnKind === 'rows' ? (
              <Card style={{ padding: 0 }}>
                {sec.modes.map((m, i) => {
                  const s = stats[m]; const p = pendingSession(m); const mode = MODES[m];
                  return (
                    <Pressable key={m} onPress={() => open(m)} accessibilityRole="button" accessibilityLabel={`${mode.title}, выучено ${s.learned} из ${s.total}`}
                      style={({ pressed }) => [styles.lrow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }, pressed && { opacity: 0.7 }]}>
                      <View style={{ width: 56, alignItems: 'center' }}>
                        {mode.latin ? <Txt kind="title" color="accent" style={{ fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>{mode.glyph}</Txt>
                          : <Ar kind="arInline" color="accent" style={{ fontSize: mode.glyph.length > 3 ? 18 : 28, lineHeight: 36, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>{mode.glyph}</Ar>}
                      </View>
                      <View style={{ flex: 1, gap: 5 }}>
                        <Txt style={{ fontWeight: '600' }} numberOfLines={1}>{mode.title}</Txt>
                        <View style={[styles.bar, { backgroundColor: colors.fill, height: 3 }]}>
                          <View style={[styles.barFill, { backgroundColor: colors.accent, opacity: 0.35, width: `${s.total ? (s.learned + s.learning) / s.total * 100 : 0}%` }]} />
                          <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${s.total ? s.learned / s.total * 100 : 0}%` }]} />
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Txt kind="subheadline" color="labelSecondary" style={{ fontVariant: ['tabular-nums'], fontWeight: '600' }}>{s.learned} / {s.total}</Txt>
                        {p ? <Txt kind="caption" color="accent">продолжить</Txt> : s.due ? <Txt kind="caption" color="accent" style={{ fontWeight: '600' }}>{s.due} к повторению</Txt> : null}
                      </View>
                      <Icon name="chevronRight" size={14} color={colors.labelTertiary} />
                    </Pressable>
                  );
                })}
              </Card>
            ) : learnKind === 'tiles' || learnKind === 'colored' ? (
              <View style={styles.grid}>
                {sec.modes.map((m, i) => {
                  const s = stats[m]; const p = pendingSession(m); const mode = MODES[m];
                  const colored = learnKind === 'colored';
                  const tint = TINTS[(SECTIONS.indexOf(sec) * 3 + i) % TINTS.length];
                  const bg = colored ? tint : undefined;
                  const fg = colored ? (isDark ? '#0b1a3b' : '#ffffff') : colors.label;
                  const wide = sec.modes.length === 2 || (sec.modes.length === 3 && i === 2);
                  return (
                    <Tap key={m} onPress={() => open(m)} accessibilityRole="button" accessibilityLabel={`${mode.title}, выучено ${s.learned} из ${s.total}`} style={[styles.cell2, wide && styles.cellWide2]}>
                      <Card style={[styles.tile, bg ? { backgroundColor: bg, borderWidth: 0 } : null]}>
                        <View style={{ position: 'absolute', right: 10, top: -2, maxWidth: '58%', opacity: colored ? 0.55 : 0.16 }} pointerEvents="none">
                          {mode.latin ? <Txt kind="title" style={{ fontSize: 44, lineHeight: 56, fontWeight: '800', color: colored ? fg : colors.arabic }} numberOfLines={1}>{mode.glyph}</Txt>
                            : <Ar kind="arInline" style={{ fontSize: mode.glyph.length > 3 ? 34 : 60, lineHeight: 74, color: colored ? fg : colors.arabic }} numberOfLines={1}>{mode.glyph}</Ar>}
                        </View>
                        <View style={{ gap: 3 }}>
                          <Txt kind="subheadline" style={{ fontWeight: '700', color: fg }} numberOfLines={2}>{mode.title}</Txt>
                          <Txt kind="caption" style={{ color: fg, opacity: colored ? 0.85 : 0.7 }}>{s.learned} из {s.total}{p ? ' · продолжить' : s.due ? ` · ${s.due} к повторению` : ''}</Txt>
                          <View style={[styles.bar, { backgroundColor: colored ? 'rgba(255,255,255,0.3)' : colors.fill }]}>
                            <View style={[styles.barFill, { backgroundColor: colored ? fg : colors.accent, width: `${s.total ? s.learned / s.total * 100 : 0}%` }]} />
                          </View>
                        </View>
                      </Card>
                    </Tap>
                  );
                })}
              </View>
            ) : (
            <View style={styles.grid}>
              {sec.modes.map(m => {
                const s = stats[m]; const p = pendingSession(m); const mode = MODES[m];
                return (
                  <Tap key={m} onPress={() => open(m)} accessibilityRole="button" accessibilityLabel={`${mode.title}, выучено ${s.learned} из ${s.total}`} style={[styles.cell, sec.modes.length === 2 && styles.cellWide]}>
                    <Card style={styles.tcard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {mode.latin
                          ? <Txt kind="title" style={{ fontWeight: '700' }}>{mode.glyph}</Txt>
                          : <Ar kind="arInline" style={{ fontSize: 26, lineHeight: 34 }}>{mode.glyph}</Ar>}
                        {p ? <View style={[styles.pend, { borderColor: colors.accent }]}><View style={{ width: `${p.pos / p.total * 100}%`, height: '100%', backgroundColor: colors.accent }} /></View>
                          : s.due ? <View style={[styles.due, { backgroundColor: colors.fill }]}><Txt kind="caption" color="accent" style={{ fontWeight: '600' }}>{s.due}</Txt></View> : null}
                      </View>
                      <View style={{ gap: 6 }}>
                        <Txt kind="subheadline" numberOfLines={2} style={{ fontWeight: '600', minHeight: 40 }}>{mode.title}</Txt>
                        <Txt kind="caption" color="labelSecondary">{s.learned} из {s.total}</Txt>
                        <View style={[styles.bar, { backgroundColor: colors.fill }]}>
                          <View style={[styles.barFill, { backgroundColor: colors.accent, opacity: 0.35, width: `${s.total ? (s.learned + s.learning) / s.total * 100 : 0}%` }]} />
                          <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${s.total ? s.learned / s.total * 100 : 0}%` }]} />
                        </View>
                      </View>
                    </Card>
                  </Tap>
                );
              })}
            </View>
            )}
            {sec.modes.includes('names') && (
              <Tap onPress={() => router.push('/names99')} accessibilityRole="button">
                <Card strong style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Txt kind="footnote" color="accent" style={{ fontWeight: '600', textTransform: 'uppercase' }}>Испытание</Txt>
                    <Txt kind="subheadline" color="labelSecondary" style={{ fontVariant: ['tabular-nums'] }}><Txt kind="subheadline" style={{ fontWeight: '600' }}>{found}</Txt>/99</Txt>
                  </View>
                  <Txt kind="headline">Все 99 имён по памяти</Txt>
                  <Txt kind="subheadline" color="labelSecondary">{n99.best ? `Лучший результат: ${n99.best}` : 'Впишите каждое имя — по-арабски, по-русски или транскрипцией'}</Txt>
                  <View style={[styles.bar, { backgroundColor: colors.fill }]}><View style={[styles.barFill, { backgroundColor: colors.accent, width: `${found / 99 * 100}%` }]} /></View>
                </Card>
              </Tap>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  review: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '31.5%' },
  cellWide: { width: '48.5%' },
  cell2: { width: '48.5%' },
  cellWide2: { width: '100%' },
  tile: { minHeight: 112, padding: 14, justifyContent: 'flex-end', overflow: 'hidden' },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 },
  tcard: { minHeight: 148, padding: 12, justifyContent: 'space-between', gap: 10 },
  bar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2 },
  pend: { width: 26, height: 6, borderRadius: 3, borderWidth: 1, overflow: 'hidden' },
  due: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
