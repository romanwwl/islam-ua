/* Выбор из списка: строка «Название · значение ›» открывает шторку со списком. */
import React, { useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, Row } from './ui';
import { Icon } from './Icons';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS, SPACE } from '../theme/tokens';

export type PickerOption = { value: string; label: string; sub?: string };

export function PickerRow({ title, value, options, onChange, first = false }: { title: string; value: string; options: PickerOption[]; onChange: (v: string) => void; first?: boolean }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cur = options.find(o => o.value === value);
  return (
    <>
      <Row first={first} title={title} detail={cur?.label ?? ''} onPress={() => setOpen(true)} right={<Icon name="chevronRight" size={14} color={colors.labelTertiary} />} />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.grabber, { backgroundColor: colors.labelTertiary }]} />
          <Txt kind="title" style={{ paddingHorizontal: SPACE[20], paddingBottom: 8 }}>{title}</Txt>
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {options.map((o, i) => (
              <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: o.value === value }}
                style={({ pressed }) => [styles.opt, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }, pressed && { opacity: 0.7 }]}>
                <View style={{ flexShrink: 1 }}>
                  <Txt>{o.label}</Txt>
                  {o.sub ? <Txt kind="subheadline" color="labelSecondary">{o.sub}</Txt> : null}
                </View>
                {o.value === value ? <Icon name="checkmark" size={20} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, opacity: 0.5, marginBottom: 12 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52, paddingHorizontal: SPACE[20], paddingVertical: 10 },
});
