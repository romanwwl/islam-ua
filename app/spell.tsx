/* «Собери слово»: по переводу и транскрипции собрать слово из плиток с буквами (плюс 3 похожие лишние). */
import React, { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenTop } from '../components/ScreenTop';
import { Card, Txt, Ar, Button, Tap } from '../components/ui';
import { Icon } from '../components/Icons';
import { useTheme } from '../theme/ThemeProvider';
import { MODES } from '../lib/quiz';
import { tilesFor, type SpellWord } from '../lib/spelling';
import { pickDeck, record } from '../lib/progress';
import { hapticCorrect, hapticWrong, hapticTap } from '../lib/haptics';
import { SPACE, RADIUS, SIZE } from '../theme/tokens';

const cfg = MODES.spell;
const newDeck = () => pickDeck('spell', cfg.data as SpellWord[], cfg.id, cfg.round);

export default function Spell() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [deck, setDeck] = useState<SpellWord[]>(newDeck);
  const [pos, setPos] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [state, setState] = useState<'build' | 'ok' | 'wrong'>('build');
  const [tries, setTries] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const w = deck[pos];
  const tiles = w ? tilesFor(w) : [];
  const word = built.map(i => tiles[i]).join('');
  const target = w ? w.sk : '';
  const score = results.filter(Boolean).length;

  function tap(i: number) {
    if (state !== 'build' || built.includes(i)) return;
    hapticTap();
    const nb = [...built, i]; setBuilt(nb);
    const nw = nb.map(x => tiles[x]).join('');
    if (nw.length === target.length) check(nw);
  }
  function undo() { if (state === 'build') setBuilt(b => b.slice(0, -1)); }
  function check(nw: string) {
    if (nw === target) {
      setState('ok'); hapticCorrect();
      const r = [...results]; r[pos] = tries === 0; setResults(r); record('spell', w.ar, tries === 0);
    } else {
      setState('wrong'); hapticWrong();
      if (tries === 0) { const r = [...results]; r[pos] = false; setResults(r); record('spell', w.ar, false); }
      setTries(t => t + 1);
    }
  }
  function retry() { setBuilt([]); setState('build'); }
  function next() {
    if (pos + 1 >= deck.length) { setFinished(true); return; }
    setPos(p => p + 1); setBuilt([]); setState('build'); setTries(0);
  }
  function restart() { setDeck(newDeck()); setPos(0); setBuilt([]); setState('build'); setTries(0); setResults([]); setFinished(false); }

  return (
    <View style={{ flex: 1 }}>
      <ScreenTop title="Собери слово" counter={`${finished ? deck.length : pos + 1} / ${deck.length}`} onClose={() => router.back()} progress={(finished ? deck.length : pos) / deck.length * 100} />
      <ScrollView contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + 32, gap: 14 }} showsVerticalScrollIndicator={false}>
        {!finished && w ? (
          <Animated.View key={pos} entering={FadeInDown.duration(220)} style={{ gap: 14 }}>
            <Card style={[styles.card, state === 'ok' && { borderColor: colors.correct, borderWidth: 2 }, state === 'wrong' && { borderColor: colors.wrong, borderWidth: 2 }]}>
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Txt kind="headline">{w.tr}</Txt>
                <Txt kind="subheadline" color="labelSecondary">{w.ru}</Txt>
              </View>
              <Ar kind="arWord" color={state === 'ok' ? 'arabic' : 'label'} style={{ textAlign: 'center', minHeight: 68 }}>{state === 'ok' ? w.ar : (word || '…')}</Ar>
              <Txt kind="subheadline" color={state === 'ok' ? 'correct' : state === 'wrong' ? 'wrong' : 'labelSecondary'}>
                {state === 'ok' ? 'Верно!' : state === 'wrong' ? 'Не так — попробуйте ещё раз' : `${word.length} из ${target.length} букв`}
              </Txt>
            </Card>

            <View style={styles.tiles}>
              {tiles.map((t, i) => {
                const used = built.includes(i);
                return (
                  <Pressable key={i} onPress={() => tap(i)} disabled={used || state !== 'build'} accessibilityRole="button" accessibilityLabel={`Буква ${t}`}
                    style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, opacity: used ? 0.3 : 1 }, pressed && !used && { transform: [{ scale: 0.95 }] }]}>
                    <Ar kind="arInline" color="label" style={{ fontSize: 34, lineHeight: 44, textAlign: 'center' }}>{t}</Ar>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.nextrow}>
              <Tap onPress={undo} disabled={!built.length || state !== 'build'} accessibilityRole="button" accessibilityLabel="Стереть букву" style={[styles.backBtn, { backgroundColor: colors.fill, opacity: !built.length || state !== 'build' ? 0.4 : 1 }]}>
                <Icon name="backspace" size={22} />
              </Tap>
              <View style={{ flex: 1 }}>
                {state === 'ok' ? <Button title={pos + 1 >= deck.length ? 'Результат →' : 'Дальше →'} onPress={next} />
                  : state === 'wrong' ? <Button variant="gray" title="Ещё раз" onPress={retry} />
                  : <View style={{ height: 50 }} />}
              </View>
            </View>

            <View style={styles.stats}>
              <Stat n={String(score)} label="верно" />
              <Stat n={results.length ? Math.round(score / results.length * 100) + '%' : '—'} label="точность" />
              <Stat n={String(deck.length - pos - (state === 'ok' ? 1 : 0))} label="осталось" />
            </View>
            <View style={{ alignItems: 'flex-end' }}><Button variant="plain" small title="Начать заново" onPress={restart} /></View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.result}>
            <Txt style={[styles.pct, { color: colors.accent }]}>{Math.round(score / deck.length * 100)}%</Txt>
            <Txt kind="title">{score === deck.length ? 'Все слова собраны!' : score >= deck.length * 0.7 ? 'Хорошо!' : 'Есть куда расти'}</Txt>
            <Txt kind="subheadline" color="labelSecondary">Собрано с первой попытки {score} из {deck.length}</Txt>
            <View style={{ gap: 10, width: '100%', paddingTop: 16 }}>
              <Button title="Ещё раунд" onPress={restart} />
              <Button variant="gray" title="К разделам" onPress={() => router.back()} />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Txt kind="title" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>{n}</Txt>
      <Txt kind="caption" color="labelSecondary">{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 10, paddingVertical: SPACE[24] },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  tile: { width: SIZE['letter-tile'], height: SIZE['letter-tile'], borderRadius: RADIUS.tile + 4, alignItems: 'center', justifyContent: 'center' },
  nextrow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', paddingTop: 8 },
  result: { alignItems: 'center', gap: 6, paddingTop: 48 },
  pct: { fontSize: 72, lineHeight: 80, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
