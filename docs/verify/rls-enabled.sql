SELECT relrowsecurity AS rls_enabled
FROM pg_class WHERE oid='public.profiles'::regclass;

