-- ============================================================
-- SpeakFree — Supabase Database Setup
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE (username, display name, etc.)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  native_language text default 'Bengali',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. USER PROGRESS TABLE (course data synced to cloud)
create table if not exists public.user_progress (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references auth.users(id) on delete cascade,
  level              text default 'beginner',
  learning_goal      text,
  completed_lessons  text[] default '{}',
  xp_earned          int default 0,
  xp_goal            int default 50,
  streak             int default 0,
  lessons_completed  int default 0,
  last_active_date   text,
  timeline           text default '30',
  daily_minutes      int default 30,
  updated_at         timestamptz default now()
);

-- 3. ROW LEVEL SECURITY — users can only see their own data
alter table public.profiles      enable row level security;
alter table public.user_progress enable row level security;

-- Profiles: read own, write own
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Progress: read own, write own
create policy "Users can view own progress"
  on public.user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can upsert own progress"
  on public.user_progress for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own progress"
  on public.user_progress for update
  using ( auth.uid() = user_id );

-- 4. DISABLE EMAIL CONFIRMATION (so username-only signup works instantly)
-- Go to: Supabase Dashboard → Authentication → Email → 
-- Turn OFF "Enable email confirmations"
-- (This cannot be done via SQL — do it in the dashboard)
