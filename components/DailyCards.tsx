/* Карточки «Сегодня»: аят дня (с прослушиванием и шарингом), хадис, дуа, имя Аллаха. */
import React, { useEffect, useState } from 'react';
import { View, Share, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, SectionHeader, Txt, Ar, Button, Tap } from './ui';
import { Icon } from './Icons';
import { useTheme } from '../theme/ThemeProvider';
import { refLabel, type Ayah, type Hadith, type Dua, type Name } from '../lib/daily';
import { playAyah, onAudio, isPlaying, type AudioState } from '../lib/audio';
import { SPACE } from '../theme/tokens';

async function share(text: string) { try { await Share.share({ message: text }); } catch { /* отменено */ } }

function ShareButton({ text, label }: { text: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Tap onPress={() => share(text)} accessibilityRole="button" accessibilityLabel={label} style={styles.iconBtn}>
      <Icon name="share" size={18} color={colors.accent} />
    </Tap>
  );
}

export function AyahCard({ ayah }: { ayah: Ayah }) {
  const { colors } = useTheme();
  const [st, setSt] = useState<AudioState>('ended');
  useEffect(() => onAudio((s, ref) => setSt(ref === ayah.ref || s === 'ended' || s === 'error' ? s : 'ended')), [ayah.ref]);
  const playing = st === 'playing' && isPlaying(ayah.ref);
  const loading = st === 'loading';
  return (
    <View>
      <SectionHeader>Аят дня</SectionHeader>
      <Card style={styles.card}>
        <Ar kind="arAyah">{ayah.ar}</Ar>
        <Txt kind="subheadline" color="labelSecondary">{ayah.tl}</Txt>
        <Txt>{ayah.ru}</Txt>
        <View style={styles.foot}>
          <Txt kind="footnote" color="labelSecondary" style={{ flexShrink: 1 }}>{refLabel(ayah.ref)}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Button small variant="gray" title={playing ? 'Стоп' : 'Слушать'} onPress={() => playAyah(ayah.ref)}
              icon={loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Icon name={playing ? 'stop' : 'play'} size={14} color={colors.accent} />} />
            <ShareButton label="Поделиться аятом" text={`${ayah.ar}\n\n${ayah.ru}\n— Коран, ${refLabel(ayah.ref)}`} />
          </View>
        </View>
      </Card>
    </View>
  );
}

export function HadithCard({ hadith }: { hadith: Hadith }) {
  return (
    <View>
      <SectionHeader>Хадис дня</SectionHeader>
      <Card style={styles.card}>
        <Txt kind="subheadline" color="labelSecondary">Посланник Аллаха ﷺ сказал:</Txt>
        <Ar kind="arText">{hadith.ar}</Ar>
        <Txt>«{hadith.ru}»</Txt>
        <View style={styles.foot}>
          <Txt kind="footnote" color="labelSecondary">{hadith.src}</Txt>
          <ShareButton label="Поделиться хадисом" text={`Посланник Аллаха ﷺ сказал:\n${hadith.ar}\n\n«${hadith.ru}»\n— ${hadith.src}`} />
        </View>
      </Card>
    </View>
  );
}

export function DuaCard({ dua }: { dua: Dua }) {
  return (
    <View>
      <SectionHeader>Дуа дня · {dua.t}</SectionHeader>
      <Card style={styles.card}>
        <Ar kind="arText">{dua.ar}</Ar>
        <Txt kind="subheadline" color="labelSecondary">{dua.tl}</Txt>
        <Txt>{dua.ru}</Txt>
        <View style={styles.foot}>
          <Txt kind="footnote" color="labelSecondary">{dua.src}</Txt>
          <ShareButton label="Поделиться дуа" text={`${dua.t}\n${dua.ar}\n\n${dua.tl}\n\n${dua.ru}\n— ${dua.src}`} />
        </View>
      </Card>
    </View>
  );
}

export function NameCard({ name }: { name: Name }) {
  return (
    <View>
      <SectionHeader>Имя Аллаха дня</SectionHeader>
      <Card style={[styles.card, { alignItems: 'center' }]}>
        <Ar kind="arWord" style={{ textAlign: 'center' }}>{name.ar}</Ar>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt kind="headline">{name.ru} <Txt kind="headline" color="labelSecondary" style={{ fontWeight: '400' }}>· {name.lat}</Txt></Txt>
          <Txt kind="subheadline" color="labelSecondary">{name.tr}</Txt>
        </View>
        {name.info ? <Txt kind="callout" style={{ textAlign: 'center' }}>{name.info}</Txt> : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, paddingTop: SPACE[20], paddingBottom: 14 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 },
  iconBtn: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center' },
});
