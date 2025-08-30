-- RPC: check_username_availability
-- 目的: 匿名/認証ユーザーからでも、ユーザー名の重複有無のみ（boolean）を返す
-- 安全性: SECURITY DEFINERでRLSを越えるが、行データは返さずtrue/falseのみ
-- 権限: anon, authenticated にEXECUTEを付与（その他は不許可）

create or replace function public.check_username_availability(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where username_normalized = lower(p_username)
  );
$$;

-- 最小権限付与
revoke all on function public.check_username_availability(text) from public;
grant execute on function public.check_username_availability(text) to anon;
grant execute on function public.check_username_availability(text) to authenticated;

