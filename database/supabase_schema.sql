create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  avatar text,
  major text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists major text;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists avatar_color text default '#4F46E5',
  add column if not exists school text,
  add column if not exists target_date date,
  add column if not exists theme text default 'system',
  add column if not exists accent_color text default '#4F46E5',
  add column if not exists default_page text default 'dashboard';

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  weight integer not null check (weight in (10, 40, 100)),
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  target_date date not null,
  completed_day date
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  exam_date timestamptz,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  duration_minutes integer not null,
  session_date date not null default current_date,
  created_at timestamptz default now()
);

create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  review_date date not null default current_date,
  focus_score integer check (focus_score between 1 and 5),
  blocker_note text,
  created_at timestamptz default now(),
  unique (user_id, review_date)
);

alter table public.tasks
  add column if not exists subject_id uuid references public.subjects (id) on delete set null;

alter table public.tasks
  add column if not exists estimated_minutes integer default 30;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'User'),
    coalesce(new.email, ''),
    upper(left(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'U'), 2))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.daily_reviews enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subjects_select_own" on public.subjects;
create policy "subjects_select_own"
on public.subjects
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "subjects_insert_own" on public.subjects;
create policy "subjects_insert_own"
on public.subjects
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "subjects_update_own" on public.subjects;
create policy "subjects_update_own"
on public.subjects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "subjects_delete_own" on public.subjects;
create policy "subjects_delete_own"
on public.subjects
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own"
on public.study_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own"
on public.study_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own"
on public.study_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own"
on public.study_sessions
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily_reviews_select_own" on public.daily_reviews;
create policy "daily_reviews_select_own"
on public.daily_reviews
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "daily_reviews_insert_own" on public.daily_reviews;
create policy "daily_reviews_insert_own"
on public.daily_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "daily_reviews_update_own" on public.daily_reviews;
create policy "daily_reviews_update_own"
on public.daily_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_reviews_delete_own" on public.daily_reviews;
create policy "daily_reviews_delete_own"
on public.daily_reviews
for delete
to authenticated
using (auth.uid() = user_id);
