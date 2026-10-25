/* Профиль: имя и статистика, прогресс по разделам, намаз (город/метод/Аср), уведомления, оформление, справка. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, TextInput, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Header } from '../../components/Header';
import { Card, SectionHeader, Txt, Row, Button } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { PickerRow } from '../../components/Picker';
import { Toggle } from '../../components/Toggle';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { useTheme } from '../../theme/ThemeProvider';
import { MODES, MODE_KEYS, idsOf, statsOf } from '../../lib/quiz';
import { overall, weekActivity, getName, setName, onProgress, resetProgress } from '../../lib/progress';
import { CITIES, METHODS, PRAYER_RU } from '../../lib/prayer';
import { usePrayerSettings, useNotifySettings, prayerStore, notifyStore, NOTIFY_PRAYERS, type NotifyKey } from '../../lib/settings';
import { ensurePermission, reschedule, isNative } from '../../lib/notify';
import { SPACE, RADIUS } from '../../theme/tokens';

const daysWord = (n: number) => (n % 10 === 1 && n % 100 !== 11) ? 'день подряд' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'дня подряд' : 'дней подряд';
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, name: themeName } = useTheme();
  const prayer = usePrayerSettings();
  const notify = useNotifySettings();
  const [tick, setTick] = useState(0);
  useEffect(() => onProgress(() => setTick(t => t + 1)), []);

  const [name, setNameState] = useState(getName());
  const modesIds: Record<string, string[]> = {}; for (const m of MODE_KEYS) modesIds[m] = idsOf(m);
  const o = overall(modesIds);
  const week = weekActivity();
  const sinceD = new Date(o.since);
  const since = `${sinceD.getDate()} ${MONTHS_GEN[sinceD.getMonth()]}`;
  const initial = (name || 'И').trim().charAt(0).toUpperCase();

  const [geoBusy, setGeoBusy] = useState(false);
  const [notifyDenied, setNotifyDenied] = useState(false);

  async function onCity(v: string) {
    if (v !== 'geo') { prayerStore.set({ city: v }); applyNotify(); return; }
    setGeoBusy(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted) throw new Error('denied');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      prayerStore.set({ city: 'geo', geo: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    } catch { prayerStore.set({ city: '0' }); }
    setGeoBusy(false); applyNotify();
  }
  function applyNotify() { const n = notifyStore.get(); if (n.on) reschedule(prayerStore.get(), n).catch(() => {}); }

  async function toggleNotify(on: boolean) {
    if (on) {
      const ok = await ensurePermission();
      if (!ok) { setNotifyDenied(true); return; }
      setNotifyDenied(false);
    }
    notifyStore.set({ on });
    reschedule(prayerStore.get(), notifyStore.get()).catch(() => {});
  }
  function togglePrayer(k: NotifyKey) {
    notifyStore.set({ prayers: { ...notify.prayers, [k]: !notify.prayers[k] } });
    reschedule(prayerStore.get(), notifyStore.get()).catch(() => {});
  }
  function confirmReset() {
    Alert.alert('Сбросить прогресс?', 'Все ответы и выученные слова будут удалены. Это нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: () => resetProgress() },
    ]);
  }

  const chevron = <Icon name="chevronRight" size={14} color={colors.labelTertiary} />;
  void tick;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_SPACE + insets.bottom }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Header title="Профиль" subtitle={`С нами с ${since}`} />

      <View style={{ paddingHorizontal: SPACE[16], gap: SPACE[24], paddingTop: 8 }}>
        {/* Имя и статистика */}
        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}><Txt kind="title" style={{ color: colors.onAccent, fontWeight: '700' }}>{initial}</Txt></View>
            <TextInput
              value={name} onChangeText={setNameState} onBlur={() => { setName(name); setNameState(getName()); }} onSubmitEditing={() => { setName(name); }}
              placeholder="Как вас зовут?" placeholderTextColor={colors.labelTertiary} maxLength={30} autoCorrect={false} returnKeyType="done"
              style={[styles.input, { color: colors.label, borderBottomColor: colors.separator }]} accessibilityLabel="Ваше имя"
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Stat n={String(o.streak)} label={daysWord(o.streak)} />
            <Stat n={String(o.learned)} label="выучено" />
            <Stat n={o.accuracy === null ? '—' : o.accuracy + '%'} label="точность" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map(d => (
              <View key={d.label} style={{ alignItems: 'center', gap: 6, width: 36 }}>
                <View style={[styles.dot, { backgroundColor: d.done ? colors.accent : colors.fill, borderColor: d.today ? colors.accent : 'transparent', opacity: d.future ? 0.4 : 1 }]} />
                <Txt kind="caption" color={d.today ? 'label' : 'labelSecondary'}>{d.label}</Txt>
              </View>
            ))}
          </View>
        </Card>

        {/* Прогресс по разделам */}
        <View>
          <SectionHeader>Прогресс</SectionHeader>
          <Card style={{ gap: 12 }}>
            {MODE_KEYS.map(m => { const s = statsOf(m); return (
              <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Txt kind="subheadline" style={{ width: 128 }} numberOfLines={1}>{MODES[m].title}</Txt>
                <View style={[styles.bar, { backgroundColor: colors.fill }]}>
                  <View style={[styles.barFill, { backgroundColor: colors.accent, opacity: 0.35, width: `${s.total ? (s.learned + s.learning) / s.total * 100 : 0}%` }]} />
                  <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${s.total ? s.learned / s.total * 100 : 0}%` }]} />
                </View>
                <Txt kind="footnote" color="labelSecondary" style={{ width: 52, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{s.learned}/{s.total}</Txt>
              </View>
            ); })}
          </Card>
        </View>

        {/* Намаз */}
        <View>
          <SectionHeader>Намаз</SectionHeader>
          <Card style={{ padding: 0 }}>
            <PickerRow first title="Город" value={prayer.city} onChange={onCity} options={[{ value: 'geo', label: geoBusy ? 'Определяем…' : 'Моё местоположение' }, ...CITIES.map((c, i) => ({ value: String(i), label: c.name }))]} />
            <PickerRow title="Метод" value={prayer.method} onChange={v => { prayerStore.set({ method: v }); applyNotify(); }} options={Object.entries(METHODS).map(([k, m]) => ({ value: k, label: m.name }))} />
            <PickerRow title="Аср" value={prayer.asr} onChange={v => { prayerStore.set({ asr: v }); applyNotify(); }} options={[{ value: '1', label: 'Стандарт' }, { value: '2', label: 'Ханафи' }]} />
          </Card>
          <Txt kind="footnote" color="labelSecondary" style={styles.note}>
            {prayer.method === 'amu'
              ? 'Расписание мечети Асоціації мусульман України (Киев, Нивки): метод ISNA 15°, джума в 13:30 летом и в 12:30 зимой. Для другой мечети выберите её метод расчёта.'
              : 'Времена рассчитываются астрономически для выбранного города. Для точного соответствия расписанию вашей мечети выберите её метод расчёта.'}
          </Txt>
        </View>

        {/* Уведомления */}
        {isNative && (
          <View>
            <SectionHeader>Уведомления</SectionHeader>
            <Card style={{ padding: 0 }}>
              <View style={styles.toggleRow}><Txt>Уведомления о намазе</Txt><Toggle value={notify.on} onChange={toggleNotify} label="Уведомления о намазе" /></View>
              {notify.on && (
                <View style={[styles.chips, { borderTopColor: colors.separator }]}>
                  {NOTIFY_PRAYERS.map(k => (
                    <Button key={k} small title={PRAYER_RU[k]} variant={notify.prayers[k] ? 'filled' : 'gray'} onPress={() => togglePrayer(k)} />
                  ))}
                </View>
              )}
            </Card>
            {notifyDenied && <Txt kind="footnote" color="wrong" style={styles.note}>Уведомления запрещены. Разрешите их: Настройки iPhone → ISLAM UA → Уведомления.</Txt>}
          </View>
        )}

        {/* Оформление */}
        <View>
          <SectionHeader>Оформление</SectionHeader>
          <Card style={{ padding: 0 }}>
            <Row first title="Тема" detail={themeName} onPress={() => router.push('/appearance')} right={chevron} />
          </Card>
        </View>

        {/* Аккаунт и справка */}
        <View>
          <SectionHeader>Аккаунт</SectionHeader>
          <Card style={{ padding: 0 }}>
            <Row first title="Вход и синхронизация" detail="Скоро" />
          </Card>
          <Txt kind="footnote" color="labelSecondary" style={styles.note}>Прогресс хранится на этом устройстве. С появлением аккаунта он будет синхронизироваться между телефоном и сайтом.</Txt>
        </View>

        <View>
          <SectionHeader>Справка</SectionHeader>
          <Card style={{ gap: 8 }}>
            <Txt kind="callout">Элемент считается выученным после верных ответов в три разных дня — приложение само предложит, что повторить.</Txt>
            <Txt kind="callout" color="labelSecondary">Транскрипция: қ — ق, з̃ — ذ, с̃ — ث, ж — ج, ` — ع, ' — хамза; долгие «ии», «уу» удваиваются.</Txt>
          </Card>
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <Button variant="plain" title="Сбросить прогресс" onPress={confirmReset} />
            <Txt kind="caption" color="labelTertiary">ISLAM UA 2.0 · {Platform.OS === 'ios' ? 'iOS' : Platform.OS}</Txt>
          </View>
        </View>
      </View>
    </ScrollView>
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
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 17, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  bar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 },
  note: { paddingHorizontal: SPACE[16], paddingTop: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: SPACE[16] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: SPACE[16], borderTopWidth: StyleSheet.hairlineWidth },
});
