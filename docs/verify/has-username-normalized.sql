SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='profiles' AND column_name='username_normalized'
) AS has_username_normalized;

