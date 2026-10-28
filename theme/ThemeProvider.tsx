/* Тема приложения: шесть тем из дизайн-системы, выбор пользователя в Профиле.
   useTheme() отдаёт цвета, шрифты и флаги; всё рисуется через них. */
import React, { createContext, useContext, useMemo } from 'react';
import { COLORS, FONTS, THEME_IDS, THEME_NAMES, type Colors, type ThemeId } from './tokens';
import { useThemeSettings, themeStore, type ArabicFont } from '../lib/settings';
import { styleById, scaleRadius, uiFont, type Style, type StyleId, type FontKind } from './styles';

export type Theme = {
  id: ThemeId;
  name: string;
  colors: Colors;
  isDark: boolean;
  pattern: boolean;
  arabicFont: ArabicFont;
  fontArabic: string;        // имя загруженного шрифта для арабского текста
  fontArabicBold: string;
  style: Style;               // компоновка и элементы (Профиль → Оформление → Стиль)
  r: (v: number) => number;   // радиус с учётом стиля
  ui: (weight?: string | number) => string | undefined; // UI-шрифт стиля для веса
  setStyle: (id: StyleId) => void;
  setTheme: (id: ThemeId) => void;
  setPattern: (on: boolean) => void;
  setNightMidnight: (on: boolean) => void;
  setArabicFont: (f: ArabicFont) => void;
  nightMidnight: boolean;
};

export const LIGHT_THEMES: ThemeId[] = ['parchment', 'sand', 'morning'];
export const isDarkTheme = (id: ThemeId) => !LIGHT_THEMES.includes(id);

const Ctx = createContext<Theme | null>(null);

export function ThemeProvider({ children, night = false }: { children: React.ReactNode; night?: boolean }) {
  const s = useThemeSettings();
  const value = useMemo<Theme>(() => {
    const id: ThemeId = s.nightMidnight && night && isDarkTheme(s.theme) ? 'midnight' : s.theme;
    const style = styleById(s.style);
    return {
      id, name: THEME_NAMES[id], colors: COLORS[id], isDark: isDarkTheme(id), pattern: s.pattern,
      style, r: v => scaleRadius(style.radius, v), ui: w => uiFont(style.font as FontKind, w),
      setStyle: st => themeStore.set({ style: st }),
      arabicFont: s.arabicFont,
      fontArabic: s.arabicFont === 'amiri' ? FONTS.amiri : FONTS.arabic,
      fontArabicBold: s.arabicFont === 'amiri' ? FONTS.amiriBold : FONTS.arabicMedium,
      nightMidnight: s.nightMidnight,
      setTheme: t => themeStore.set({ theme: t }),
      setPattern: on => themeStore.set({ pattern: on }),
      setNightMidnight: on => themeStore.set({ nightMidnight: on }),
      setArabicFont: f => themeStore.set({ arabicFont: f }),
    };
  }, [s, night]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTheme вне ThemeProvider');
  return t;
}

export { THEME_IDS, THEME_NAMES, COLORS };
