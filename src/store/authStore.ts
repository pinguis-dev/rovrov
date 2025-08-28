import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { supabase } from '../services/supabase';
import type { User, Session, AuthError } from '../types/auth';

interface AuthStore {
  // 状態
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;

  // アクション
  signInWithMagicLink: (email: string) => Promise<void>;
  verifyOtp: (token: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      isAuthenticated: false,

      signInWithMagicLink: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              emailRedirectTo: 'rovrov://auth/callback',
            },
          });
          if (error) throw error;
        } catch (error: any) {
          const authError = mapSupabaseError(error);
          set({ error: authError });
          throw authError;
        } finally {
          set({ isLoading: false });
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
            });
          }
        } catch (error: any) {
          const authError = mapSupabaseError(error);
          set({ error: authError });
          throw authError;
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null, isAuthenticated: false });
        } catch (error: any) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) throw error;
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
              session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token || '',
                expires_in: data.session.expires_in || 3600,
                expires_at: data.session.expires_at || 0,
                user: userData,
              },
              user: userData,
            });
          }
        } catch (error: any) {
          console.error('Refresh session error:', error);
          // セッション無効な場合はログアウト処理
          set({ user: null, session: null, isAuthenticated: false });
        }
      },

      initialize: async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            const userData: User = {
              id: session.user?.id || '',
              email: session.user?.email || '',
              username: session.user?.user_metadata?.username,
              display_name: session.user?.user_metadata?.display_name,
              bio: session.user?.user_metadata?.bio,
              avatar_url: session.user?.user_metadata?.avatar_url,
              created_at: session.user?.created_at || '',
              updated_at: session.user?.updated_at || '',
            };

            set({
              session: {
                access_token: session.access_token,
                refresh_token: session.refresh_token || '',
                expires_in: session.expires_in || 3600,
                expires_at: session.expires_at || 0,
                user: userData,
              },
              user: userData,
              isAuthenticated: true,
              isInitialized: true,
            });
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.error('Initialize auth error:', error);
          set({ isInitialized: true });
        }
      },

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

      setSession: (session: Session | null) =>
        set({
          session,
          user: session?.user || null,
          isAuthenticated: !!session,
        }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    },
  ),
);

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
