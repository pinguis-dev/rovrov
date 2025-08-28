import React, { useEffect } from 'react';

// import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/authStore';

export const useRequireAuth = () => {
  const { user, isInitialized, isLoading } = useAuthStore();
  // const navigation = useNavigation();

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      // TODO: Navigation will be implemented when React Navigation is properly set up
      // navigation.navigate('Auth');
    }
  }, [user, isInitialized, isLoading]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: !isInitialized || isLoading,
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
  },
});

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5956D6" />
    </View>
  );
};

export function withAuthGuard<P extends object>(Component: React.ComponentType<P>) {
  const GuardedComponent = (props: P) => {
    const { user, isLoading } = useRequireAuth();

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!user) {
      return null;
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} />;
  };

  return GuardedComponent;
}
