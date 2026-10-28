/* Испытание «99 имён»: 99 ячеек в 4 столбца, поле ввода закреплено внизу над клавиатурой.
   Имя принимается по-арабски, по-русски или транскрипцией. Нажатие на открытую ячейку — карточка имени,
   на закрытую — предложение подсмотреть (засчитывается как подсказка). */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, TextInput, Pressable, StyleSheet, Text, Modal, KeyboardAvoidingView, Platform, type TextInputInstance, type ScrollViewInstance } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, Ar, Button, Tap } from '../components/ui';
import { Glass } from '../components/Glass';
import { Icon } from '../components/Icons';
import { useTheme } from '../theme/ThemeProvider';
import { NAMES, type Name } from '../lib/daily';
import { matchName, loadState, saveState } from '../lib/names99';
import { hapticCorrect, hapticWrong, hapticTap } from '../lib/haptics';
import { SPACE, RADIUS } from '../theme/tokens';

type CellState = '' | 'ok' | 'hint' | 'miss';
const COLS = 4;
const GAP = 8;

export default function Names99() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const st = useRef(loadState()).current;
  const [revealed, setRevealed] = useState<Set<number>>(new Set(st.revealed));
  const [hinted, setHinted] = useState<Set<number>>(new Set(st.hinted));
  const [gaveUp, setGaveUp] = useState(st.gaveUp);
  const [best, setBest] = useState(st.best || 0);
  const [input, setInput] = useState('');
  const [lastHit, setLastHit] = useState(-1);
  const [wrong, setWrong] = useState(false);
  const [open, setOpen] = useState<number>(-1);            // индекс имени в карточке
  const inputRef = useRef<TextInputInstance>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const cellY = useRef<Record<number, number>>({}).current;

  const found = revealed.size - hinted.size;
  const done = revealed.size >= NAMES.length || gaveUp;

  useEffect(() => {
    const b = Math.max(best, found); if (b !== best) setBest(b);
    saveState({ revealed: [...revealed], hinted: [...hinted], gaveUp, best: b });
  }, [revealed, hinted, gaveUp]); // eslint-disable-line react-hooks/exhaustive-deps

  function tryMatch(text: string, submit = false) {
    const i = matchName(text, revealed);
    if (i < 0) {
      if (submit && text.trim().length >= 2) { setWrong(true); hapticWrong(); setTimeout(() => setWrong(false), 400); }
      return;
    }
    setRevealed(r => new Set([...r, i])); setLastHit(i); setInput(''); hapticCorrect();
    const y = cellY[i];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true });
  }
  function peek(i: number) {
    if (revealed.has(i) || done) return;
    setRevealed(r => new Set([...r, i])); setHinted(h => new Set([...h, i])); hapticTap();
  }
  function restart() { setRevealed(new Set()); setHinted(new Set()); setGaveUp(false); setInput(''); setLastHit(-1); scrollRef.current?.scrollTo({ y: 0, animated: true }); inputRef.current?.focus(); }
  const cellState = (i: number): CellState => revealed.has(i) ? (hinted.has(i) ? 'hint' : 'ok') : (gaveUp ? 'miss' : '');

  const composerH = 54 + 12 + (insets.bottom || 12);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Шапка: заголовок, крупный счёт, закрыть, полоса прогресса */}
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Txt kind="screenTitle">99 имён Аллаха</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Txt kind="title" color="accent" style={{ fontVariant: ['tabular-nums'] }}>{found}</Txt>
                <Txt kind="subheadline" color="labelSecondary">/ 99</Txt>
              </View>
              {hinted.size > 0 && <Txt kind="footnote" color="labelTertiary">подсказок {hinted.size}</Txt>}
              {best > 0 && <Txt kind="footnote" color="labelTertiary">рекорд {best}</Txt>}
            </View>
          </View>
          <Tap onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Закрыть" style={[styles.close, { backgroundColor: colors.fill }]}>
            <Icon name="xmark" size={18} />
          </Tap>
        </View>
        <View style={[styles.bar, { backgroundColor: colors.fill }]}>
          <View style={[styles.fill, { backgroundColor: colors.accent, width: `${(found / NAMES.length) * 100}%` }]} />
          {hinted.size > 0 && <View style={[styles.fill, { backgroundColor: colors.accent, opacity: 0.35, width: `${(hinted.size / NAMES.length) * 100}%` }]} />}
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: SPACE[16], paddingTop: 10, paddingBottom: composerH + 16, gap: 12 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        {done ? (
          <View style={[styles.result, { backgroundColor: colors.card }]}>
            <Txt kind="headline">{gaveUp && revealed.size < NAMES.length ? `Названо ${found} из 99` : 'Все 99 имён — машаАллах!'}</Txt>
            <Txt kind="subheadline" color="labelSecondary">
              {hinted.size > 0 ? `С подсказкой: ${hinted.size}. ` : ''}{best > 0 ? `Лучший результат: ${best}.` : ''} Нажмите на имя, чтобы прочитать о нём.
            </Txt>
          </View>
        ) : (
          <Txt kind="subheadline" color="labelSecondary" style={{ paddingHorizontal: 4 }}>Напишите имя Аллаха на арабском, русском или транскрипцией. Нажмите на имя, чтобы узнать о нём больше.</Txt>
        )}
        <View style={styles.grid}>
          {NAMES.map((n, i) => (
            <Cell key={i} n={n} i={i} state={cellState(i)} hit={lastHit === i} onLayoutY={y => { cellY[i] = y; }}
              onPress={() => { hapticTap(); setOpen(i); }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          {!done && <Button variant="plain" small title="Открыть все" onPress={() => setGaveUp(true)} />}
          <Button variant="plain" small title="Начать заново" onPress={restart} />
        </View>
      </ScrollView>

      {/* Поле ввода — закреплено внизу, поднимается вместе с клавиатурой */}
      {!done && (
        <View style={[styles.composerWrap, { paddingBottom: insets.bottom || 12 }]}>
          <Glass style={[styles.composer, { borderColor: wrong ? colors.wrong : colors.separator, backgroundColor: colors.glass }]} contentStyle={styles.composerIn}>
            <TextInput ref={inputRef} value={input} onChangeText={t => { setInput(t); tryMatch(t); }} onSubmitEditing={() => tryMatch(input, true)} blurOnSubmit={false}
              placeholder="Имя Аллаха…" placeholderTextColor={colors.labelTertiary} autoCorrect={false} autoCapitalize="none" spellCheck={false} returnKeyType="done"
              style={[styles.input, { color: colors.label }]} accessibilityLabel="Имя Аллаха" />
            <Tap onPress={() => tryMatch(input, true)} accessibilityRole="button" accessibilityLabel="Проверить" style={[styles.go, { backgroundColor: colors.accent }]}>
              <Icon name="arrowRight" size={20} color={colors.onAccent} />
            </Tap>
          </Glass>
        </View>
      )}

      <NameSheet index={open} state={open >= 0 ? cellState(open) : ''} done={done} onClose={() => setOpen(-1)} onPeek={() => { if (open >= 0) peek(open); }} />
    </KeyboardAvoidingView>
  );
}

/* Ячейка. ok — золотая с именем; hint — с золотой рамкой; miss — приглушённая; пустая — номер по центру. */
function Cell({ n, i, state, hit, onPress, onLayoutY }: { n: Name; i: number; state: CellState; hit: boolean; onPress: () => void; onLayoutY: (y: number) => void }) {
  const { colors, fontArabic, isDark } = useTheme();
  const sv = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sv.value }] }));
  useEffect(() => { if (hit) sv.value = withSequence(withSpring(1.12, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 14, stiffness: 300 })); }, [hit]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = state === 'ok';
  const empty = state === '';
  const fgAr = ok ? colors.onAccent : state === 'miss' ? colors.labelSecondary : colors.arabic;
  const fgRu = ok ? colors.onAccent : colors.labelSecondary;
  return (
    <Animated.View style={[styles.cellWrap, a]} onLayout={e => onLayoutY(e.nativeEvent.layout.y)}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={empty ? `Имя ${i + 1}, ещё не названо` : `${i + 1}. ${n.ru}`}
        style={({ pressed }) => [styles.cell, {
          backgroundColor: ok ? colors.accent : state === 'hint' ? colors.card : state === 'miss' ? colors.fill : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderColor: state === 'hint' ? colors.accent : empty ? colors.separator : 'transparent',
          borderStyle: empty ? 'dashed' : 'solid',
          opacity: pressed ? 0.75 : 1,
        }]}>
        {ok && <LinearGradient colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        {empty ? (
          <Text style={[styles.bigNum, { color: colors.labelTertiary }]}>{i + 1}</Text>
        ) : (
          <>
            <Text style={[styles.num, { color: ok ? colors.onAccent : colors.labelTertiary, opacity: ok ? 0.75 : 1 }]}>{i + 1}</Text>
            <Text style={{ fontFamily: fontArabic, fontSize: 25, lineHeight: 32, color: fgAr, writingDirection: 'rtl' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{n.ar}</Text>
            <Text style={{ fontSize: 11, lineHeight: 13, fontWeight: '600', color: fgRu, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{n.ru}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* Карточка имени — шторка снизу. Для закрытого имени — предложение подсмотреть. */
function NameSheet({ index, state, done, onClose, onPeek }: { index: number; state: CellState; done: boolean; onClose: () => void; onPeek: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const n = index >= 0 ? NAMES[index] : null;
  const hidden = state === '' && !done;
  return (
    <Modal visible={index >= 0} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Закрыть" />
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.grabber, { backgroundColor: colors.labelTertiary }]} />
        {n && (hidden ? (
          <View style={{ paddingHorizontal: SPACE[20], alignItems: 'center', gap: 6 }}>
            <Txt kind="footnote" color="labelTertiary" style={{ fontWeight: '600', textTransform: 'uppercase' }}>Имя № {index + 1}</Txt>
            <Txt kind="title" style={{ textAlign: 'center' }}>Ещё не названо</Txt>
            <Txt kind="subheadline" color="labelSecondary" style={{ textAlign: 'center', marginBottom: 12 }}>Можно подсмотреть — имя откроется, но засчитается с подсказкой.</Txt>
            <Button title="Подсмотреть" onPress={onPeek} style={{ alignSelf: 'stretch' }} />
            <Button variant="plain" title="Закрыть" onPress={onClose} />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: SPACE[20], gap: 6 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Txt kind="footnote" color="labelTertiary" style={{ fontWeight: '600', textTransform: 'uppercase' }}>Имя № {index + 1}</Txt>
              {state === 'hint' && <Txt kind="footnote" color="accent" style={{ fontWeight: '600', textTransform: 'uppercase' }}>· с подсказкой</Txt>}
            </View>
            <Ar kind="arWord" style={{ textAlign: "center", marginTop: 4 }}>{n.ar}</Ar>
            <Txt kind="title" style={{ textAlign: 'center' }}>{n.ru}</Txt>
            <Txt kind="subheadline" color="labelSecondary" style={{ textAlign: 'center' }}>{n.lat} · {n.tr}</Txt>
            {n.variants ? <Txt kind="footnote" color="labelTertiary" style={{ textAlign: 'center' }}>{n.variants}</Txt> : null}
            {n.info ? <Txt style={{ marginTop: 12 }}>{n.info}</Txt> : null}
            {n.ex ? (
              <View style={[styles.quote, { backgroundColor: colors.fill }]}>
                <Ar kind="arText">{n.ex}</Ar>
                {n.exl ? <Txt kind="footnote" color="labelSecondary" style={{ fontStyle: 'italic' }}>{n.exl}</Txt> : null}
                {n.ext ? <Txt kind="subheadline">{n.ext}</Txt> : null}
                {n.ref ? <Txt kind="footnote" color="labelTertiary">{n.ref}</Txt> : null}
                {n.exnote ? <Txt kind="footnote" color="labelTertiary">{n.exnote}</Txt> : null}
              </View>
            ) : null}
            <Button variant="gray" title="Закрыть" onPress={onClose} style={{ marginTop: 14 }} />
          </ScrollView>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: SPACE[16], paddingTop: 6, paddingBottom: 10, gap: 12 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bar: { height: 4, marginHorizontal: SPACE[16], borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  fill: { height: 4, borderRadius: 2 },
  result: { borderRadius: RADIUS.card, padding: SPACE[16], gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cellWrap: { width: `${(100 - (COLS - 1) * 2.6) / COLS}%` },
  cell: { aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1.5, padding: 4, overflow: 'hidden' },
  num: { position: 'absolute', top: 5, left: 8, fontSize: 10, fontWeight: '700' },
  bigNum: { fontSize: 20, fontWeight: '600', opacity: 0.8 },
  composerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SPACE[16], paddingTop: 8 },
  composer: { borderRadius: RADIUS.capsule, borderWidth: 1.5, overflow: 'hidden' },
  composerIn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 18, paddingRight: 6, height: 54 },
  input: { flex: 1, fontSize: 17, height: 50 },
  go: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingTop: 8 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, opacity: 0.5, marginBottom: 12 },
  quote: { borderRadius: RADIUS.tile + 8, padding: 14, gap: 4, marginTop: 10 },
});
