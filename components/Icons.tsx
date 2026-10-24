/* Иконки: шесть иконок намазов (контур 1.8 на сетке 24, цвет из токенов prayer-*) и заменители SF Symbols для веба/Android.
   На iOS в нативной сборке таб-бар и системные кнопки используют SF Symbols по именам из README дизайн-системы. */
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { PrayerKey } from '../lib/prayer';

const PRAYER_PATHS: Record<PrayerKey, React.ReactNode> = {
  fajr: <><Path d="M14.5 3.5a7.5 7.5 0 1 0 6 12.5 8.5 8.5 0 0 1-6-12.5z" /><Path d="M5 5.5v3M3.5 7h3" /></>,
  sunrise: <><Path d="M3 18h18M7 18a5 5 0 0 1 10 0" /><Path d="M12 9V3m-2.5 2.5L12 3l2.5 2.5M4.5 12.5l1.3.8M19.5 12.5l-1.3.8" /></>,
  dhuhr: <><Circle cx={12} cy={12} r={4} /><Path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" /></>,
  asr: <><Circle cx={12} cy={13} r={3.5} /><Path d="M12 5.5V3.5M5.5 7.5 4 6M18.5 7.5 20 6M3 21h18M4.5 13H2.5M21.5 13h-2" /></>,
  maghrib: <><Path d="M3 18h18M7 18a5 5 0 0 1 10 0" /><Path d="M12 3v6m-2.5-2.5L12 9l2.5-2.5M4.5 12.5l1.3.8M19.5 12.5l-1.3.8" /></>,
  isha: <><Path d="M13 3a8 8 0 1 0 8 9.5A6.5 6.5 0 0 1 13 3z" /><Path d="M5 4.5v2M4 5.5h2M8.5 9v2M7.5 10h2" /></>,
};

export function PrayerIcon({ prayer, size = 24, dim = false }: { prayer: PrayerKey; size?: number; dim?: boolean }) {
  const { colors } = useTheme();
  const color = { fajr: colors.prayerFajr, sunrise: colors.prayerSunrise, dhuhr: colors.prayerDhuhr, asr: colors.prayerAsr, maghrib: colors.prayerMaghrib, isha: colors.prayerIsha }[prayer];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={dim ? 0.55 : 1}>
      {PRAYER_PATHS[prayer]}
    </Svg>
  );
}

export type IconName = 'sliders' | 'play' | 'stop' | 'share' | 'chevronRight' | 'chevronLeft' | 'house' | 'book' | 'person' | 'location' | 'calendar' | 'xmark' | 'checkmark' | 'backspace' | 'arrowRight' | 'speaker' | 'star' | 'moon' | 'bell' | 'map';

const PATHS: Record<IconName, React.ReactNode> = {
  sliders: <><Path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><Circle cx={15} cy={7} r={2} /><Circle cx={9} cy={17} r={2} /></>,
  play: <Path d="M7 4.5v15l12-7.5z" fill="currentColor" />,
  stop: <Path d="M6 6h12v12H6z" fill="currentColor" />,
  share: <Path d="M12 15V4M8 8l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />,
  chevronRight: <Path d="M9 4.5 16.5 12 9 19.5" strokeWidth={2.4} />,
  chevronLeft: <Path d="M15 4.5 7.5 12l7.5 7.5" strokeWidth={2.4} />,
  house: <Path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />,
  book: <><Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><Path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" /></>,
  person: <><Circle cx={12} cy={8} r={4} /><Path d="M4.5 20c.8-3.6 3.9-6 7.5-6s6.7 2.4 7.5 6" /></>,
  location: <Path d="M12 3 7 20l5-4 5 4z" />,
  calendar: <><Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" /><Path d="M4 10h16M8 3v4M16 3v4" /></>,
  xmark: <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  checkmark: <Path d="M5 12.5 9.5 17 19 7.5" />,
  backspace: <><Path d="M21 6H8l-5 6 5 6h13z" /><Path d="M15 9l-4 6M11 9l4 6" /></>,
  arrowRight: <Path d="M4 12h16M13 5l7 7-7 7" />,
  speaker: <><Path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" /><Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  star: <Path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />,
  moon: <Path d="M14.5 3.5a7.5 7.5 0 1 0 6 12.5 8.5 8.5 0 0 1-6-12.5z" />,
  bell: <Path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  map: <><Path d="M3 6.5 9 4l6 2.5 6-2.5v13.5L15 20l-6-2.5-6 2.5z" /><Path d="M9 4v13.5M15 6.5V20" /></>,
};

export function Icon({ name, size = 22, color, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const { colors } = useTheme();
  const c = color ?? colors.label;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} color={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}
