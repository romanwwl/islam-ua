#!/usr/bin/env python3
"""Генерирует theme/tokens.ts из theme/tokens.json (копия tokens.json дизайн-системы «ISLAM UA»).
   Запуск: python3 tools/gen-tokens.py"""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
t = json.load(open(root / 'theme/tokens.json', encoding='utf-8'))
camel = lambda s: re.sub(r'-([a-z0-9])', lambda m: m.group(1).upper(), s)
themes = t['color']['themes']
ids = [th['id'] for th in themes]
out = ['/* Сгенерировано tools/gen-tokens.py из theme/tokens.json — не редактировать руками. */', '']
out.append('export type ThemeId = ' + ' | '.join(f"'{i}'" for i in ids) + ';')
out.append('export const THEME_IDS: ThemeId[] = [' + ', '.join(f"'{i}'" for i in ids) + '];')
out.append('export const THEME_NAMES: Record<ThemeId, string> = { ' + ', '.join(f"{th['id']}: '{th['name']}'" for th in themes) + ' };')
out.append('')
names = [camel(c['name']) for c in t['color']['tokens']]
out.append('export type Colors = { ' + '; '.join(f'{n}: string' for n in names) + ' };')
out.append('export const COLORS: Record<ThemeId, Colors> = {')
for i in ids:
    row = ', '.join(f"{camel(c['name'])}: '{c['value'][i] if isinstance(c['value'], dict) else c['value']}'" for c in t['color']['tokens'])
    out.append(f'  {i}: {{ {row} }},')
out.append('};')
out.append('')
out.append('export const FONTS = {')
out.append("  text: undefined as string | undefined,      // системный SF Pro")
out.append("  display: undefined as string | undefined,")
out.append("  rounded: undefined as string | undefined,")
out.append("  arabic: 'ScheherazadeNew-Regular',")
out.append("  arabicMedium: 'ScheherazadeNew-Medium',")
out.append("  amiri: 'Amiri-Regular',")
out.append("  amiriBold: 'Amiri-Bold',")
out.append('};')
out.append('')
px = lambda v: str(v).replace('px', '')
out.append('export const TYPE = {')
for g in t['type']['groups']:
    for s in g['styles']:
        ls = f", letterSpacing: {px(s['letterSpacing'])}" if s.get('letterSpacing') else ''
        out.append(f"  {camel(s['name'])}: {{ fontSize: {px(s['fontSize'])}, lineHeight: {px(s['lineHeight'])}, fontWeight: '{s['fontWeight']}' as const{ls} }},  // {s['usage'][:70]}")
out.append('} as const;')
out.append('')
for fam, key in [('spacing', 'SPACE'), ('radius', 'RADIUS'), ('size', 'SIZE')]:
    out.append(f'export const {key} = {{')
    for tok in t[fam]['tokens']:
        n = tok['name'].split('-', 1)[1] if fam != 'size' else tok['name']
        out.append(f"  '{n}': {px(tok['value'])},")
    out.append('} as const;')
    out.append('')
(root / 'theme/tokens.ts').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('theme/tokens.ts written:', len(names), 'colors,', len(ids), 'themes')
