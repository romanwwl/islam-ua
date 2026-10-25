/* Универсальный тест для 10 режимов и «Повторения»: карточка вопроса, 4 варианта, назад · Дальше, панель с разбором,
   статистика, «Начать заново», результат. Сессия сохраняется — можно выйти и продолжить с того же вопроса. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Pressable, Text, StyleSheet, ActivityIndicator, type ScrollViewInstance } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenTop } from '../components/ScreenTop';
import { Card, Txt, Ar, Button, Tap } from '../components/ui';
import { Icon } from '../components/Icons';
import { Toggle } from '../components/Toggle';
import { useTheme } from '../theme/ThemeProvider';
import { MODES, MODE_KEYS, NONCONNECT, displayForm, letterForms, highlightParts, ayatWord, buildOptions, buildDeck, resultMessage, surahName, saveSession, clearSession, restoreSession, type DeckEntry, type ModeKey, type Option, type Session } from '../lib/quiz';
import { record, dueAcross } from '../lib/progress';
import { hapticCorrect, hapticWrong } from '../lib/haptics';
import { refLabel as ayahRefLabel } from '../lib/daily';
import { playAyah, stopAyah, onAudio, playLetter, type AudioState } from '../lib/audio';
import { gapParts } from '../lib/spelling';
import { SPACE, RADIUS } from '../theme/tokens';

function numNote(x: any): string {
  const n = x.n;
  if (x.kind === 'digit' && n >= 10) return 'Многозначные числа пишутся слева направо, как и у нас: ١٢ = 12, ١٠٠ = 100.';
  if (n === 0) return 'صِفْر — «ноль»; от этого слова происходит и европейское «цифра».';
  if (n === 1) return 'وَاحِد — мужской род, وَاحِدَة — женский. Стоит после существительного: كِتَابٌ وَاحِدٌ — одна книга.';
  if (n === 2) return 'اِثْنَان — двойственное число; с женским родом اِثْنَتَان. Чаще просто используется двойственная форма слова: كِتَابَانِ — две книги.';
  if (n <= 10) return 'Числительные 3–10 с существительными мужского рода имеют ة на конце, с женским — без неё: خَمْسَةُ رِجَالٍ — пять мужчин, خَمْسُ نِسَاءٍ — пять женщин.';
  if (n < 20) return 'Числительные 11–19 составные: единицы + عَشَرَ, обе части оканчиваются на фатху и не изменяются по падежам.';
  if (n < 100) return 'Десятки 20–90 оканчиваются на ـُون (в именительном падеже) или ـِين (в косвенных): عِشْرُونَ / عِشْرِينَ.';
  if (n === 100) return 'مِائَة читается «миа» — алиф в середине не произносится. Двести — مِائَتَان.';
  return 'أَلْف — тысяча; две тысячи — أَلْفَان, тысячи — آلَاف.';
}

function makeSession(key: string): Session {
  if (key === 'review') {
    const r = restoreSession('review');
    if (r) return { ...r.session, resume: r.state };
    const src: Record<string, { items: any[]; idOf: (x: any) => string }> = {};
    for (const m of MODE_KEYS) src[m] = { items: MODES[m].data, idOf: MODES[m].id };
    const deck = dueAcross(src).sort(() => Math.random() - 0.5).slice(0, 30) as DeckEntry[];
    return { title: 'Повторение', mode: null, deck };
  }
  const mode = key as ModeKey;
  const r = restoreSession(mode);
  return r ? { ...r.session, resume: r.state } : { title: MODES[mode].title, mode, deck: buildDeck(mode) };
}

export default function Quiz() {
  const { mode: modeParam } = useLocalSearchParams<{ mode: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fontArabic } = useTheme();
  const session = useMemo(() => makeSession(modeParam || 'alphabet'), [modeParam]);
  const init = session.resume;

  const [deck, setDeck] = useState<DeckEntry[]>(init ? init.deck : session.deck);
  const [pos, setPos] = useState(init ? init.pos : 0);
  const [optsCache, setOpts] = useState<(Option[] | undefined)[]>(init ? init.optsCache : []);
  const [answers, setAnswers] = useState<(Option | null)[]>(init ? init.answers : []);
  const [hints, setHints] = useState<number[]>(init ? init.hints : []);
  const [finished, setFinished] = useState(false);
  const [formsMode, setFormsMode] = useState(false);
  const [audio, setAudio] = useState<AudioState>('ended');
  const [heard, setHeard] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<ScrollViewInstance>(null);

  const entry = deck[pos] ?? null;
  const mode: ModeKey = entry?.mode ?? session.mode ?? 'alphabet';
  const current = entry?.item ?? null;
  const cfg = MODES[mode];
  const label = (m: ModeKey, it: Option) => MODES[m].label(it);
  const options = optsCache[pos] ?? [];
  const chosen = answers[pos] ?? null;
  const answered = chosen !== null;
  const hintOpen = !!hints[pos];
  const correctLabel = current ? label(mode, current) : '';
  const isCorrect = (i: number) => answers[i] != null && label(deck[i].mode, answers[i] as Option) === label(deck[i].mode, deck[i].item);
  const total = answers.filter(a => a != null).length;
  const score = deck.reduce((n, _, i) => n + (isCorrect(i) ? 1 : 0), 0);
  let streak = 0; for (let i = total - 1; i >= 0; i--) { if (isCorrect(i)) streak++; else break; }
  const mistakes = deck.reduce((n, _, i) => n + (answers[i] != null && !isCorrect(i) ? 1 : 0), 0);
  const allAnswered = deck.length > 0 && total === deck.length;
  const accuracy = total ? Math.round(score / total * 100) + '%' : '—';
  const progress = deck.length ? Math.min(total / deck.length * 100, 100) : 0;
  const pct = deck.length ? Math.round(score / deck.length * 100) : 0;
  const cardState = !answered ? '' : (label(mode, chosen as Option) === correctLabel ? 'correct' : 'wrong');
  const glyph = useMemo(() => (current && mode === 'alphabet' ? displayForm(current.c, formsMode) : ''), [current, mode, formsMode, pos]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((st: { deck: DeckEntry[]; optsCache: (Option[] | undefined)[]; answers: (Option | null)[]; hints: number[]; pos: number }, done = false) => {
    if (done) { clearSession(session); return; }
    saveSession(session, st);
  }, [session]);

  const goTo = useCallback((i: number, d = deck, oc = optsCache, an = answers, hs = hints) => {
    let next = oc;
    if (!oc[i] || !oc[i]!.length) { next = [...oc]; next[i] = buildOptions(d[i].mode, d[i].item); setOpts(next); }
    setPos(i);
    persist({ deck: d, optsCache: next, answers: an, hints: hs, pos: i });
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [deck, optsCache, answers, hints, persist]);

  useEffect(() => { if (deck.length) goTo(init ? init.pos : 0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // аудио: состояние и остановка при смене вопроса
  useEffect(() => onAudio(s => setAudio(s)), []);
  useEffect(() => { stopAyah(); setAudio('ended'); }, [pos]);
  useEffect(() => () => { stopAyah(); }, []);

  function next() {
    if (!answered) return;
    if (pos + 1 >= deck.length) { if (allAnswered) { setFinished(true); clearSession(session); } return; }
    goTo(pos + 1);
  }
  function back() { if (pos > 0) goTo(pos - 1); }
  function review() {
    setFinished(false);
    const first = deck.findIndex((_, i) => answers[i] != null && !isCorrect(i));
    goTo(first >= 0 ? first : 0);
  }
  function reset(d: DeckEntry[]) {
    setDeck(d); setOpts([]); setAnswers([]); setHints([]); setFinished(false); clearSession(session);
    goTo(0, d, [], [], []);
  }
  function restart() { reset(session.mode ? buildDeck(session.mode) : [...deck].sort(() => Math.random() - 0.5)); }
  function choose(opt: Option) {
    if (answered) return;
    const an = [...answers]; an[pos] = opt; setAnswers(an);
    const ok = label(mode, opt) === correctLabel;
    if (ok) hapticCorrect(); else hapticWrong();
    record(mode, cfg.id(current), ok);
    persist({ deck, optsCache, answers: an, hints, pos });
  }
  function showHint() { const hs = [...hints]; hs[pos] = 1; setHints(hs); persist({ deck, optsCache, answers, hints: hs, pos }); }
  function playCurrent() { if (mode !== 'listen' || !current) return; setHeard(h => ({ ...h, [pos]: true })); playAyah(current.ref); }

  const optState = (o: Option): 'idle' | 'correct' | 'wrong' | 'dim' => {
    if (!answered) return 'idle';
    if (label(mode, o) === correctLabel) return 'correct';
    if (o === chosen) return 'wrong';
    return 'dim';
  };
  const title = session.title + (session.mode === null && entry ? ` · ${MODES[mode].title}` : '');
  const quranRef = (w: any) => { const [s, a] = w.ref.split(':'); return `Сура ${s} «${surahName(+s)}», аят ${a}`; };

  if (!deck.length) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenTop title={session.title} onClose={() => router.back()} />
        <View style={{ padding: SPACE[16], gap: 12 }}><Txt color="labelSecondary">Пока нечего повторять — всё, что вы учили, ещё держится в памяти.</Txt><Button variant="gray" title="К разделам" onPress={() => router.back()} /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenTop title={title} counter={`${finished ? deck.length : pos + 1} / ${deck.length}`} onClose={() => router.back()} progress={progress} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + 32, gap: 14 }} showsVerticalScrollIndicator={false}>
        {!finished && current ? (
          <Animated.View key={pos} entering={FadeInDown.duration(220)} style={{ gap: 14 }}>
            {/* ---- карточка вопроса ---- */}
            <Card style={[styles.qcard, cardState === 'correct' && { borderColor: colors.correct, borderWidth: 2 }, cardState === 'wrong' && { borderColor: colors.wrong, borderWidth: 2 }]}>
              {mode === 'alphabet' && (
                <Pressable onPress={() => playLetter(current.audio)} accessibilityRole="button" accessibilityLabel="Прослушать букву">
                  <Ar kind="arLetter" style={{ textAlign: 'center' }}>{glyph}</Ar>
                </Pressable>
              )}
              {mode === 'surah' && (<><Txt style={styles.bigNum}>{current.n}</Txt><Txt kind="subheadline" color="labelSecondary">Сура № {current.n} из 114</Txt></>)}
              {mode === 'numbers' && (<><Ar kind="arWord" style={{ textAlign: 'center' }}>{current.ar}</Ar>{current.kind === 'word' && <Txt kind="subheadline" color="labelSecondary">{current.tl}</Txt>}</>)}
              {mode === 'missing' && (() => { const g = gapParts(current.sk, current.idx); return (
                <>
                  <Text style={{ fontFamily: fontArabic, fontSize: 48, lineHeight: 68, color: colors.arabic, writingDirection: 'rtl', textAlign: 'center' }}>
                    {g.before}<Text style={{ color: 'transparent', textDecorationLine: 'underline', textDecorationStyle: 'dashed', textDecorationColor: colors.accent }}>{g.gap}</Text>{g.after}
                  </Text>
                  <Txt kind="subheadline" color="labelSecondary">{current.ru}  ·  {current.tr}</Txt>
                </>
              ); })()}
              {mode === 'harakat' && (<><Ar kind="arWord" style={{ textAlign: 'center' }}>{current.sk}</Ar><Txt kind="subheadline" color="labelSecondary">{current.ru}  ·  {current.tr}</Txt><Txt kind="footnote" color="labelTertiary">Как правильно огласовать?</Txt></>)}
              {mode === 'listen' && (
                <>
                  <Tap onPress={playCurrent} accessibilityRole="button" accessibilityLabel="Прослушать аят" style={[styles.playBig, { backgroundColor: colors.accent }]}>
                    {audio === 'loading' ? <ActivityIndicator color={colors.onAccent} /> : <Icon name={audio === 'playing' ? 'stop' : 'play'} size={34} color={colors.onAccent} />}
                  </Tap>
                  <Txt kind="subheadline" color="labelSecondary" style={{ textAlign: 'center' }}>
                    {audio === 'error' ? 'Не удалось загрузить аудио — проверьте интернет' : audio === 'playing' ? 'Слушайте… нажмите, чтобы остановить' : audio === 'loading' ? 'Загрузка…' : heard[pos] ? 'Нажмите, чтобы прослушать ещё раз' : 'Прослушайте аят и выберите его перевод'}
                  </Txt>
                </>
              )}
              {mode === 'sira' && <Txt kind="title" style={{ textAlign: 'center', fontWeight: '600' }}>{current.q}</Txt>}
              {mode === 'names' && (<><Ar kind="arWord" style={{ textAlign: 'center' }}>{current.ar}</Ar><Txt kind="subheadline" color="labelSecondary">{current.ru}  ·  {current.lat}</Txt></>)}
              {(mode === 'dict' || mode === 'quran') && (<><Ar kind="arWord" style={{ textAlign: 'center' }}>{current.ar}</Ar><Txt kind="subheadline" color="labelSecondary">{current.ru}</Txt></>)}

              {mode === 'alphabet' && <Button small variant="gray" title="Слушать" icon={<Icon name="speaker" size={16} color={colors.accent} />} onPress={() => playLetter(current.audio)} />}
              {mode === 'surah' && (hintOpen
                ? <Txt kind="callout" color="labelSecondary" style={{ textAlign: 'center' }}>{current.t} сура · {current.ay} {ayatWord(current.ay)} · {current.hint}</Txt>
                : !answered && <Button small variant="gray" title="Подсказка" onPress={showHint} />)}
            </Card>

            {mode === 'alphabet' && (
              <Card style={{ gap: 10 }}>
                <Txt kind="footnote" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase' }}>Формы буквы</Txt>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {letterForms(current.c).map(f => (
                    <View key={f.lbl} style={{ alignItems: 'center', gap: 2, flex: 1 }}>
                      <Txt kind="caption" color="labelSecondary">{f.lbl}</Txt>
                      <Ar kind="arInline" style={{ fontSize: 30, lineHeight: 44 }}>{f.g}</Ar>
                    </View>
                  ))}
                </View>
                {NONCONNECT.has(current.c) && <Txt kind="footnote" color="labelTertiary">Соединяется только справа — отдельных начальной и серединной форм нет.</Txt>}
              </Card>
            )}

            {/* ---- варианты ---- */}
            <View style={[styles.options, (cfg.single || mode === 'sira' || mode === 'surah' || mode === 'listen') ? { flexDirection: 'column' } : { flexDirection: 'row', flexWrap: 'wrap' }]}>
              {options.map((o, i) => {
                const st = optState(o);
                const single = cfg.single || mode === 'sira' || mode === 'surah' || mode === 'listen';
                return (
                  <Pressable key={i} onPress={() => choose(o)} disabled={answered} accessibilityRole="button"
                    style={({ pressed }) => [styles.opt, single ? styles.optSingle : styles.optHalf, { backgroundColor: colors.card },
                      st === 'correct' && { borderColor: colors.correct, borderWidth: 2 }, st === 'wrong' && { borderColor: colors.wrong, borderWidth: 2 }, st === 'dim' && { opacity: 0.5 }, pressed && !answered && { transform: [{ scale: 0.98 }] }]}>
                    {cfg.arOpts
                      ? <Ar kind="arInline" color="label" style={{ fontSize: 30, lineHeight: 40, textAlign: 'center', flex: 1 }}>{label(mode, o)}</Ar>
                      : <Txt style={{ flex: 1, textAlign: single ? 'left' : 'center', color: st === 'wrong' ? colors.labelSecondary : colors.label }}>{label(mode, o)}</Txt>}
                    {st === 'correct' && <Icon name="checkmark" size={20} color={colors.correct} />}
                    {st === 'wrong' && <Icon name="xmark" size={20} color={colors.wrong} />}
                  </Pressable>
                );
              })}
            </View>

            {/* ---- назад · дальше ---- */}
            <View style={styles.nextrow}>
              <Tap onPress={back} disabled={pos === 0} accessibilityRole="button" accessibilityLabel="Назад" style={[styles.backBtn, { backgroundColor: colors.fill, opacity: pos === 0 ? 0.4 : 1 }]}>
                <Icon name="chevronLeft" size={20} />
              </Tap>
              <View style={{ flex: 1, opacity: answered ? 1 : 0 }} pointerEvents={answered ? 'auto' : 'none'}>
                <Button title={pos + 1 >= deck.length ? (allAnswered ? 'Результат →' : 'Дальше →') : 'Дальше →'} onPress={next} />
              </View>
            </View>

            {/* ---- разбор ---- */}
            {answered && mode !== 'dict' && (
              <Card style={{ gap: 8 }}>
                {mode === 'alphabet' && (<>
                  <Txt kind="headline">{current.c} — {current.name}</Txt>
                  <Txt kind="callout">Звук: {current.sound}</Txt>
                  <Example label="Пример">
                    {(() => { const p = highlightParts(current.ex.w, current.ex.hi); return (
                      <Text style={{ fontFamily: fontArabic, fontSize: 36, lineHeight: 52, color: colors.arabic, writingDirection: 'rtl', textAlign: 'right' }}>{p.before}<Text style={{ color: colors.accent }}>{p.target}</Text>{p.after}</Text>
                    ); })()}
                    <Txt kind="subheadline" color="labelSecondary">{current.ex.tl} — «{current.ex.tr}»</Txt>
                  </Example>
                </>)}
                {mode === 'names' && (<>
                  <Txt kind="headline">{current.ru} · {current.lat}</Txt>
                  <Txt kind="subheadline" color="labelSecondary">{current.variants}</Txt>
                  <Txt kind="callout">{current.info}</Txt>
                  {current.ex && (
                    <Example label="Из Корана">
                      <Ar kind="arText">{current.ex}</Ar>
                      <Txt kind="subheadline" color="labelSecondary">{current.exl}</Txt>
                      <Txt kind="callout">{current.ext}</Txt>
                      <Txt kind="footnote" color="labelSecondary">{quranRef(current)}</Txt>
                      {current.exnote && <Txt kind="footnote" color="labelTertiary">{current.exnote}</Txt>}
                    </Example>
                  )}
                </>)}
                {(mode === 'missing' || mode === 'harakat') && (<>
                  <Ar kind="arText" style={{ textAlign: 'left' }}>{current.ar}</Ar>
                  <Txt kind="subheadline" color="labelSecondary">{current.ru} — {current.tr}</Txt>
                  {mode === 'missing' && <Txt kind="callout">Пропущена буква <Text style={{ fontFamily: fontArabic, fontSize: 24, color: colors.arabic }}>{current.letter}</Text>{current.letter === 'ة' ? ' — та-марбута, пишется только в конце слова' : 'دذرزوا'.includes(current.letter) ? ' — после неё буквы не соединяются' : ''}.</Txt>}
                </>)}
                {mode === 'listen' && (
                  <Example>
                    <Ar kind="arAyah">{current.ar}</Ar>
                    <Txt kind="subheadline" color="labelSecondary">{current.tl}</Txt>
                    <Txt kind="footnote" color="labelSecondary">Коран, {ayahRefLabel(current.ref)} · чтец Мишари аль-Афаси</Txt>
                  </Example>
                )}
                {mode === 'numbers' && (<>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <Ar kind="arInline" style={{ fontSize: 28, lineHeight: 40 }}>{current.kind === 'word' ? current.ar : current.word}</Ar>
                    <Ar kind="arInline" style={{ fontSize: 28, lineHeight: 40 }}>{current.kind === 'digit' ? current.ar : current.digit}</Ar>
                    <Txt kind="title" style={{ fontWeight: '700' }}>{current.n}</Txt>
                  </View>
                  <Txt kind="subheadline" color="labelSecondary">{current.tl}</Txt>
                  <Txt kind="callout">{numNote(current)}</Txt>
                </>)}
                {mode === 'sira' && (<><Txt kind="headline">Правильный ответ: {current.a[0]}</Txt>{current.info && <Txt kind="callout">{current.info}</Txt>}</>)}
                {mode === 'surah' && (<>
                  <Ar kind="arText" style={{ textAlign: 'left' }}>{current.ar}</Ar>
                  <Txt kind="subheadline" color="labelSecondary">{current.lb}</Txt>
                  <Txt kind="callout">{current.t} сура · {current.ay} {ayatWord(current.ay)}. {current.hint}</Txt>
                </>)}
                {mode === 'quran' && (<>
                  <Txt kind="headline">{current.ar} · {current.ru}</Txt>
                  <Txt kind="subheadline" color="labelSecondary">{current.tr}</Txt>
                  {current.note && <Txt kind="callout">{current.note}</Txt>}
                  <Example label="Пример из Корана">
                    <Ar kind="arText">{current.ex}</Ar>
                    <Txt kind="subheadline" color="labelSecondary">{current.exl}</Txt>
                    <Txt kind="callout">{current.ext}</Txt>
                    <Txt kind="footnote" color="labelSecondary">{quranRef(current)}</Txt>
                  </Example>
                </>)}
              </Card>
            )}

            {/* ---- статистика и управление ---- */}
            <View style={styles.stats}>
              <Stat n={String(score)} label="верно" />
              <Stat n={accuracy} label="точность" />
              <Stat n={String(streak)} label="серия" hot={streak >= 5} />
            </View>
            <View style={styles.controls}>
              {mode === 'alphabet' && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Txt kind="subheadline" color="labelSecondary">Разные формы букв</Txt><Toggle value={formsMode} onChange={setFormsMode} label="Разные формы букв" /></View>}
              <Button variant="plain" small title="Начать заново" onPress={restart} />
            </View>
          </Animated.View>
        ) : finished ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.result}>
            <Txt style={[styles.pct, { color: colors.accent }]}>{pct}%</Txt>
            <Txt kind="title">{resultMessage(pct)}</Txt>
            <Txt kind="subheadline" color="labelSecondary">Верно {score} из {deck.length}</Txt>
            <View style={{ gap: 10, width: '100%', paddingTop: 16 }}>
              {mistakes ? (<><Button title={`Разобрать ошибки (${mistakes})`} onPress={review} /><Button variant="gray" title="Ещё раунд" onPress={restart} /></>)
                : (<><Button title="Ещё раунд" onPress={restart} /><Button variant="gray" title="Посмотреть ответы" onPress={review} /></>)}
              <Button variant="plain" title="К разделам" onPress={() => router.back()} />
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Example({ label, children }: { label?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, paddingTop: 6 }}>
      {label && <Txt kind="footnote" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase' }}>{label}</Txt>}
      <View style={{ gap: 6, padding: 12, borderRadius: RADIUS.option, backgroundColor: colors.fill }}>{children}</View>
    </View>
  );
}
function Stat({ n, label, hot }: { n: string; label: string; hot?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Txt kind="title" color={hot ? 'accent' : 'label'} style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{n}</Txt>
      <Txt kind="caption" color="labelSecondary">{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  qcard: { alignItems: 'center', gap: 10, paddingVertical: SPACE[24], minHeight: 150, justifyContent: 'center' },
  bigNum: { fontSize: 72, lineHeight: 80, fontWeight: '700', fontVariant: ['tabular-nums'] },
  playBig: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 10 },
  opt: { minHeight: 56, borderRadius: RADIUS.option, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: 'transparent' },
  optHalf: { width: '48.5%' },
  optSingle: { width: '100%' },
  nextrow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', paddingTop: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  result: { alignItems: 'center', gap: 6, paddingTop: 48 },
  pct: { fontSize: 72, lineHeight: 80, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
