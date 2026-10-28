/* Герой экрана «Сегодня» — отсчёт до намаза в разных компоновках (по стилю):
   numerals — крупные цифры (Countdown); ring — кольцо прогресса между намазами; block — цветная карта с узором;
   line — одна строка «Аср через 2 ч 13 мин»; tile — две плитки: отсчёт и следующий намаз. */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Pattern, Path, Rect, G } from 'react-native-svg';
import { Countdown } from './Countdown';
import { Txt } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import { PRAYER_GEN, PRAYER_RU, PRAYER_KEYS, countdownParts, fmtTime, type NextPrayer, type Times, type PrayerKey } from '../lib/prayer';
import { FONTS, SPACE, RADIUS } from '../theme/tokens';

type Props = { next: NextPrayer; times: Times; now: Date; note: string };

const two = (n: number) => String(n).padStart(2, '0');
function clock(ms: number) { const { h, m, s } = countdownParts(ms); return h > 0 ? `${h}:${two(m)}` : `${m}:${two(s)}`; }
function words(ms: number) { const { h, m, s } = countdownParts(ms); return h > 0 ? `${h} ч ${two(m)} мин` : m > 0 ? `${m} мин ${two(s)} с` : `${s} с`; }
function prevTime(times: Times, now: Date, next: NextPrayer): Date {
  let prev: Date | null = null;
  for (const k of PRAYER_KEYS) { const t = times[k]; if (t <= now && (!prev || t > prev)) prev = t; }
  if (!prev) prev = new Date(times.isha.getTime() - 86400000);
  if (prev >= next.at) prev = new Date(next.at.getTime() - 3600000);
  return prev;
}

export function Hero(props: Props) {
  const { style } = useTheme();
  switch (style.hero) {
    case 'ring': return <Ring {...props} />;
    case 'block': return <Block {...props} />;
    case 'line': return <Line {...props} />;
    case 'tile': return <Tile {...props} />;
    default: return <Countdown next={props.next} note={props.note} />;
  }
}

/* Кольцо: доля прошедшего времени между прошлым и следующим намазом */
function Ring({ next, times, now, note }: Props) {
  const { colors, ui } = useTheme();
  const prev = prevTime(times, now, next);
  const frac = Math.min(1, Math.max(0, (now.getTime() - prev.getTime()) / (next.at.getTime() - prev.getTime())));
  const R = 104, C = 2 * Math.PI * R, size = 236;
  return (
    <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 14 }} accessibilityRole="text" accessibilityLabel={`До ${PRAYER_GEN[next.key]} осталось ${words(next.ms)}`}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={colors.fill} strokeWidth={10} />
          <Circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={colors.accent} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C * (1 - frac)} />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 2 }]}>
          <Txt kind="caption" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>До {PRAYER_GEN[next.key]}</Txt>
          <Text style={{ fontFamily: ui(800) ?? FONTS.rounded, fontSize: 56, lineHeight: 62, fontWeight: '700', letterSpacing: -2, color: colors.accent, fontVariant: ['tabular-nums'] }}>{clock(next.ms)}</Text>
          <Txt kind="subheadline" style={{ fontWeight: '600' }}>{PRAYER_RU[next.key]} · {fmtTime(next.at)}</Txt>
          <Txt kind="caption" color="labelSecondary">{note}</Txt>
        </View>
      </View>
    </View>
  );
}

