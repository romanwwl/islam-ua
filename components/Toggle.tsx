/* Переключатель в цветах темы: дорожка fill → accent, бегунок белый */
import React from 'react';
import { Switch, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ false: colors.fillStrong, true: colors.accent }} thumbColor="#ffffff" ios_backgroundColor={colors.fillStrong} style={Platform.OS === 'web' ? { transform: [{ scale: 0.9 }] } : undefined} />;
}
