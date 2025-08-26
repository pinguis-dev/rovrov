import { create } from 'zustand';

import { authStorage } from '../services/secureStorage';
import { supabase } from '../services/supabase';
import type { User, Session, AuthError } from '../types/auth';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;

  signInWithMagicLink: (email: string) => Promise<void>;
  verifyOtp: (token: string, email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  signInWithMagicLink: async (email: string) => {
    console.log('AuthStore: Starting magic link for:', email);
    set({ error: null }); // isLoadingの更新を削除
    try {
      console.log('AuthStore: Calling Supabase signInWithOtp');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: 'rovrov://auth/callback',
        },
      });

      console.log('AuthStore: Supabase response error:', error);
      if (error) throw error;

      console.log('AuthStore: Magic link sent successfully');
      // isLoading: falseの設定を削除
    } catch (error: any) {
      console.error('AuthStore: Error caught:', error);
      const authError = mapSupabaseError(error);
      set({ error: authError }); // isLoadingの更新を削除
      throw authError;
    }
  },

  verifyOtp: async (token: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        email,
        type: 'email',
      });

      if (error) throw error;

      if (data.session) {
        await authStorage.setTokens(data.session.access_token, data.session.refresh_token || '');

        const userData: User = {
          id: data.user?.id || '',
          email: data.user?.email || '',
          username: data.user?.user_metadata?.username,
          display_name: data.user?.user_metadata?.display_name,
          bio: data.user?.user_metadata?.bio,
          avatar_url: data.user?.user_metadata?.avatar_url,
          created_at: data.user?.created_at || '',
          updated_at: data.user?.updated_at || '',
        };

        await authStorage.setUserData(JSON.stringify(userData));

        set({
          user: userData,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token || '',
            expires_in: data.session.expires_in || 3600,
            expires_at: data.session.expires_at || 0,
            user: userData,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      const authError = mapSupabaseError(error);
      set({ isLoading: false, error: authError });
      throw authError;
    }
  },

  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (data.session) {
        await authStorage.setTokens(data.session.access_token, data.session.refresh_token || '');
      }
    } catch (error: any) {
      console.error('Failed to refresh session:', error);
      await get().signOut();
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      await authStorage.clearAll();
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const userData: User = {
          id: data.session.user?.id || '',
          email: data.session.user?.email || '',
          username: data.session.user?.user_metadata?.username,
          display_name: data.session.user?.user_metadata?.display_name,
          bio: data.session.user?.user_metadata?.bio,
          avatar_url: data.session.user?.user_metadata?.avatar_url,
          created_at: data.session.user?.created_at || '',
          updated_at: data.session.user?.updated_at || '',
        };

        set({
          user: userData,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token || '',
            expires_in: data.session.expires_in || 3600,
            expires_at: data.session.expires_at || 0,
            user: userData,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      set({ isLoading: false });
    }
  },
}));

function mapSupabaseError(error: any): AuthError {
  const errorMap: Record<string, string> = {
    rate_limit_exceeded: '試行回数が多すぎます。後でもう一度お試しください',
    over_email_send_rate_limit: '安全のため、しばらくお待ちください（約60秒後に再試行可能）',
    network_error: 'インターネット接続を確認してください',
    invalid_email: '正しいメールアドレスの形式で入力してください',
    expired_token: 'リンクの有効期限が切れています',
  };

  // Supabase Auth errorのcodeを確認
  const code = error?.code || 'unknown_error';
  let message = errorMap[code];

  // エラーメッセージに "security purposes" が含まれる場合のフォールバック
  if (!message && error?.message?.includes('security purposes')) {
    const seconds = error.message.match(/(\d+) seconds/)?.[1];
    message = seconds
      ? `安全のため、あと${seconds}秒お待ちください`
      : '安全のため、しばらくお待ちください';
  }

  if (!message) {
    message = 'メール送信に失敗しました。もう一度お試しください';
  }

  return { code, message };
}
