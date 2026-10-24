/* Ряд шести намазов: иконка своего цвета, название, время. Прошедшие приглушены, следующий — в золотой рамке. */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PrayerIcon } from './Icons';
import { useTheme } from '../theme/ThemeProvider';
import { PRAYER_KEYS, PRAYER_RU, fmtTime, type PrayerKey, type Times } from '../lib/prayer';
import { RADIUS, SPACE } from '../theme/tokens';

export function PrayerRow({ times, now, nextKey, onPress }: { times: Times; now: Date; nextKey: PrayerKey; onPress?: (k: PrayerKey) => void }) {
  const { colors } = useTheme();
  const [width, setWidth] = React.useState(0);
  const idx = Math.max(0, PRAYER_KEYS.indexOf(nextKey));
  const x = useSharedValue(0);
  const cell = width ? (width - 4 * 5) / 6 : 0;
  useEffect(() => { x.value = withSpring(idx * (cell + 4), { damping: 20, stiffness: 180 }); }, [idx, cell, x]);
  const frame = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={styles.row} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {cell > 0 && (
        <Animated.View pointerEvents="none" style={[styles.frame, { width: cell, borderColor: colors.accent, backgroundColor: colors.fill }, frame]} />
      )}
      {PRAYER_KEYS.map(k => {
        const at = times[k];
        const past = at <= now && k !== nextKey;
        const isNext = k === nextKey;
        const color = isNext ? colors.accent : past ? colors.labelTertiary : colors.label;
        return (
          <Pressable key={k} onPress={() => onPress?.(k)} accessibilityRole="button" accessibilityLabel={`${PRAYER_RU[k]} ${fmtTime(at)}${isNext ? ', следующий' : past ? ', прошёл' : ''}`} style={styles.chip}>
            <PrayerIcon prayer={k} dim={past} />
            <Text style={[styles.name, { color, fontWeight: isNext ? '600' : '400' }]}>{PRAYER_RU[k]}</Text>
            <Text style={[styles.time, { color, fontWeight: isNext ? '600' : '400' }]}>{fmtTime(at)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginHorizontal: SPACE[16], marginBottom: SPACE[24] },
  frame: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: RADIUS.chip, borderWidth: 1.5 },
  chip: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 10, paddingBottom: 8, borderRadius: RADIUS.chip },
  name: { fontSize: 12, lineHeight: 16 },
  time: { fontSize: 15, lineHeight: 20, letterSpacing: -0.23, fontVariant: ['tabular-nums'] },
});
