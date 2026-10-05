# -*- coding: utf-8 -*-
"""Кириллическая транскрипция огласованного арабского текста — «точная» система:
ق→қ, ذ→з̃, ث→с̃, ع→`, хамза с сукуном→', ج→ж, согласные ي/و→й/у, долгие ии/уу удваиваются (ā — одиночное «а»),
артикль присоединяется к предыдущему слову (хууал хаййул қаййуум), идгам танвина/нуна (йаумул ла, ай йа'тийа),
пауза по знакам остановки и в конце аята (без конечной огласовки, ة→а). Всё строчными."""
import re

FATHA, DAMMA, KASRA, SUKUN, SHADDA = 'َ', 'ُ', 'ِ', 'ْ', 'ّ'
FATHATAN, DAMMATAN, KASRATAN = 'ً', 'ٌ', 'ٍ'
DAGGER, MADDA_SIGN, HAMZA_ABOVE = 'ٰ', 'ٓ', 'ٔ'
MARKS = set([FATHA, DAMMA, KASRA, SUKUN, SHADDA, FATHATAN, DAMMATAN, KASRATAN, DAGGER, MADDA_SIGN, HAMZA_ABOVE, 'ٕ', 'ٖ', 'ۡ', 'ۢ', 'ۥ', 'ۦ', 'ۧ', 'ۨ', '۪', '۫', '۬', 'ۭ'])
PAUSE_MARKS = set('ۖۗۘۚ')      # ۖ ۗ ۘ ۚ — остановка
IGNORE_MARKS = set('ۙۛۜ۝۞۟۠۩')  # ۙ ۛ ۜ ۞ … — не влияют

C = {'ب':'б','ت':'т','ث':'с̃','ج':'ж','ح':'х','خ':'х','د':'д','ذ':'з̃','ر':'р','ز':'з','س':'с','ش':'ш','ص':'с','ض':'д',
     'ط':'т','ظ':'з','ع':'`','غ':'г','ف':'ф','ق':'қ','ك':'к','ل':'л','م':'м','ن':'н','ه':'х','و':'у','ي':'й','ة':'т',
     'ء':"'",'أ':"'",'إ':"'",'ؤ':"'",'ئ':"'",'ٱ':'','ا':'','آ':'','ى':'','ٰ':''}
SUN = set('تثدذرزسشصضطظلن')
V = {FATHA:'а', DAMMA:'у', KASRA:'и'}
TANWIN = {FATHATAN:'ан', DAMMATAN:'ун', KASRATAN:'ин'}
IDGHAM = {'و':'у','ي':'й','ل':'л','ر':'р','م':'м','ن':'н'}   # нун/танвин перед этими буквами уподобляется
HAMZAS = set('ءأإؤئ')
SPECIAL = {'مِائَة': 'миа', 'مِائَتَان': 'миатан', 'مِائَةٍ': 'миатин', 'مِائَةً': 'миатан'}

def word(text):
    """Отдельное словарное слово: паузальная форма, но конечная фатха глагола сохраняется (қала)."""
    L = parse(text.strip())
    keep = bool(L) and FATHA in L[-1][1] and L[-1][0] not in 'ةا' and not (L[-1][1] & {FATHATAN, DAMMATAN, KASRATAN})
    return translit(text, final_pause=not keep)

def parse(word):
    out = []
    for ch in word:
        if ch in MARKS:
            if out: out[-1][1].add(ch)
        elif ch in PAUSE_MARKS or ch in IGNORE_MARKS:
            continue
        else:
            out.append([ch, set()])
    return out

def is_long_alif(L, i):
    """буква i — немая алиф/мадда долгого ā (без огласовки)"""
    ch, m = L[i]
    return ch in 'اى' and not (m & {FATHA, DAMMA, KASRA, SUKUN, SHADDA}) and i > 0

