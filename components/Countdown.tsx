/* Герой экрана «Сегодня»: «До Зухра осталось» и крупный отсчёт. Время намаза здесь не показывается — оно в ряду чипов. */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Txt } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import { PRAYER_GEN, countdownParts, type NextPrayer } from '../lib/prayer';
import { FONTS, SPACE } from '../theme/tokens';

export function Countdown({ next, note }: { next: NextPrayer; note: string }) {
  const { colors } = useTheme();
  const { h, m, s } = countdownParts(next.ms);
  const big = { fontFamily: FONTS.rounded, fontSize: 64, lineHeight: 68, fontWeight: '600' as const, letterSpacing: -1.5, color: colors.accent, fontVariant: ['tabular-nums'] as const };
  const unit = { fontFamily: FONTS.rounded, fontSize: 24, lineHeight: 30, fontWeight: '500' as const, color: colors.labelSecondary };
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`До ${PRAYER_GEN[next.key]} осталось ${h} часов ${m} минут`}>
      <Txt kind="footnote" color="labelSecondary" style={styles.eyebrow}>До {PRAYER_GEN[next.key]} осталось</Txt>
      <View style={styles.row}>
        {h > 0 ? (<><Text style={big}>{h}</Text><Text style={unit}>ч</Text><Text style={[big, { marginLeft: 6 }]}>{two(m)}</Text><Text style={unit}>мин</Text></>)
          : m > 0 ? (<><Text style={big}>{m}</Text><Text style={unit}>мин</Text><Text style={[big, { marginLeft: 6 }]}>{two(s)}</Text><Text style={unit}>с</Text></>)
          : (<><Text style={big}>{s}</Text><Text style={unit}>с</Text></>)}
      </View>
      <Txt kind="subheadline" color="labelSecondary">{note}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE[16], paddingTop: 22, paddingBottom: 18, gap: 2 },
  eyebrow: { fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
