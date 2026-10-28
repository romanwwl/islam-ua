/* Сгенерировано tools/gen-tokens.py из theme/tokens.json — не редактировать руками. */

export type ThemeId = 'sapphire' | 'midnight' | 'emerald' | 'maroon' | 'parchment' | 'sand' | 'deepwater' | 'slate' | 'denim' | 'dusk' | 'steel' | 'morning';
export const THEME_IDS: ThemeId[] = ['sapphire', 'midnight', 'emerald', 'maroon', 'parchment', 'sand', 'deepwater', 'slate', 'denim', 'dusk', 'steel', 'morning'];
export const THEME_NAMES: Record<ThemeId, string> = { sapphire: 'Сапфир', midnight: 'Полночь', emerald: 'Изумруд', maroon: 'Марун', parchment: 'Пергамент', sand: 'Песок', deepwater: 'Глубокая вода', slate: 'Сланец', denim: 'Деним', dusk: 'Сумерки', steel: 'Сталь', morning: 'Утро' };

export type Colors = { bg: string; bgDeep: string; card: string; cardStrong: string; label: string; labelSecondary: string; labelTertiary: string; separator: string; fill: string; fillStrong: string; accent: string; onAccent: string; arabic: string; glass: string; glassSelected: string; correct: string; wrong: string; prayerFajr: string; prayerSunrise: string; prayerDhuhr: string; prayerAsr: string; prayerMaghrib: string; prayerIsha: string; brandBlue: string; brandYellow: string };
export const COLORS: Record<ThemeId, Colors> = {
  sapphire: { bg: '#0b2a6f', bgDeep: '#081f55', card: '#143a8a', cardStrong: '#1c47a0', label: '#ffffff', labelSecondary: '#cdd9f5', labelTertiary: '#95abdd', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#f0c75e', onAccent: '#0b2a6f', arabic: '#f5d583', glass: 'rgba(11,42,111,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  midnight: { bg: '#0f1e3d', bgDeep: '#0c1831', card: '#182b52', cardStrong: '#213866', label: '#ffffff', labelSecondary: '#c3cde6', labelTertiary: '#8794b8', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#d9b35c', onAccent: '#10203f', arabic: '#e8c778', glass: 'rgba(15,30,61,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  emerald: { bg: '#0e3b2e', bgDeep: '#0b3025', card: '#164d3d', cardStrong: '#1c5c49', label: '#ffffff', labelSecondary: '#cbe0d6', labelTertiary: '#8fb5a6', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#d9b65c', onAccent: '#0e3b2e', arabic: '#e8c97c', glass: 'rgba(14,59,46,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#6fdc8f', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  maroon: { bg: '#3a1020', bgDeep: '#2e0c19', card: '#4b1a2c', cardStrong: '#5a2338', label: '#ffffff', labelSecondary: '#e3cbd3', labelTertiary: '#b38f9c', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#e0b860', onAccent: '#3a1020', arabic: '#ebc97e', glass: 'rgba(58,16,32,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#5fd38a', wrong: '#ff8a8a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  parchment: { bg: '#f3ebdd', bgDeep: '#ebe1cf', card: '#fbf7ee', cardStrong: '#ffffff', label: '#17213a', labelSecondary: '#5b6478', labelTertiary: '#8f97a8', separator: 'rgba(0,0,0,0.10)', fill: 'rgba(0,0,0,0.08)', fillStrong: 'rgba(0,0,0,0.14)', accent: '#1e56c9', onAccent: '#ffffff', arabic: '#17305f', glass: 'rgba(243,235,221,0.66)', glassSelected: 'rgba(0,0,0,0.07)', correct: '#1e8e4c', wrong: '#c93a3a', prayerFajr: '#3a6fd8', prayerSunrise: '#e08a2e', prayerDhuhr: '#d9a800', prayerAsr: '#d97a36', prayerMaghrib: '#d9485e', prayerIsha: '#7b5cd6', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  sand: { bg: '#ece3d1', bgDeep: '#e4d9c3', card: '#f6f0e3', cardStrong: '#ffffff', label: '#1c2422', labelSecondary: '#5b6663', labelTertiary: '#8e9896', separator: 'rgba(0,0,0,0.10)', fill: 'rgba(0,0,0,0.08)', fillStrong: 'rgba(0,0,0,0.14)', accent: '#0f6e66', onAccent: '#ffffff', arabic: '#0f4d48', glass: 'rgba(236,227,209,0.66)', glassSelected: 'rgba(0,0,0,0.07)', correct: '#1e8e4c', wrong: '#c93a3a', prayerFajr: '#3a6fd8', prayerSunrise: '#e08a2e', prayerDhuhr: '#d9a800', prayerAsr: '#d97a36', prayerMaghrib: '#d9485e', prayerIsha: '#7b5cd6', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  deepwater: { bg: '#0F2B4A', bgDeep: '#0B2239', card: '#16385C', cardStrong: '#1D4470', label: '#ffffff', labelSecondary: '#C9D7E8', labelTertiary: '#8CA3BF', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#E7C46A', onAccent: '#0F2B4A', arabic: '#F0D28A', glass: 'rgba(15,43,74,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  slate: { bg: '#1E2E4A', bgDeep: '#182540', card: '#283B5C', cardStrong: '#32476C', label: '#ffffff', labelSecondary: '#CBD3E3', labelTertiary: '#8E9BB5', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#E2BE6C', onAccent: '#1E2E4A', arabic: '#EDCB82', glass: 'rgba(30,46,74,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  denim: { bg: '#1A3A6B', bgDeep: '#152F58', card: '#244A80', cardStrong: '#2D5793', label: '#ffffff', labelSecondary: '#CFDBF0', labelTertiary: '#97ACCF', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#F0CB6E', onAccent: '#1A3A6B', arabic: '#F4D68C', glass: 'rgba(26,58,107,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  dusk: { bg: '#1C2B5A', bgDeep: '#16224A', card: '#27386E', cardStrong: '#324482', label: '#ffffff', labelSecondary: '#CDD4EC', labelTertiary: '#929DC4', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#EBC46E', onAccent: '#1C2B5A', arabic: '#F2D28A', glass: 'rgba(28,43,90,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  steel: { bg: '#142238', bgDeep: '#101B2E', card: '#1C2F4C', cardStrong: '#24395C', label: '#ffffff', labelSecondary: '#C4CEDF', labelTertiary: '#8794AD', separator: 'rgba(255,255,255,0.16)', fill: 'rgba(255,255,255,0.14)', fillStrong: 'rgba(255,255,255,0.22)', accent: '#D9B866', onAccent: '#142238', arabic: '#E6C97E', glass: 'rgba(20,34,56,0.66)', glassSelected: 'rgba(255,255,255,0.14)', correct: '#4cd27a', wrong: '#ff7a7a', prayerFajr: '#8fb3ff', prayerSunrise: '#ffb45c', prayerDhuhr: '#ffd54a', prayerAsr: '#ff9a5c', prayerMaghrib: '#ff7a8a', prayerIsha: '#b69cff', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
  morning: { bg: '#E9F0F8', bgDeep: '#DDE8F6', card: '#F7FAFD', cardStrong: '#FFFFFF', label: '#14213a', labelSecondary: '#51607C', labelTertiary: '#8893A9', separator: 'rgba(0,0,0,0.10)', fill: 'rgba(0,0,0,0.08)', fillStrong: 'rgba(0,0,0,0.14)', accent: '#2F5FB3', onAccent: '#FFFFFF', arabic: '#1F3F7A', glass: 'rgba(233,240,248,0.66)', glassSelected: 'rgba(0,0,0,0.07)', correct: '#1e8e4c', wrong: '#c93a3a', prayerFajr: '#3a6fd8', prayerSunrise: '#e08a2e', prayerDhuhr: '#d9a800', prayerAsr: '#d97a36', prayerMaghrib: '#d9485e', prayerIsha: '#7b5cd6', brandBlue: '#1e56c9', brandYellow: '#ffd500' },
};

export const FONTS = {
  text: undefined as string | undefined,      // системный SF Pro
  display: undefined as string | undefined,
  rounded: undefined as string | undefined,
  arabic: 'ScheherazadeNew-Regular',
  arabicMedium: 'ScheherazadeNew-Medium',
  amiri: 'Amiri-Regular',
  amiriBold: 'Amiri-Bold',
};

export const TYPE = {
  screenTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.26 },  // Заголовок экрана в шапке: дата на «Сегодня», «Учёба», «Профиль».
  countdown: { fontSize: 64, lineHeight: 68, fontWeight: '600' as const, letterSpacing: -1.5 },  // Обратный отсчёт до намаза. Табличные цифры. Единицы «ч» и «мин» — стил
  countdownUnit: { fontSize: 24, lineHeight: 30, fontWeight: '510' as const },  // «ч» и «мин» рядом с цифрами отсчёта, цвет label-secondary.
  title: { fontSize: 22, lineHeight: 28, fontWeight: '590' as const, letterSpacing: -0.26 },  // Заголовки разделов Учёбы, результат теста.
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '590' as const, letterSpacing: -0.43 },  // Названия карточек, строк, кнопка «Дальше».
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const, letterSpacing: -0.43 },  // Переводы, варианты ответа, текст строк. Никогда меньше 17 pt для основ
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const, letterSpacing: -0.31 },  // Пояснения под карточкой.
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.23 },  // Транскрипция, подзаголовок даты (хиджра), время в чипах намазов.
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const, letterSpacing: -0.08 },  // Ссылка на суру и аят, источник хадиса, подписи секций (капителью, 590)
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },  // Название намаза в чипе, подписи под иконками.
  tabLabel: { fontSize: 10, lineHeight: 12, fontWeight: '590' as const },  // Подписи вкладок таб-бара.
  arAyah: { fontSize: 32, lineHeight: 56, fontWeight: '400' as const },  // Аят дня, аяты в тесте «На слух». Воздух: интерлиньяж 1.75.
  arText: { fontSize: 28, lineHeight: 44, fontWeight: '400' as const },  // Хадис, дуа, пример из Корана под именем Аллаха.
  arWord: { fontSize: 48, lineHeight: 68, fontWeight: '400' as const },  // Слово в карточке теста (Словарь, Коран, Правописание), имя Аллаха.
  arLetter: { fontSize: 88, lineHeight: 100, fontWeight: '400' as const },  // Буква в тесте «Алфавит», плитки «Собери слово» — 36 px.
  arInline: { fontSize: 22, lineHeight: 32, fontWeight: '400' as const },  // Арабский в строках списка, в вариантах ответа, монограммы разделов.
} as const;

export const SPACE = {
  '4': 4,
  '8': 8,
  '12': 12,
  '16': 16,
  '20': 20,
  '24': 24,
  '32': 32,
} as const;

export const RADIUS = {
  'tile': 8,
  'logo': 12,
  'chip': 14,
  'option': 18,
  'card': 26,
  'sheet': 40,
  'capsule': 999,
} as const;

export const SIZE = {
  'touch-target': 44,
  'row-height': 52,
  'row-height-subtitle': 68,
  'tab-bar-height': 62,
  'option-height': 56,
  'letter-tile': 62,
  'logo': 44,
} as const;

