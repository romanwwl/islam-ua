/* Базовые элементы по дизайн-системе: текст, арабский текст, карточка, заголовок секции, нажимаемое с пружиной. */
import React from 'react';
import { Text, View, Pressable, StyleSheet, type TextProps, type ViewProps, type PressableProps, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { TYPE, SPACE, RADIUS, FONTS } from '../theme/tokens';

type TypeKey = keyof typeof TYPE;

/* Текст интерфейса. kind — стиль из дизайн-системы, color — ключ цвета темы или любой цвет. */
export function Txt({ kind = 'body', color = 'label', style, children, ...rest }: TextProps & { kind?: TypeKey; color?: string }) {
  const { colors } = useTheme();
  const t = TYPE[kind] as { fontSize: number; lineHeight: number; fontWeight: TextStyle['fontWeight']; letterSpacing?: number };
  const c = (colors as Record<string, string>)[color] ?? color;
  const rounded = kind === 'countdown' || kind === 'countdownUnit';
  return (
    <Text
      {...rest}
      style={[{ fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: t.fontWeight, letterSpacing: t.letterSpacing ?? 0, color: c, fontFamily: rounded ? FONTS.rounded : undefined, fontVariant: rounded ? ['tabular-nums'] : undefined }, style]}
    >{children}</Text>
  );
}

/* Арабский текст: шрифт темы, RTL, цвет arabic (или свой) */
export function Ar({ kind = 'arText', color = 'arabic', bold = false, style, children, ...rest }: TextProps & { kind?: TypeKey; color?: string; bold?: boolean }) {
  const { colors, fontArabic, fontArabicBold } = useTheme();
  const t = TYPE[kind] as { fontSize: number; lineHeight: number };
  const c = (colors as Record<string, string>)[color] ?? color;
  return (
    <Text {...rest} style={[{ fontFamily: bold ? fontArabicBold : fontArabic, fontSize: t.fontSize, lineHeight: t.lineHeight, color: c, writingDirection: 'rtl', textAlign: 'right' }, style]}>{children}</Text>
  );
}

/* Карточка на фоне — сплошная заливка card, скругление 26 */
export function Card({ style, strong = false, children, ...rest }: ViewProps & { strong?: boolean }) {
  const { colors } = useTheme();
  return <View {...rest} style={[{ backgroundColor: strong ? colors.cardStrong : colors.card, borderRadius: RADIUS.card, padding: SPACE[16] }, style]}>{children}</View>;
}

/* Подпись секции капителью над карточкой */
export function SectionHeader({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: SPACE[16], paddingBottom: 6 }, style]}>
      <Txt kind="footnote" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase' }}>{children}</Txt>
    </View>
  );
}

/* Нажимаемое с пружинным сжатием 0.97 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function Tap({ style, children, scale = 0.97, ...rest }: PressableProps & { scale?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const sv = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sv.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={e => { sv.value = withSpring(scale, { damping: 18, stiffness: 320 }); rest.onPressIn?.(e); }}
      onPressOut={e => { sv.value = withSpring(1, { damping: 18, stiffness: 320 }); rest.onPressOut?.(e); }}
      style={[a, style]}
    >{children}</AnimatedPressable>
  );
}

/* Капсульная кнопка: filled | gray | plain */
export function Button({ title, variant = 'filled', small = false, disabled, icon, onPress, style }: { title: string; variant?: 'filled' | 'gray' | 'plain'; small?: boolean; disabled?: boolean; icon?: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const bg = variant === 'filled' ? colors.accent : variant === 'gray' ? colors.fill : 'transparent';
  const fg = variant === 'filled' ? colors.onAccent : colors.accent;
  return (
    <Tap onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.btn, small && styles.btnSmall, variant === 'plain' && { paddingHorizontal: 8 }, { backgroundColor: disabled ? colors.fill : bg, opacity: disabled ? 0.6 : 1 }, style]}>
      {icon}
      <Text style={{ fontSize: small ? 15 : 17, lineHeight: small ? 20 : 22, fontWeight: small ? '500' : '600', letterSpacing: small ? -0.23 : -0.43, color: disabled ? colors.labelTertiary : fg }}>{title}</Text>
    </Tap>
  );
}

/* Строка списка внутри Card: текст слева, деталь и шеврон справа */
export function Row({ title, detail, onPress, first = false, right }: { title: string; detail?: string; onPress?: () => void; first?: boolean; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => [styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }, pressed && { opacity: 0.7 }]}>
      <Txt>{title}</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {detail ? <Txt color="labelSecondary" style={{ fontVariant: ['tabular-nums'] }}>{detail}</Txt> : null}
        {right}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, paddingHorizontal: 24, borderRadius: RADIUS.capsule },
  btnSmall: { height: 28, paddingHorizontal: 12 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[16] },
});
