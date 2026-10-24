import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt, Button } from '../components/ui';

export default function Schedule() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 16, padding: 16, gap: 16 }}>
      <Txt kind="title">Уроки в мечети</Txt>
      <Txt color="labelSecondary">Экран расписания переносится следующим.</Txt>
      <Button title="Закрыть" variant="gray" onPress={() => router.back()} />
    </View>
  );
}
