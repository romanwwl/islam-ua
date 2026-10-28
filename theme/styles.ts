/* Стили приложения — не цвета, а компоновка и элементы: как показан отсчёт, намазы, карточки, таб-бар, шапка, Учёба.
   Выбираются в Профиль → Оформление → Стиль. Каждый стиль — набор независимых «рычагов», экраны читают их через useTheme().style. */

export type HeroKind = 'numerals' | 'ring' | 'block' | 'line' | 'tile';
export type PrayersKind = 'chips' | 'timeline' | 'tiles' | 'list' | 'mono';
export type CardsKind = 'solid' | 'glass' | 'outlined' | 'flat' | 'none';
export type TabBarKind = 'floating' | 'flat' | 'pill' | 'icons' | 'labels';
export type RadiusKind = 'round' | 'soft' | 'sharp';
export type FontKind = 'system' | 'manrope' | 'nunito';
export type HeaderKind = 'logo' | 'plain' | 'big' | 'compact';
export type LearnKind = 'cards' | 'rows' | 'tiles' | 'colored';

export type Style = {
  id: StyleId; name: string; desc: string;
  hero: HeroKind; prayers: PrayersKind; cards: CardsKind; tabbar: TabBarKind;
  radius: RadiusKind; font: FontKind; header: HeaderKind; learn: LearnKind;
};

export type StyleId = 'focus' | 'timeline' | 'ring' | 'tiles' | 'list' | 'poster' | 'grid' | 'minimal' | 'card' | 'column' | 'dial';

export const STYLES: Style[] = [
  { id: 'focus',    name: 'Фокус',      desc: 'Крупный отсчёт, ряд намазов, карточки, стеклянный таб-бар',           hero: 'numerals', prayers: 'chips',    cards: 'solid',    tabbar: 'floating', radius: 'round', font: 'system',  header: 'logo',    learn: 'cards' },
  { id: 'timeline', name: 'Таймлайн',   desc: 'Намазы вертикальной лентой, тонкие рамки, шрифт Manrope',              hero: 'numerals', prayers: 'timeline', cards: 'outlined', tabbar: 'flat',     radius: 'soft',  font: 'manrope', header: 'logo',    learn: 'rows' },
  { id: 'ring',     name: 'Кольцо',     desc: 'Кольцо прогресса до намаза, стеклянные карточки, плитки в Учёбе',      hero: 'ring',     prayers: 'chips',    cards: 'glass',    tabbar: 'floating', radius: 'round', font: 'system',  header: 'plain',   learn: 'tiles' },
  { id: 'tiles',    name: 'Изразцы',    desc: 'Цветные плитки намазов, отсчёт на цветной карте, шрифт Nunito',       hero: 'block',    prayers: 'tiles',    cards: 'solid',    tabbar: 'pill',     radius: 'round', font: 'nunito',  header: 'logo',    learn: 'colored' },
  { id: 'list',     name: 'Список',     desc: 'Одна строка про следующий намаз, список времён, плоские карточки',     hero: 'line',     prayers: 'list',     cards: 'flat',     tabbar: 'flat',     radius: 'soft',  font: 'system',  header: 'compact', learn: 'rows' },
  { id: 'poster',   name: 'Афиша',      desc: 'Дата огромная, острые углы, таб-бар только из иконок',                hero: 'numerals', prayers: 'chips',    cards: 'outlined', tabbar: 'icons',    radius: 'sharp', font: 'manrope', header: 'big',     learn: 'cards' },
  { id: 'grid',     name: 'Сетка',      desc: 'Всё плитками: отсчёт и намазы в одной сетке',                         hero: 'tile',     prayers: 'mono',     cards: 'solid',    tabbar: 'floating', radius: 'round', font: 'system',  header: 'plain',   learn: 'tiles' },
  { id: 'minimal',  name: 'Минимум',    desc: 'Без карточек: текст и тонкие линии, таб-бар из слов',                 hero: 'line',     prayers: 'timeline', cards: 'none',     tabbar: 'labels',   radius: 'sharp', font: 'system',  header: 'plain',   learn: 'rows' },
  { id: 'card',     name: 'Карточка',   desc: 'Отсчёт на цветной карте, стекло, таб-бар с цветной «таблеткой»',      hero: 'block',    prayers: 'chips',    cards: 'glass',    tabbar: 'pill',     radius: 'round', font: 'nunito',  header: 'compact', learn: 'tiles' },
  { id: 'column',   name: 'Колонка',    desc: 'Газетная колонка: большая дата, лента намазов, без карточек',         hero: 'numerals', prayers: 'timeline', cards: 'none',     tabbar: 'flat',     radius: 'soft',  font: 'manrope', header: 'big',     learn: 'cards' },
  { id: 'dial',     name: 'Циферблат',  desc: 'Кольцо и цветные плитки намазов, иконки в таб-баре',                  hero: 'ring',     prayers: 'tiles',    cards: 'outlined', tabbar: 'icons',    radius: 'round', font: 'system',  header: 'logo',    learn: 'colored' },
];

export const STYLE_IDS = STYLES.map(s => s.id);
export const styleById = (id: string): Style => STYLES.find(s => s.id === id) ?? STYLES[0];

const RADIUS_SCALE: Record<RadiusKind, number> = { round: 1, soft: 0.6, sharp: 0.3 };
export const scaleRadius = (kind: RadiusKind, v: number) => (v >= 900 ? v : Math.round(v * RADIUS_SCALE[kind]));

/* Семейство UI-шрифта для веса. system → undefined (SF Pro). */
export function uiFont(kind: FontKind, weight: string | number | undefined): string | undefined {
  if (kind === 'system') return undefined;
  const w = typeof weight === 'number' ? weight : weight === 'bold' ? 700 : weight === 'normal' || !weight ? 400 : parseInt(weight, 10) || 400;
  if (kind === 'manrope') return w >= 800 ? 'Manrope_800ExtraBold' : w >= 700 ? 'Manrope_700Bold' : w >= 590 ? 'Manrope_600SemiBold' : 'Manrope_500Medium';
  return w >= 800 ? 'Nunito_900Black' : w >= 700 ? 'Nunito_800ExtraBold' : w >= 590 ? 'Nunito_700Bold' : 'Nunito_600SemiBold';
}
