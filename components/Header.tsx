/* Шапка экрана: логотип 44 pt, заголовок и подзаголовок, справа одна стеклянная круглая кнопка. */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Txt } from './ui';
import { GlassButton } from './Glass';
import { SPACE, RADIUS, SIZE } from '../theme/tokens';
import type { IconName } from './Icons';

export function Header({ title, subtitle, action, onAction, actionLabel }: { title: string; subtitle?: string; action?: IconName; onAction?: () => void; actionLabel?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Image source={require('../assets/logo.png')} accessibilityLabel="ISLAM UA" style={styles.logo} />
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Txt kind="screenTitle" numberOfLines={1}>{title}</Txt>
          {subtitle ? <Txt kind="subheadline" color="labelSecondary" style={{ fontWeight: '500' }} numberOfLines={1}>{subtitle}</Txt> : null}
        </View>
      </View>
      {action ? <GlassButton icon={action} onPress={onAction} accessibilityLabel={actionLabel ?? 'Настройки'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[16], paddingTop: 4, paddingBottom: 4, gap: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo: { width: SIZE.logo, height: SIZE.logo, borderRadius: RADIUS.logo },
});
