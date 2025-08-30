-- Supabase setup for profiles table (RLS + uniqueness + minimum privileges)
-- Run in Supabase SQL editor or via Supabase CLI.

-- 1) Ensure table exists (skip if already created by your schema)
-- create table if not exists public.profiles (
--   id uuid primary key references auth.users (id) on delete cascade,
--   username text unique,
--   display_name text,
--   bio text,
--   avatar_url text,
--   header_url text,
--   location text,
--   website_url text,
--   created_at timestamp with time zone default now(),
--   updated_at timestamp with time zone
-- );

-- 2) RLS: enable on profiles
alter table public.profiles enable row level security;

-- 3) Normalized username + uniqueness (case-insensitive)
alter table public.profiles
  add column if not exists username_normalized text generated always as (lower(username)) stored;

create unique index if not exists profiles_username_unique
  on public.profiles (username_normalized)
  where username is not null;

-- 4) Policies
-- 4.1 Read/Update only own row for authenticated users
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- 4.2 Minimal SELECT-only policy to allow username availability checks
-- This allows authenticated users to count rows for any username.
-- (We keep it to authenticated only to avoid anonymous enumeration.)
drop policy if exists profiles_select_for_username_check on public.profiles;
create policy profiles_select_for_username_check
  on public.profiles for select
  to authenticated
  using (true);

-- 5) Column-level privileges: restrict to id/username for authenticated role
-- (PostgREST will still apply RLS; column grants help reduce exposure.)
revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select (id, username) on public.profiles to authenticated;
grant update (username, display_name, bio, avatar_url, header_url, location, website_url, updated_at)
  on public.profiles to authenticated;

-- Note: availability check only needs COUNT of matching usernames.
-- Frontend uses: select('id', { head: true, count: 'exact' }).ilike('username', <value>)
-- Because head:true returns no rows, only count. RLS + grants still apply.

-- 6) Optional: trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