def word_core(L, pausal, prev_vowel_end):
    """L — список [буква, {знаки}] без артикля. Возвращает (строка, оконч. гласной?)"""
    res = ''
    n = len(L)
    i = 0
    while i < n:
        ch, m = L[i]
        last = (i == n - 1)
        # --- немая алиф после وا (آمَنُوا) и после танвина (يَتِيمًا) ---
        if ch == 'ا' and not m and i > 0 and ((L[i-1][0] == 'و' and i == n - 1) or FATHATAN in L[i-1][1]):
            i += 1; continue
        # --- долгий ā: ا / ى без огласовки, dagger alif, мадда ---
        if ch in 'اى' and not (m & {FATHA, DAMMA, KASRA, SUKUN, SHADDA, FATHATAN, DAMMATAN, KASRATAN}):
            if i == 0:  # васла / начальный алиф без огласовки — пропускаем (обработано вызывающим)
                i += 1; continue
            if not res.endswith('а'): res += 'а'
            i += 1; continue
        if ch == 'آ':
            res += 'а'
            i += 1; continue
        # --- хамза ---
        if ch in HAMZAS:
            if i == 0:
                cons = ''                           # начальная хамза не пишется
            elif SUKUN in m:
                cons = "'"                           # йа'тийа, та'хуз̃уху
            elif last and not (m & {FATHA, DAMMA, KASRA, FATHATAN, DAMMATAN, KASRATAN}):
                cons = ''                            # конечная хамза без огласовки
            elif last and pausal:
                cons = ''                            # ша, шафа`а
            else:
                cons = '' if (res.endswith('а') and FATHA not in m and FATHATAN not in m) else "'"   # саила, но ша'а, абуу'у
        else:
            cons = C.get(ch, ch)
        # --- согласные ي / و как долгие гласные ---
        if ch == 'ي' and not (m & {FATHA, DAMMA, KASRA, SHADDA, FATHATAN, DAMMATAN, KASRATAN}) and i > 0:
            pv = L[i-1][1]
            if KASRA in pv:   # ии
                res += 'и'; i += 1; continue
            if FATHA in pv:   # ай
                res += 'й'; i += 1; continue
        if ch == 'و' and not (m & {FATHA, DAMMA, KASRA, SHADDA, FATHATAN, DAMMATAN, KASRATAN}) and i > 0:
            pv = L[i-1][1]
            if DAMMA in pv:   # уу
                res += 'у'; i += 1; continue
            if FATHA in pv:   # ау
                res += 'у'; i += 1; continue
        # --- ة ---
        if ch == 'ة':
            if pausal and last:
                if not res.endswith('а'): res += 'а'
                i += 1; continue
            cons = 'т'
        # --- шадда ---
        if SHADDA in m and cons and i > 0:
            cons = cons * 2
        res += cons
        # --- огласовка ---
        tan = next((t for t in TANWIN if t in m), None)
        vow = next((v for v in V if v in m), None)
        if tan:
            if last and pausal:
                if tan == FATHATAN: res += 'а'
            else:
                res += TANWIN[tan]
        elif vow:
            if last and pausal and ch != 'ا':
                pass                                 # конечная краткая гласная при паузе опускается
            else:
                res += V[vow]
        i += 1
    return res

