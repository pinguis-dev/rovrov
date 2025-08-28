import { useEffect } from 'react';

import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthListener } from './src/hooks/useAuthListener';
import { AuthScreen } from './src/screens/AuthScreen';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/styles/colors';
import { setupDeepLinkListener } from './src/utils/deepLinkHandler';

export default function App() {
  useAuthListener();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    const cleanup = setupDeepLinkListener();
    return cleanup;
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neutral[700]} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {!isAuthenticated ? (
        <AuthScreen
          onAuthSuccess={() => {
            // Authentication successful
          }}
        />
      ) : (
        <View style={styles.container}>
          <View style={styles.tempContainer}>
            <Text style={styles.tempText}>認証済み - Timeline画面を実装予定</Text>
          </View>
        </View>
      )}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    flex: 1,
    justifyContent: 'center',
  },
  tempContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tempText: {
    color: colors.neutral[600],
    fontSize: 16,
  },
});
