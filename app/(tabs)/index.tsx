/* Экран «Сегодня» (макет A «Фокус»): шапка с датой → отсчёт до намаза → ряд намазов → Джума и уроки → контент дня → Кибла. */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Countdown } from '../../components/Countdown';
import { PrayerRow } from '../../components/PrayerRow';
import { AyahCard, HadithCard, DuaCard, NameCard } from '../../components/DailyCards';
import { QiblaCard } from '../../components/Qibla';
import { Card, Row } from '../../components/ui';
import { Icon } from '../../components/Icons';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { useTheme } from '../../theme/ThemeProvider';
import { usePrayerSettings } from '../../lib/settings';
import { METHODS, timesFor, nextPrayer, coordsFor, jumuahFor, isFriday, fmtDateRu, hijri, type PrayerKey } from '../../lib/prayer';
import { ayahOfDay, hadithOfDay, duaOfDay, nameOfDay } from '../../lib/daily';
import { SPACE } from '../../theme/tokens';

const SHORT_DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const SHORT_MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export default function Today() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const prayer = usePrayerSettings();
  const [now, setNow] = useState(() => new Date());

  // тик раз в секунду; при возврате в приложение — сразу
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setNow(new Date()); });
    return () => { clearInterval(t); sub.remove(); };
  }, []);

  const dayStamp = now.toDateString();
  const times = useMemo(() => timesFor(now, prayer), [dayStamp, prayer]);     // eslint-disable-line react-hooks/exhaustive-deps
  const next = useMemo(() => nextPrayer(now, prayer), [now, prayer]);
  const coords = coordsFor(prayer);
  const method = METHODS[prayer.method] || METHODS.amu;
  const methodShort = prayer.method === 'amu' ? 'Мечеть АМУ' : method.name.replace(/\s*\(.*\)$/, '');
  const jumuah = jumuahFor(prayer, now);
  const friday = isFriday(now);

  const ayah = useMemo(() => ayahOfDay(now), [dayStamp]);     // eslint-disable-line react-hooks/exhaustive-deps
  const hadith = useMemo(() => hadithOfDay(now), [dayStamp]); // eslint-disable-line react-hooks/exhaustive-deps
  const dua = useMemo(() => duaOfDay(now), [dayStamp]);       // eslint-disable-line react-hooks/exhaustive-deps
  const name = useMemo(() => nameOfDay(now), [dayStamp]);     // eslint-disable-line react-hooks/exhaustive-deps

  // ближайшая суббота — уроки в мечети
  const sat = new Date(now); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
  const satLabel = sat.toDateString() === now.toDateString() ? 'сегодня с 10:00' : `${SHORT_DAYS[sat.getDay()]}, ${sat.getDate()} ${SHORT_MONTHS[sat.getMonth()]}`;

  // рамка в ряду стоит на зухре, когда следующий — джума
  const highlighted: PrayerKey = next.key === 'jumuah' ? 'dhuhr' : next.key;
  const chevron = <Icon name="chevronRight" size={14} color={colors.labelTertiary} />;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_SPACE + insets.bottom }} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
      <Header title={fmtDateRu(now)} subtitle={hijri(now)} action="sliders" actionLabel="Настройки намаза" onAction={() => router.push('/(tabs)/profile')} />

      <Countdown next={next} note={`${methodShort} · ${coords.name}`} />
      <PrayerRow times={times} now={now} nextKey={highlighted} onPress={() => router.push('/(tabs)/profile')} />

      <View style={{ paddingHorizontal: SPACE[16], gap: SPACE[24] }}>
        <Card style={{ padding: 0 }}>
          {jumuah ? <Row first title={friday ? 'Джума · сегодня' : 'Джума'} detail={`пятница, ${jumuah}`} right={chevron} onPress={() => router.push('/(tabs)/profile')} /> : null}
          <Row first={!jumuah} title="Уроки в мечети" detail={satLabel} right={chevron} onPress={() => router.push('/schedule')} />
        </Card>

        <AyahCard ayah={ayah} />
        <HadithCard hadith={hadith} />
        <DuaCard dua={dua} />
        <NameCard name={name} />
        <QiblaCard lat={coords.lat} lng={coords.lng} place={coords.name} />
      </View>
    </ScrollView>
  );
}
