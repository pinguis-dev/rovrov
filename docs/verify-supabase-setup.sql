-- Verify normalized column, unique index, RLS, and policies on public.profiles
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='username_normalized'
) AS has_username_normalized;

SELECT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relname='profiles_username_unique' AND n.nspname='public'
) AS has_unique_index;

SELECT relrowsecurity AS rls_enabled
FROM pg_class WHERE oid='public.profiles'::regclass;

SELECT polname
FROM pg_policy
WHERE polrelid='public.profiles'::regclass
ORDER BY polname;

