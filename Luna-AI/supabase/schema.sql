-- Luna AI — Supabase schema
-- Run this in your Supabase SQL editor after creating the project.

create table if not exists scans (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  url         text        not null,
  type        text        not null default 'phishing',
  score       integer     not null default 0,
  verdict     text        not null default 'safe',
  findings    jsonb       not null default '[]',
  created_at  timestamptz default now()
);

-- Row-level security: users can only see and insert their own scans
alter table scans enable row level security;

create policy "select_own_scans" on scans
  for select using (auth.uid() = user_id);

create policy "insert_own_scans" on scans
  for insert with check (auth.uid() = user_id);

-- Index for fast history queries
create index scans_user_id_created_at on scans (user_id, created_at desc);

-- ── Profiles table (plan / subscription state) ──────────────────────────
create table if not exists profiles (
  id                   uuid references auth.users(id) on delete cascade primary key,
  plan                 text default 'free',
  plan_activated_at    timestamptz,
  razorpay_payment_id  text,
  created_at           timestamptz default now()
);

alter table profiles enable row level security;

alter table profiles add column if not exists voice_persona text default 'friendly';
alter table profiles add column if not exists weekly_digest_enabled boolean default true;
alter table profiles add column if not exists last_digest_sent_at timestamptz;

create policy "select_own_profile" on profiles
  for select using (auth.uid() = id);

create policy "insert_own_profile" on profiles
  for insert with check (auth.uid() = id);

-- ── API Keys table (for developers) ──────────────────────────────────────
create table if not exists api_keys (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null default 'Default Key',
  key         text        not null unique,
  created_at  timestamptz default now()
);

alter table api_keys enable row level security;

create policy "select_own_keys" on api_keys
  for select using (auth.uid() = user_id);

create policy "insert_own_keys" on api_keys
  for insert with check (auth.uid() = user_id);

create policy "delete_own_keys" on api_keys
  for delete using (auth.uid() = user_id);

-- ── Monitors table (Sentinel uptime monitoring) ───────────────────────────
create table if not exists monitors (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  url          text        not null,
  label        text        not null,
  last_status  integer,
  last_ttfb    integer,
  last_checked timestamptz,
  uptime_pct   numeric(5,2) default 100,
  created_at   timestamptz default now()
);

alter table monitors enable row level security;

create policy "select_own_monitors" on monitors
  for select using (auth.uid() = user_id);

create policy "insert_own_monitors" on monitors
  for insert with check (auth.uid() = user_id);

create policy "update_own_monitors" on monitors
  for update using (auth.uid() = user_id);

create policy "delete_own_monitors" on monitors
  for delete using (auth.uid() = user_id);

-- ── Conversations table (per-user Luna voice memory / RAG) ───────────────
create table if not exists conversations (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz default now()
);

alter table conversations enable row level security;

create policy "select_own_conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "insert_own_conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "delete_own_conversations" on conversations
  for delete using (auth.uid() = user_id);

-- Keep queries fast — fetch latest N by user
create index conversations_user_id_created_at on conversations (user_id, created_at desc);

-- ── Teams table ───────────────────────────────────────────────────────────
create table if not exists teams (
  id           uuid        default gen_random_uuid() primary key,
  name         text        not null,
  owner_id     uuid        references auth.users(id) on delete cascade not null,
  created_at   timestamptz default now()
);

alter table teams enable row level security;

create policy "select_own_team" on teams
  for select using (auth.uid() = owner_id);

create policy "insert_own_team" on teams
  for insert with check (auth.uid() = owner_id);

-- ── Team members table ────────────────────────────────────────────────────
create table if not exists team_members (
  id        uuid  default gen_random_uuid() primary key,
  team_id   uuid  references teams(id) on delete cascade not null,
  user_id   uuid  references auth.users(id) on delete cascade not null,
  role      text  not null default 'member' check (role in ('admin', 'member')),
  email     text  not null,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

alter table team_members enable row level security;

-- Team admins can see all members
create policy "select_team_members" on team_members
  for select using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy "insert_team_members" on team_members
  for insert with check (
    exists (
      select 1 from teams t where t.id = team_id and t.owner_id = auth.uid()
    )
  );

create policy "delete_team_members" on team_members
  for delete using (
    exists (
      select 1 from teams t where t.id = team_id and t.owner_id = auth.uid()
    )
  );

-- Admins can read scans of team members
create policy "select_team_scans" on scans
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from team_members tm
      join teams t on t.id = tm.team_id
      where tm.user_id = scans.user_id
        and t.owner_id = auth.uid()
    )
  );
