import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from '@/navigation/TabNavigator';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/services/supabase';

export default function App() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}