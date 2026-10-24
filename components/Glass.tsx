/* Liquid Glass — только для слоя управления: круглые кнопки шапки и таб-бар. Никогда для контента. */
import React from 'react';
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';
import { Tap } from './ui';
import { Icon, type IconName } from './Icons';
import { RADIUS, SIZE } from '../theme/tokens';

/* Стеклянная подложка: блюр + оттенок темы + светлая кромка */
export function Glass({ style, contentStyle, children, intensity = 40 }: { style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; children?: React.ReactNode; intensity?: number }) {
  const { colors, isDark } = useTheme();
  const rim = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.12)';
  const highlight = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.85)';
  return (
    <View style={[styles.glass, { borderColor: rim }, style]}>
      {Platform.OS === 'web'
        ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass, backdropFilter: 'blur(22px) saturate(150%)' } as ViewStyle]} />
        : <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass, opacity: Platform.OS === 'web' ? 0 : 0.6 }]} />
      <View pointerEvents="none" style={[styles.highlight, { backgroundColor: highlight }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function GlassButton({ icon, onPress, accessibilityLabel }: { icon: IconName; onPress?: () => void; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ width: SIZE['touch-target'], height: SIZE['touch-target'] }}>
      <Glass style={{ width: SIZE['touch-target'], height: SIZE['touch-target'], borderRadius: RADIUS.capsule, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={colors.label} />
      </Glass>
    </Tap>
  );
}

const styles = StyleSheet.create({
  glass: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.capsule },
  highlight: { position: 'absolute', left: 8, right: 8, top: 0, height: 1, borderRadius: 1 },
  content: { position: 'relative', zIndex: 1, flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
});
