import { useFonts } from 'expo-font';
import { ExpoRoot, type RequireContext } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { type ReactElement, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design/design-system';
import { designFontSources } from '@/design/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash screen already hidden */
});

export default function App(): ReactElement | null {
  const [fontsLoaded, fontError] = useFonts(designFontSources);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore hide errors */
      });
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const ctx = (
    require as unknown as {
      context: (directory: string) => RequireContext;
    }
  ).context('./src/app');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ExpoRoot context={ctx} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
