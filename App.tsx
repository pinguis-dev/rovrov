import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Platform } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Image
          source={{
            uri: 'https://docs.expo.dev/static/images/tutorial/splash.png'
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Expo</Text>
        <Text style={styles.subtitle}>
          Edit App.tsx to get started
        </Text>
        <View style={styles.separator} />
        <Text style={styles.description}>
          Your app is running on {Platform.OS}
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 960,
    marginHorizontal: 'auto',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
