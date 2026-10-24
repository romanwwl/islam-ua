/* Фон экрана: градиент bg → bg-deep и тонкий орнамент темы (гирих, арабеска, ковёр) — за карточками, никогда поверх. */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Path, Circle, RadialGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { ThemeId } from '../theme/tokens';

type PatternKind = 'octagram' | 'lattice' | 'carpet' | 'glow' | 'none';
const KIND: Record<ThemeId, PatternKind> = { sapphire: 'glow', midnight: 'octagram', emerald: 'lattice', maroon: 'carpet', parchment: 'octagram', sand: 'none' };
const GLOW_TOP: Partial<Record<ThemeId, string>> = { sapphire: '#1f4fb8', midnight: '#1a2f62', emerald: '#145040', maroon: '#4a1529', parchment: '#faf4e8', sand: '#f1eada' };

export function Background({ children }: { children?: React.ReactNode }) {
  const { id, colors, pattern, isDark } = useTheme();
  const kind = pattern ? KIND[id] : (id === 'sapphire' ? 'glow' : 'none');
  const stroke = isDark ? colors.accent : colors.arabic;
  const opacity = isDark ? 0.10 : 0.07;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[GLOW_TOP[id] ?? colors.bg, colors.bg, colors.bgDeep]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      {kind !== 'none' && (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            {kind === 'octagram' && (
              <Pattern id="p" patternUnits="userSpaceOnUse" width={72} height={72}>
                <G fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
                  <Rect x={14} y={14} width={44} height={44} />
                  <Rect x={14} y={14} width={44} height={44} transform="rotate(45 36 36)" />
                  <Path d="M36 0v14M36 58v14M0 36h14M58 36h14" />
                </G>
              </Pattern>
            )}
            {kind === 'lattice' && (
              <Pattern id="p" patternUnits="userSpaceOnUse" width={48} height={48}>
                <G fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
                  <Path d="M24 0 48 24 24 48 0 24z" />
                  <Circle cx={24} cy={24} r={6} />
                </G>
              </Pattern>
            )}
            {kind === 'carpet' && (
              <Pattern id="p" patternUnits="userSpaceOnUse" width={64} height={64}>
                <G fill="none" stroke={stroke} strokeWidth={1} opacity={opacity}>
                  <Path d="M32 4 60 32 32 60 4 32z" />
                  <Path d="M32 16 48 32 32 48 16 32z" />
                  <Path d="M0 0h64v64H0z" />
                </G>
              </Pattern>
            )}
            {kind === 'glow' && (
              <RadialGradient id="g" cx="20%" cy="0%" rx="70%" ry="45%" gradientUnits="objectBoundingBox">
                <Stop offset="0" stopColor="#2a62d6" stopOpacity={0.55} />
                <Stop offset="1" stopColor="#2a62d6" stopOpacity={0} />
              </RadialGradient>
            )}
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill={kind === 'glow' ? 'url(#g)' : 'url(#p)'} />
        </Svg>
      )}
      {children}
    </View>
  );
}
