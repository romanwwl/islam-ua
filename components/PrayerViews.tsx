/* Времена намазов в разных компоновках (по стилю): chips — ряд из шести (PrayerRow); timeline — вертикальная лента с точками;
   tiles — 3×2 цветные плитки (цвет каждого намаза); list — карточка со строками; mono — 3×2 плитки цвета карточки. */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PrayerRow } from './PrayerRow';
import { PrayerIcon } from './Icons';
import { Card, Txt } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import { PRAYER_KEYS, PRAYER_RU, fmtTime, type PrayerKey, type Times } from '../lib/prayer';
import { RADIUS, SPACE } from '../theme/tokens';

type Props = { times: Times; now: Date; nextKey: PrayerKey; onPress?: (k: PrayerKey) => void };

export function Prayers(props: Props) {
  const { style } = useTheme();
  switch (style.prayers) {
    case 'timeline': return <Timeline {...props} />;
    case 'tiles': return <Tiles {...props} colored />;
    case 'mono': return <Tiles {...props} />;
    case 'list': return <List {...props} />;
    default: return <PrayerRow {...props} />;
  }
}

const a11y = (k: PrayerKey, at: Date, isNext: boolean, past: boolean) => `${PRAYER_RU[k]} ${fmtTime(at)}${isNext ? ', следующий' : past ? ', прошёл' : ''}`;

function Timeline({ times, now, nextKey, onPress }: Props) {
  const { colors, ui } = useTheme();
  return (
    <View style={styles.tl}>
      <View pointerEvents="none" style={[styles.tlLine, { backgroundColor: colors.separator }]} />
      {PRAYER_KEYS.map(k => {
        const at = times[k]; const isNext = k === nextKey; const past = at <= now && !isNext;
        const color = isNext ? colors.accent : past ? colors.labelTertiary : colors.label;
        return (
          <Pressable key={k} onPress={() => onPress?.(k)} accessibilityRole="button" accessibilityLabel={a11y(k, at, isNext, past)} style={styles.tlRow}>
            <Text style={[styles.tlTime, { color, fontFamily: ui(isNext ? 700 : 500), fontWeight: isNext ? '700' : '500' }]}>{fmtTime(at)}</Text>
            <View style={styles.tlDotWrap}>
              <View style={[styles.tlDot, { backgroundColor: isNext ? colors.accent : past ? colors.labelTertiary : colors.fillStrong }, isNext && { width: 13, height: 13, borderRadius: 7, shadowColor: colors.accent, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }]} />
            </View>
            <PrayerIcon prayer={k} size={20} dim={past} />
            <Text style={[styles.tlName, { color, fontFamily: ui(isNext ? 700 : 400), fontWeight: isNext ? '700' : '400' }]}>{PRAYER_RU[k]}</Text>
            {isNext ? <Txt kind="caption" color="accent" style={{ fontWeight: '600' }}>следующий</Txt> : past ? <Txt kind="caption" color="labelTertiary">прошёл</Txt> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function Tiles({ times, now, nextKey, onPress, colored = false }: Props & { colored?: boolean }) {
  const { colors, r, ui, isDark } = useTheme();
  const tint: Record<PrayerKey, string> = { fajr: colors.prayerFajr, sunrise: colors.prayerSunrise, dhuhr: colors.prayerDhuhr, asr: colors.prayerAsr, maghrib: colors.prayerMaghrib, isha: colors.prayerIsha };
  return (
    <View style={styles.grid}>
      {PRAYER_KEYS.map(k => {
        const at = times[k]; const isNext = k === nextKey; const past = at <= now && !isNext;
        const bg = colored ? tint[k] : isNext ? colors.cardStrong : colors.card;
        const fg = colored ? (isDark ? '#0b1a3b' : '#ffffff') : isNext ? colors.accent : past ? colors.labelTertiary : colors.label;
        return (
          <Pressable key={k} onPress={() => onPress?.(k)} accessibilityRole="button" accessibilityLabel={a11y(k, at, isNext, past)}
            style={[styles.tile, { backgroundColor: bg, borderRadius: r(RADIUS.card - 8), opacity: past ? (colored ? 0.5 : 0.6) : 1, borderWidth: 2, borderColor: isNext ? (colored ? colors.label : colors.accent) : 'transparent' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, lineHeight: 16, color: fg, fontFamily: ui(700), fontWeight: '700', opacity: colored ? 0.9 : 1 }}>{PRAYER_RU[k]}</Text>
              {!colored && <PrayerIcon prayer={k} size={18} dim={past} />}
            </View>
            <Text style={{ fontSize: 22, lineHeight: 26, letterSpacing: -0.4, color: fg, fontFamily: ui(800), fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmtTime(at)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function List({ times, now, nextKey, onPress }: Props) {
  const { colors, ui } = useTheme();
  return (
    <View style={{ paddingHorizontal: SPACE[16], marginBottom: SPACE[24] }}>
      <Card style={{ padding: 0 }}>
        {PRAYER_KEYS.map((k, i) => {
          const at = times[k]; const isNext = k === nextKey; const past = at <= now && !isNext;
          const color = isNext ? colors.accent : past ? colors.labelTertiary : colors.label;
          return (
            <Pressable key={k} onPress={() => onPress?.(k)} accessibilityRole="button" accessibilityLabel={a11y(k, at, isNext, past)}
              style={[styles.lrow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }, isNext && { backgroundColor: colors.fill }]}>
              <PrayerIcon prayer={k} size={22} dim={past} />
              <Text style={[styles.lname, { color, fontFamily: ui(isNext ? 600 : 400), fontWeight: isNext ? '600' : '400' }]}>{PRAYER_RU[k]}</Text>
              {isNext && <Txt kind="caption" color="accent" style={{ fontWeight: '600' }}>следующий</Txt>}
              <Text style={[styles.ltime, { color, fontFamily: ui(isNext ? 700 : 500), fontWeight: isNext ? '700' : '500' }]}>{fmtTime(at)}</Text>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  tl: { marginHorizontal: SPACE[16], marginBottom: SPACE[16], paddingVertical: 4 },
  tlLine: { position: 'absolute', left: 65, top: 20, bottom: 20, width: 1 },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42 },
  tlTime: { width: 50, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
  tlDotWrap: { width: 20, alignItems: 'center', justifyContent: 'center' },
  tlDot: { width: 9, height: 9, borderRadius: 5 },
  tlName: { fontSize: 16, lineHeight: 20, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: SPACE[16], marginBottom: SPACE[16] },
  tile: { width: '31.5%', height: 74, padding: 10, justifyContent: 'space-between' },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: SPACE[16] },
  lname: { fontSize: 17, lineHeight: 22, flex: 1 },
  ltime: { fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
});
