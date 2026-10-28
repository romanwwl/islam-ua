/* Шапка экрана. Вид по стилю: logo — логотип 44 pt + заголовок и подзаголовок; plain — без логотипа;
   big — подзаголовок сверху мелко, заголовок крупно (30 pt); compact — логотип 32 pt и одна строка. Справа — одна круглая кнопка. */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Txt } from './ui';
import { GlassButton } from './Glass';
import { useTheme } from '../theme/ThemeProvider';
import { SPACE, RADIUS, SIZE } from '../theme/tokens';
import type { IconName } from './Icons';

export function Header({ title, subtitle, action, onAction, actionLabel }: { title: string; subtitle?: string; action?: IconName; onAction?: () => void; actionLabel?: string }) {
  const { style, r } = useTheme();
  const k = style.header;
  return (
    <View style={[styles.wrap, k === 'big' && { alignItems: 'flex-start', paddingTop: 10 }]}>
      <View style={[styles.left, k === 'big' && { alignItems: 'flex-start' }]}>
        {k === 'logo' && <Image source={require('../assets/logo.png')} accessibilityLabel="ISLAM UA" style={[styles.logo, { borderRadius: r(RADIUS.logo) }]} />}
        {k === 'compact' && <Image source={require('../assets/logo.png')} accessibilityLabel="ISLAM UA" style={[styles.logo, { width: 32, height: 32, borderRadius: r(9) }]} />}
        <View style={{ gap: 2, flexShrink: 1 }}>
          {k === 'big' && subtitle ? <Txt kind="footnote" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 }} numberOfLines={1}>{subtitle}</Txt> : null}
          <Txt kind="screenTitle" numberOfLines={k === 'big' ? 2 : 1} style={k === 'big' ? { fontSize: 32, lineHeight: 36, letterSpacing: -0.8, fontWeight: '800' } : undefined}>{title}</Txt>
          {k !== 'big' && k !== 'compact' && subtitle ? <Txt kind="subheadline" color="labelSecondary" style={{ fontWeight: '500' }} numberOfLines={1}>{subtitle}</Txt> : null}
        </View>
      </View>
      {action ? <GlassButton icon={action} onPress={onAction} accessibilityLabel={actionLabel ?? 'Настройки'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[16], paddingTop: 4, paddingBottom: 4, gap: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo: { width: SIZE.logo, height: SIZE.logo },
});
