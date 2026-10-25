/* Расписание субботних уроков в мечети АМУ: группы → лента уроков. По субботам подсвечивается текущий урок. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SCHEDULE from '../data/schedule.json';
import { ScreenTop } from '../components/ScreenTop';
import { Card, Txt, Tap, Button } from '../components/ui';
import { Icon } from '../components/Icons';
import { useTheme } from '../theme/ThemeProvider';
import { load, save } from '../lib/storage';
import { hapticTap } from '../lib/haptics';
import { SPACE, RADIUS } from '../theme/tokens';

type Lesson = { from: string; to?: string; title: string; who?: string; book?: string; note?: string; type?: string };
type Group = { id: string; title: string; sub?: string; lessons?: Lesson[]; blocks?: { title?: string; lessons: Lesson[] }[] };
const S = SCHEDULE as { title: string; day: number; address: string; metro: string; mapQuery: string; groups: Group[] };

const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export default function Schedule() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [group, setGroup] = useState<string>(() => load('islamua_sched', { g: 'kids' }).g);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const g = S.groups.find(x => x.id === group) || S.groups[0];
  const blocks = g.blocks || [{ lessons: g.lessons || [] }];
  const saturday = now.getDay() === S.day;
  const cur = now.getHours() * 60 + now.getMinutes();
  const live = (l: Lesson) => saturday && !!l.to && cur >= mins(l.from) && cur < mins(l.to);
  const past = (l: Lesson) => saturday && !!l.to && cur >= mins(l.to);
  const pick = (id: string) => { hapticTap(); setGroup(id); save('islamua_sched', { g: id }); };
  const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(S.mapQuery)}`;

  return (
    <View style={{ flex: 1 }}>
      <ScreenTop title="Уроки в мечети" counter="по субботам" onClose={() => router.back()} />
      <View style={styles.seg}>
        {S.groups.map(x => <Button key={x.id} small title={x.title} variant={x.id === group ? 'filled' : 'gray'} onPress={() => pick(x.id)} />)}
      </View>
      <ScrollView contentContainerStyle={{ padding: SPACE[16], paddingBottom: insets.bottom + 32, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Animated.View key={group} entering={FadeInDown.duration(220)} style={{ gap: 14 }}>
          {g.sub && <Txt kind="subheadline" color="labelSecondary" style={{ paddingHorizontal: 4 }}>{g.title} · {g.sub}</Txt>}
          {blocks.map((b, bi) => (
            <View key={bi} style={{ gap: 8 }}>
              {b.title && <Txt kind="footnote" color="labelSecondary" style={{ fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: SPACE[16] }}>{b.title}</Txt>}
              <Card style={{ padding: 0 }}>
                {b.lessons.map((l, i) => {
                  const isLive = live(l), isPast = past(l), isBreak = l.type === 'break';
                  return (
                    <View key={i} style={[styles.lesson, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }, isLive && { backgroundColor: colors.cardStrong }, isPast && { opacity: 0.5 }]}>
                      <View style={{ width: 58 }}>
                        <Txt kind="headline" style={{ fontVariant: ['tabular-nums'] }}>{l.from}</Txt>
                        {l.to && <Txt kind="caption" color="labelSecondary" style={{ fontVariant: ['tabular-nums'] }}>{l.to}</Txt>}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt kind={isBreak ? 'subheadline' : 'body'} color={isBreak ? 'labelSecondary' : 'label'} style={!isBreak && { fontWeight: '600' }}>{l.title}{l.note ? <Txt kind="subheadline" color="labelSecondary"> · {l.note}</Txt> : null}</Txt>
                        {l.book && <Txt kind="footnote" color="labelSecondary">по книге «{l.book}»</Txt>}
                        {l.who && <Txt kind="footnote" color="labelSecondary">{l.who}</Txt>}
                      </View>
                      {isLive && <View style={[styles.liveDot, { backgroundColor: colors.correct }]} accessibilityLabel="Идёт сейчас" />}
                    </View>
                  );
                })}
              </Card>
            </View>
          ))}
        </Animated.View>

        <Tap onPress={() => Linking.openURL(mapUrl).catch(() => {})} accessibilityRole="link" accessibilityLabel="Открыть адрес мечети в картах">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.pin, { backgroundColor: colors.fill }]}><Icon name="map" size={20} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Txt kind="headline">{S.address}</Txt>
              <Txt kind="footnote" color="labelSecondary">{S.metro} · открыть в картах</Txt>
            </View>
            <Icon name="chevronRight" size={14} color={colors.labelTertiary} />
          </Card>
        </Tap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: SPACE[16], paddingTop: 8 },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACE[16], paddingVertical: 12 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  pin: { width: 40, height: 40, borderRadius: RADIUS.tile + 4, alignItems: 'center', justifyContent: 'center' },
});
