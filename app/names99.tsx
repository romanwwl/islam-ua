/* Испытание «99 имён»: одно поле ввода, 99 закреплённых ячеек. Имя принимается по-арабски, по-русски или транскрипцией.
   Нажатие на закрытую ячейку — подсказка. */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, TextInput, Pressable, StyleSheet, Text, KeyboardAvoidingView, Platform, type TextInputInstance } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenTop } from '../components/ScreenTop';
import { Card, Txt, Button, Tap } from '../components/ui';
import { Icon } from '../components/Icons';
import { useTheme } from '../theme/ThemeProvider';
import { NAMES } from '../lib/daily';
import { matchName, loadState, saveState } from '../lib/names99';
import { hapticCorrect, hapticWrong } from '../lib/haptics';
import { SPACE, RADIUS } from '../theme/tokens';

export default function Names99() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fontArabic } = useTheme();
  const st = useRef(loadState()).current;
  const [revealed, setRevealed] = useState<Set<number>>(new Set(st.revealed));
  const [hinted, setHinted] = useState<Set<number>>(new Set(st.hinted));
  const [gaveUp, setGaveUp] = useState(st.gaveUp);
  const [best, setBest] = useState(st.best || 0);
  const [input, setInput] = useState('');
  const [lastHit, setLastHit] = useState(-1);
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

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
  }
  function hint(i: number) {
    if (revealed.has(i) || done) return;
    setRevealed(r => new Set([...r, i])); setHinted(h => new Set([...h, i]));
  }
  function restart() { setRevealed(new Set()); setHinted(new Set()); setGaveUp(false); setInput(''); setLastHit(-1); inputRef.current?.focus(); }
  const cellState = (i: number) => revealed.has(i) ? (hinted.has(i) ? 'hint' : 'ok') : (gaveUp ? 'miss' : '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenTop title="99 имён" counter={`${found} / ${NAMES.length}`} onClose={() => router.back()} progress={revealed.size / NAMES.length * 100} />
      <View style={{ paddingHorizontal: SPACE[16], paddingTop: 12, gap: 8 }}>
        {!done ? (
          <>
            <View style={[styles.form, { backgroundColor: colors.card, borderColor: wrong ? colors.wrong : 'transparent' }]}>
              <TextInput ref={inputRef} value={input} onChangeText={t => { setInput(t); tryMatch(t); }} onSubmitEditing={() => tryMatch(input, true)} blurOnSubmit={false}
                placeholder="Напишите имя…" placeholderTextColor={colors.labelTertiary} autoCorrect={false} autoCapitalize="none" spellCheck={false} returnKeyType="done"
                style={[styles.input, { color: colors.label }]} accessibilityLabel="Имя Аллаха" />
              <Tap onPress={() => tryMatch(input, true)} accessibilityRole="button" accessibilityLabel="Проверить" style={[styles.go, { backgroundColor: colors.accent }]}>
                <Icon name="arrowRight" size={20} color={colors.onAccent} />
              </Tap>
            </View>
            <Txt kind="footnote" color="labelSecondary">По-арабски, по-русски или транскрипцией — «Ар-Рахман», «Милостивый», الرحمن. Нажмите на ячейку, чтобы подсмотреть.</Txt>
          </>
        ) : (
          <Card style={{ alignItems: 'center', gap: 4 }}>
            <Txt kind="headline">{gaveUp && revealed.size < NAMES.length ? `Названо ${found} из 99` : 'Все 99 имён — машаАллах!'}</Txt>
            {hinted.size > 0 && <Txt kind="subheadline" color="labelSecondary">С подсказкой: {hinted.size}</Txt>}
            {best > 0 && <Txt kind="subheadline" color="labelSecondary">Лучший результат: {best}</Txt>}
          </Card>
        )}
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + 24, gap: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {NAMES.map((n, i) => {
            const s = cellState(i);
            const bg = s === 'ok' ? colors.accent : s === 'hint' ? colors.cardStrong : s === 'miss' ? colors.fill : colors.card;
            const fg = s === 'ok' ? colors.onAccent : colors.label;
            return (
              <Pressable key={i} onPress={() => hint(i)} disabled={!!s} accessibilityRole="button" accessibilityLabel={s ? `${i + 1}. ${n.ru}` : `Имя ${i + 1}, нажмите для подсказки`}
                style={[styles.cell, { backgroundColor: bg, borderColor: lastHit === i ? colors.accent : 'transparent' }]}>
                <Text style={[styles.num, { color: s === 'ok' ? colors.onAccent : colors.labelTertiary }]}>{i + 1}</Text>
                {s ? (<>
                  <Text style={{ fontFamily: fontArabic, fontSize: 20, lineHeight: 26, color: s === 'ok' ? colors.onAccent : colors.arabic, writingDirection: 'rtl' }} numberOfLines={1}>{n.ar}</Text>
                  <Text style={{ fontSize: 10, lineHeight: 12, color: fg, textAlign: 'center' }} numberOfLines={1}>{n.ru}</Text>
                </>) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
          {!done && <Button variant="plain" small title="Показать все" onPress={() => setGaveUp(true)} />}
          <Button variant="plain" small title="Начать заново" onPress={restart} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 6, height: 54, borderRadius: RADIUS.capsule, borderWidth: 2 },
  input: { flex: 1, fontSize: 17, height: 50 },
  go: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '18.4%', aspectRatio: 0.92, borderRadius: RADIUS.tile + 4, alignItems: 'center', justifyContent: 'center', gap: 1, borderWidth: 2, padding: 2 },
  num: { position: 'absolute', top: 3, left: 5, fontSize: 9, fontWeight: '600' },
});
