import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Platform } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Image
          source={{
            uri: 'https://docs.expo.dev/static/images/tutorial/splash.png',
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Expo</Text>
        <Text style={styles.subtitle}>Edit App.tsx to get started</Text>
        <View style={styles.separator} />
        <Text style={styles.description}>Your app is running on {Platform.OS}</Text>
      </View>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  logo: {
    height: 180,
    marginBottom: 20,
    width: 180,
  },
  main: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 'auto',
    maxWidth: 960,
  },
  separator: {
    backgroundColor: '#eee',
    height: 1,
    marginVertical: 30,
    width: '80%',
  },
  subtitle: {
    color: '#666',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
});
