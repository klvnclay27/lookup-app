-- Persist LookUP account/profile preferences in Supabase.
-- Run this migration in the Supabase SQL Editor before deploying the matching backend.

alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists smart_mode_enabled boolean;

update public.user_profiles
set display_name = coalesce(nullif(trim(username), ''), 'LookUP User')
where display_name is null or trim(display_name) = '';

update public.user_profiles
set smart_mode_enabled = true
where smart_mode_enabled is null;

update public.user_profiles
set username = lower(trim(username))
where username is not null;

alter table public.user_profiles
  alter column username drop not null,
  alter column display_name set default 'LookUP User',
  alter column display_name set not null,
  alter column smart_mode_enabled set default true,
  alter column smart_mode_enabled set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_username_format'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_username_format
      check (username is null or username ~ '^[a-z0-9_]{3,24}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_display_name_length'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_display_name_length
      check (char_length(trim(display_name)) between 1 and 80);
  end if;
end
$$;

create unique index if not exists user_profiles_username_lower_unique
  on public.user_profiles (lower(username))
  where username is not null;

alter table public.user_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'lookup_users_select_own_profile'
  ) then
    create policy lookup_users_select_own_profile
      on public.user_profiles
      for select
      to authenticated
      using ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'lookup_users_insert_own_profile'
  ) then
    create policy lookup_users_insert_own_profile
      on public.user_profiles
      for insert
      to authenticated
      with check ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'lookup_users_update_own_profile'
  ) then
    create policy lookup_users_update_own_profile
      on public.user_profiles
      for update
      to authenticated
      using ((select auth.uid()) = id)
      with check ((select auth.uid()) = id);
  end if;
end
$$;

revoke all on table public.user_profiles from anon;
grant select, insert, update on table public.user_profiles to authenticated;
