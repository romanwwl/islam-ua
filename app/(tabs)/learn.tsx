import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Txt } from '../../components/ui';

export default function Learn() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Header title="Учёба" subtitle="Скоро — по новому дизайну" />
      <View style={{ padding: 16 }}><Txt color="labelSecondary">Экран переносится следующим.</Txt></View>
    </View>
  );
}
