SELECT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE c.relname='profiles_username_unique' AND n.nspname='public'
) AS has_unique_index;

