import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '../components/ui';

export default function Appearance() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 16, padding: 16 }}>
      <Txt kind="title">Оформление</Txt>
    </View>
  );
}
