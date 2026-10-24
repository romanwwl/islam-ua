/* Кибла: азимут на Каабу и живой компас (магнитометр через expo-sensors). Север остаётся севером, когда телефон крутят. */
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Line, G, Rect, Text as SvgText } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import { Card, SectionHeader, Txt, Button } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import { qibla, compassDir } from '../lib/daily';
import { SPACE } from '../theme/tokens';

export function QiblaCard({ lat, lng, place, compact = false }: { lat: number; lng: number; place?: string; compact?: boolean }) {
  const { colors } = useTheme();
  const q = qibla(lat, lng);
  const km = Math.round(q.km).toLocaleString('ru-RU');
  const [heading, setHeading] = useState<number | null>(null);
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!on || Platform.OS === 'web') return;
    let sub: { remove: () => void } | null = null;
    (async () => {
      try {
        const p = await Magnetometer.requestPermissionsAsync();
        if (!p.granted) { setDenied(true); setOn(false); return; }
        Magnetometer.setUpdateInterval(120);
        sub = Magnetometer.addListener(({ x, y }) => {
          // угол между магнитным севером и верхом телефона (портрет)
          let h = Math.atan2(-x, y) * 180 / Math.PI;
          h = (h + 360) % 360;
          setHeading(prev => (prev === null ? h : prev + (((h - prev + 540) % 360) - 180) * 0.3));
        });
      } catch { setDenied(true); setOn(false); }
    })();
    return () => { sub?.remove(); };
  }, [on]);

  const dial = heading === null ? 0 : -heading;
  const delta = heading === null ? null : ((q.bearing - heading + 540) % 360) - 180;
  const aligned = delta !== null && Math.abs(delta) <= 5;
  const size = compact ? 150 : 220;

  return (
    <View>
      <SectionHeader>Кибла</SectionHeader>
      <Card style={[styles.card, { paddingTop: SPACE[20] }]}>
        <View style={{ width: size, height: size, alignSelf: 'center' }}>
          <Svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: [{ rotate: `${dial}deg` }] }}>
            <Circle cx={100} cy={100} r={96} fill="none" stroke={colors.separator} strokeWidth={1.5} />
            {Array.from({ length: 72 }).map((_, i) => (
              <Line key={i} x1={100} y1={6} x2={100} y2={i % 18 === 0 ? 18 : i % 6 === 0 ? 14 : 10} transform={`rotate(${i * 5} 100 100)`} stroke={i % 18 === 0 ? colors.label : colors.labelTertiary} strokeWidth={i % 18 === 0 ? 2 : 1} />
            ))}
            <SvgText x={100} y={38} textAnchor="middle" fontSize={16} fontWeight="700" fill={colors.label}>С</SvgText>
            <SvgText x={168} y={106} textAnchor="middle" fontSize={14} fill={colors.labelSecondary}>В</SvgText>
            <SvgText x={100} y={174} textAnchor="middle" fontSize={14} fill={colors.labelSecondary}>Ю</SvgText>
            <SvgText x={32} y={106} textAnchor="middle" fontSize={14} fill={colors.labelSecondary}>З</SvgText>
            <G transform={`rotate(${q.bearing} 100 100)`}>
              <Line x1={100} y1={100} x2={100} y2={34} stroke={aligned ? colors.correct : colors.accent} strokeWidth={3} strokeLinecap="round" />
              <G transform="translate(100 26)">
                <Rect x={-9} y={-9} width={18} height={18} rx={3} fill={colors.label} />
                <Rect x={-9} y={-3} width={18} height={4} fill={aligned ? colors.correct : colors.accent} />
              </G>
            </G>
            <Circle cx={100} cy={100} r={5} fill={colors.accent} />
          </Svg>
          {heading !== null && <View style={[styles.topMark, { borderBottomColor: colors.accent }]} />}
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Txt kind="title" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>{Math.round(q.bearing)}°</Txt>
            <Txt kind="subheadline" color="labelSecondary">{compassDir(q.bearing)}</Txt>
          </View>
          <Txt kind="subheadline" color={aligned ? 'correct' : 'labelSecondary'} style={{ textAlign: 'center' }}>
            {aligned ? 'Вы смотрите в сторону Киблы' : heading !== null && delta !== null ? `Поверните ${delta > 0 ? 'вправо' : 'влево'} на ${Math.abs(Math.round(delta))}°` : `${place ? place + ' · ' : ''}до Каабы ${km} км`}
          </Txt>
          {Platform.OS !== 'web' && !on && !denied && <Button small variant="gray" title="Включить компас" onPress={() => setOn(true)} style={{ marginTop: 6 }} />}
          {denied && <Txt kind="footnote" color="labelTertiary">Нет доступа к компасу — разрешите «Движение» в настройках iPhone</Txt>}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, paddingBottom: 18 },
  topMark: { position: 'absolute', top: -4, left: '50%', marginLeft: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '180deg' }] },
});
