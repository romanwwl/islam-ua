/* Корень приложения: загрузка шрифтов и настроек, тема, безопасные зоны, стек экранов. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, ThemeProvider as NavThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { hydrate } from '../lib/storage';
import { initSettings, prayerStore, notifyStore } from '../lib/settings';
import { initProgress } from '../lib/progress';
import { reschedule } from '../lib/notify';
import { nextPrayer } from '../lib/prayer';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { Background } from '../components/Background';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Shell() {
  const { isDark, colors } = useTheme();
  // навигация не должна красить фон — его рисует Background под всеми экранами
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: colors.card, text: colors.label, primary: colors.accent, border: colors.separator } };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Background />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="schedule" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="appearance" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </NavThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'ScheherazadeNew-Regular': require('../assets/fonts/ScheherazadeNew-Regular.ttf'),
    'ScheherazadeNew-Medium': require('../assets/fonts/ScheherazadeNew-Medium.ttf'),
    'Amiri-Regular': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
  });
  const [ready, setReady] = useState(false);
  const [night, setNight] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrate();
      initSettings();
      initProgress();
      setReady(true);
      const p = prayerStore.get();
      setNight(nextPrayer(new Date(), p).key === 'fajr');
      if (notifyStore.get().on) reschedule(p, notifyStore.get()).catch(() => {});
    })();
  }, []);

  useEffect(() => { if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {}); }, [ready, fontsLoaded]);

  if (!ready || !fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider night={night}>
          <Shell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