def split_article(L):
    """Возвращает (clitic_prefix_str, article_letter|None, rest_L) для слова с артиклем/частицами."""
    pre = ''
    # частицы وَ فَ بِ لِ كَ (только когда дальше есть ещё ≥2 буквы и частица огласована)
    while len(L) > 2 and L[0][0] in 'وفبلك' and (L[0][1] & {FATHA, KASRA}) and not (L[0][1] & {SHADDA, SUKUN}) and L[1][0] in 'اٱ' and not (L[1][1] & {FATHA, DAMMA, KASRA}):
        pre += C[L[0][0]] + V[next(v for v in V if v in L[0][1])]
        L = L[1:]
    art = None
    if len(L) >= 3 and L[0][0] in 'اٱ' and not (L[0][1] & {FATHA, DAMMA, KASRA}) and L[1][0] == 'ل':
        lm, nm = L[1][1], L[2][1]
        if SHADDA in lm:                      # الَّذِي — ل со шаддой
            art = 'л'; rest = [[L[1][0], lm - {SHADDA}]] + L[2:]
        elif SUKUN in lm or not (SHADDA in nm):  # лунная
            art = 'л'; rest = L[2:]
        else:                                  # солнечная: الشَّمْس
            art = C[L[2][0]]; rest = [[L[2][0], nm - {SHADDA}]] + L[3:]
        return pre, art, rest
    # لِلَّهِ / لِلنَّاسِ: частица ل + артикль без алифа
    if len(L) >= 3 and L[0][0] == 'ل' and (KASRA in L[0][1]) and L[1][0] == 'ل' and (SHADDA in L[1][1] or SUKUN in L[1][1] or (SHADDA in L[2][1])):
        pre += 'ли'
        lm, nm = L[1][1], L[2][1]
        if SHADDA in lm: return pre, 'л', [[L[1][0], lm - {SHADDA}]] + L[2:]
        if SUKUN in lm: return pre, 'л', L[2:]
        return pre, C[L[2][0]], [[L[2][0], nm - {SHADDA}]] + L[3:]
    return pre, None, L

def ends_vowel(s):
    return bool(s) and (s[-1] in 'аиу' or s[-1] == '`' and False)

def translit(text, final_pause=True):
    text = re.sub(r'\s+([\u06d6-\u06dc\u06de-\u06ed]+)', r'\1', text)   # знаки паузы — к предыдущему слову
    toks = re.split(r'\s+', text.strip())
    out = []          # список слов (строк)
    prev_pause = True # перед первым словом — как после паузы
    for k, raw in enumerate(toks):
        raw = re.sub(r'[،؛.,:;!?()«»\[\]]', '', raw)
        if not raw: continue
        if raw in SPECIAL:
            out.append(SPECIAL[raw]); prev_pause = False; continue
        pause_after = any(ch in PAUSE_MARKS for ch in raw) or (k == len(toks) - 1 and final_pause)
        L = parse(raw)
        if not L: continue
        pre, art, rest = split_article(L)
        # начальная васла без артикля (اسْتَعِينُوا) — алиф без огласовки
        if rest and rest[0][0] in 'اٱ' and not (rest[0][1] & {FATHA, DAMMA, KASRA, SUKUN, FATHATAN, DAMMATAN, KASRATAN}) and art is None and len(rest) > 2:
            if pre or not prev_pause:
                core = word_core(rest[1:], pause_after, True)      # васла после гласной не читается: бисмика, уа`фу
            else:
                core = 'и' + word_core(rest[1:], pause_after, False)
        else:
            core = word_core(rest, pause_after, not prev_pause)
        # Аллах: всегда слитно
        if art is not None:
            is_allah = (len(rest) >= 2 and rest[0][0] == 'ل' and rest[1][0] == 'ه')
            if pre:
                w = pre + art + core if not is_allah else pre + 'л' + core
            elif prev_pause or not out:
                w = ('а' + art + core) if art != 'л' or is_allah else ('ал' + core)
                if art != 'л' and not is_allah: w = 'а' + art + core   # ассамауати
            else:
                if is_allah:
                    out[-1] = out[-1] + 'л' + core; w = None     # хууаллаху
                else:
                    out[-1] = out[-1] + art; w = core            # хууал хаййу
        else:
            w = pre + core
        if w is not None:
            # идгам: конец предыдущего слова на «н» (нун сакина/танвин) перед و ي ل ر م ن, иклаб перед ب
            if out and not prev_pause and out[-1].endswith('н') and w:
                fch = rest[0][0] if rest else ''
                if fch in IDGHAM: out[-1] = out[-1][:-1] + IDGHAM[fch]
                elif fch == 'ب': out[-1] = out[-1][:-1] + 'м'
            out.append(w)
        prev_pause = pause_after
    s = ' '.join(out)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

if __name__ == '__main__':
    import sys
    for t in sys.argv[1:]: print(translit(t))
