const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '') as string;
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '') as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase configuration is missing. Please check your environment variables.');
}

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