/* Цветная карта акцентного цвета с узором-решёткой */
function Block({ next, note }: Props) {
  const { colors, r, ui } = useTheme();
  const { h, m, s } = countdownParts(next.ms);
  const big = { fontFamily: ui(800) ?? FONTS.rounded, fontSize: 60, lineHeight: 64, fontWeight: '800' as const, letterSpacing: -2.5, color: colors.onAccent, fontVariant: ['tabular-nums'] as const };
  const unit = { fontFamily: ui(700), fontSize: 20, lineHeight: 26, fontWeight: '700' as const, color: colors.onAccent, opacity: 0.85 };
  return (
    <View style={[styles.block, { backgroundColor: colors.accent, borderRadius: r(RADIUS.card + 2) }]} accessibilityRole="text" accessibilityLabel={`До ${PRAYER_GEN[next.key]} осталось ${words(next.ms)}`}>
      <Svg width={260} height={260} viewBox="0 0 260 260" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.14 }} pointerEvents="none">
        <Defs><Pattern id="lat" patternUnits="userSpaceOnUse" width={52} height={52}><G fill="none" stroke={colors.onAccent} strokeWidth={2}><Path d="M26 2 50 26 26 50 2 26z" /><Circle cx={26} cy={26} r={6} /></G></Pattern></Defs>
        <Rect width={260} height={260} fill="url(#lat)" />
      </Svg>
      <Txt kind="subheadline" style={{ color: colors.onAccent, fontWeight: '700', opacity: 0.85 }}>До {PRAYER_GEN[next.key]} осталось</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
        {h > 0 ? (<><Text style={big}>{h}</Text><Text style={unit}>ч</Text><Text style={[big, { marginLeft: 6 }]}>{two(m)}</Text><Text style={unit}>мин</Text></>)
          : m > 0 ? (<><Text style={big}>{m}</Text><Text style={unit}>мин</Text><Text style={[big, { marginLeft: 6 }]}>{two(s)}</Text><Text style={unit}>с</Text></>)
          : (<><Text style={big}>{s}</Text><Text style={unit}>с</Text></>)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <View style={styles.pill}><Txt kind="footnote" style={{ color: colors.onAccent, fontWeight: '700' }}>{PRAYER_RU[next.key]} · {fmtTime(next.at)}</Txt></View>
        <View style={styles.pill}><Txt kind="footnote" style={{ color: colors.onAccent, fontWeight: '700' }} numberOfLines={1}>{note}</Txt></View>
      </View>
    </View>
  );
}

/* Одна строка */
function Line({ next, note }: Props) {
  return (
    <View style={{ paddingHorizontal: SPACE[16], paddingTop: 18, paddingBottom: 14, gap: 2 }} accessibilityRole="text" accessibilityLabel={`${PRAYER_RU[next.key]} через ${words(next.ms)}`}>
      <Txt kind="title" style={{ fontWeight: '700' }}><Txt kind="title" color="accent" style={{ fontWeight: '700' }}>{PRAYER_RU[next.key]}</Txt> через {words(next.ms)}</Txt>
      <Txt kind="subheadline" color="labelSecondary">в {fmtTime(next.at)} · {note}</Txt>
    </View>
  );
}

/* Две плитки: отсчёт и следующий намаз */
function Tile({ next, note }: Props) {
  const { colors, r, ui } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: SPACE[16], paddingTop: 12, paddingBottom: 8 }}>
      <View style={[styles.tile, { backgroundColor: colors.accent, borderRadius: r(RADIUS.card) }]} accessibilityRole="text" accessibilityLabel={`До ${PRAYER_GEN[next.key]} осталось ${words(next.ms)}`}>
        <Txt kind="caption" style={{ color: colors.onAccent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, opacity: 0.85 }}>Осталось</Txt>
        <Text style={{ fontFamily: ui(800) ?? FONTS.rounded, fontSize: 44, lineHeight: 50, fontWeight: '800', letterSpacing: -1.8, color: colors.onAccent, fontVariant: ['tabular-nums'] }}>{clock(next.ms)}</Text>
        <Txt kind="caption" style={{ color: colors.onAccent, opacity: 0.85 }} numberOfLines={1}>{note}</Txt>
      </View>
      <View style={[styles.tile, { backgroundColor: colors.card, borderRadius: r(RADIUS.card) }]}>
        <Txt kind="caption" color="labelSecondary" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>Следующий</Txt>
        <Txt kind="title" style={{ fontWeight: '700', fontSize: 26, lineHeight: 32 }}>{PRAYER_RU[next.key]}</Txt>
        <Text style={{ fontFamily: ui(700) ?? FONTS.rounded, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -1, color: colors.accent, fontVariant: ['tabular-nums'] }}>{fmtTime(next.at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginHorizontal: SPACE[16], marginTop: 14, marginBottom: 10, padding: 20, overflow: 'hidden' },
  pill: { height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', maxWidth: '70%' },
  tile: { flex: 1, minHeight: 124, padding: 14, justifyContent: 'space-between', gap: 2 },
});

export type { PrayerKey };
