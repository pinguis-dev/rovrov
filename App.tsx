import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProfileEditScreen } from './src/screens/ProfileEditScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileEditScreen
        navigation={{ goBack: () => console.log('Go back pressed') }}
        route={{ params: { userId: '' } }}
      />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
