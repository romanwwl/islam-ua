/* Верх полноэкранного режима (тест, игра, расписание): заголовок, счётчик, закрыть, полоса прогресса. */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, Tap } from './ui';
import { Icon } from './Icons';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE } from '../theme/tokens';

export function ScreenTop({ title, counter, onClose, progress }: { title: string; counter?: string; onClose: () => void; progress?: number }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexShrink: 1 }}>
          <Txt kind="screenTitle" numberOfLines={1} style={{ flexShrink: 1 }}>{title}</Txt>
          {counter ? <Txt kind="subheadline" color="labelSecondary" style={{ fontVariant: ['tabular-nums'] }}>{counter}</Txt> : null}
        </View>
        <Tap onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть" style={[styles.close, { backgroundColor: colors.fill }]}>
          <Icon name="xmark" size={18} />
        </Tap>
      </View>
      {progress !== undefined && (
        <View style={[styles.bar, { backgroundColor: colors.fill }]}>
          <View style={[styles.fill, { backgroundColor: colors.accent, width: `${Math.max(0, Math.min(100, progress))}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[16], paddingVertical: 8, gap: 12 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 3, marginHorizontal: SPACE[16], borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
});
