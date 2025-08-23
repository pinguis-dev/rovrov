import { create } from 'zustand';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  user: null,
  loading: true,
  setSession: (session: Session | null) => set({ session }),
  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  signOut: () => set({ session: null, user: null }),
}));