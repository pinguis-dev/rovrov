import { useEffect } from 'react';

import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { Session } from '../types/auth';

export const useAuthListener = () => {
  const { setUser, setSession, initialize } = useAuthStore();

  useEffect(() => {
    // 初期化
    void initialize();

    // Auth状態変更リスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session) {
            setSession(session as unknown as Session);
          }
          break;
        case 'SIGNED_OUT':
          setUser(null);
          setSession(null);
          break;
        case 'USER_UPDATED':
          if (session) {
            setSession(session as unknown as Session);
          }
          break;
        default:
          // Other events are ignored
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setUser, setSession]);
};
