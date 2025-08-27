import * as Linking from 'expo-linking';

import { useAuthStore } from '../store/authStore';

export const handleDeepLink = async (url: string) => {
  try {
    const parsed = Linking.parse(url);
    const { hostname, path, queryParams } = parsed;

    console.log('Deep link received:', { hostname, path, queryParams });

    if (path === 'auth/callback' || path === '/auth/callback') {
      if (queryParams?.access_token && queryParams?.refresh_token) {
        if (queryParams.type === 'recovery' || queryParams.type === 'magiclink') {
          console.log('Processing magic link authentication');
        }
      } else if (queryParams?.token && queryParams?.email) {
        const { verifyOtp } = useAuthStore.getState();
        await verifyOtp(queryParams.token as string, queryParams.email as string);
      }
    }
  } catch (error) {
    console.error('Deep link handler error:', error);
  }
};

export const setupDeepLinkListener = () => {
  const subscription = Linking.addEventListener('url', (event) => {
    void handleDeepLink(event.url);
  });

  void Linking.getInitialURL().then((url) => {
    if (url) {
      void handleDeepLink(url);
    }
  });

  return () => {
    subscription.remove();
  };
};
