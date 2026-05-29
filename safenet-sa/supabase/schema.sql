-- SafeNet SA — Supabase (Postgres) schema. Single source of truth, shared with
-- the Luna-AI product. Run in the Supabase SQL editor. Multi-tenant by family_id;
-- Row Level Security restricts every parent to their own family.

create extension if not exists "pgcrypto";

-- ── Tenancy ────────────────────────────────────────────────────────────────
create table if not exists families (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  plan             text not null default 'free',          -- free | guardian | sentinel
  billing_cycle    text default 'monthly',                -- weekly | monthly | annual (weekly = telco/airtime)
  billing_provider text default 'manual',                 -- telco | paystack | manual
  msisdn           text,                                  -- mobile number for telco/airtime micro-billing
  plan_renews_at   timestamptz,
  created_at       timestamptz not null default now()
);

-- Parents map 1:1 to Supabase auth users.
create table if not exists parents (
  id          uuid primary key references auth.users (id) on delete cascade,
  family_id   uuid not null references families (id) on delete cascade,
  full_name   text,
  role        text not null default 'owner',              -- owner | guardian
  created_at  timestamptz not null default now()
);

create table if not exists children (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid not null references families (id) on delete cascade,
  name            text not null,
  device          text,
  is_online       boolean default false,
  screen_time     int default 0,
  internet_paused boolean default false,
  last_seen       timestamptz,
  lat             double precision,
  lng             double precision,
  address         text,
  created_at      timestamptz not null default now()
);

create table if not exists zones (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families (id) on delete cascade,
  name       text not null,
  icon       text,
  lat        double precision,
  lng        double precision,
  radius     int default 300,
  color      text default '#0F7B4D'
);

create table if not exists alerts (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families (id) on delete cascade,
  child_id         uuid references children (id) on delete set null,
  title            text not null,
  severity         text not null default 'low',           -- safe | low | medium | high | critical
  description      text,
  luna_explanation text,
  action_taken     text,
  is_read          boolean default false,
  created_at       timestamptz not null default now()
);

-- ── Growth + economics ───────────────────────────────────────────────────────
-- Public lead capture from the free Link Scanner (top of funnel).
create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  contact     text not null,                              -- email or msisdn
  channel     text default 'link_scanner',
  meta        jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Anonymous scan telemetry — drives the live counter and measures free-tier COGS.
create table if not exists scan_logs (
  id          bigint generated always as identity primary key,
  verdict     text,                                       -- safe | suspicious | dangerous
  score       int,
  has_url     boolean,
  created_at  timestamptz not null default now()
);

-- Daily metered Luna usage per family — enforces free-tier caps (see entitlements.js).
create table if not exists usage_daily (
  family_id   uuid not null references families (id) on delete cascade,
  day         date not null default current_date,
  luna_scans  int not null default 0,
  primary key (family_id, day)
);

-- ── Compliance + billing ──────────────────────────────────────────────────────
-- POPIA consent ledger — one row per purpose the parent granted at sign-up.
create table if not exists consents (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references auth.users (id) on delete cascade,
  family_id   uuid references families (id) on delete cascade,
  purpose     text not null,
  granted     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Payment ledger. Written server-side only (Paystack webhook, service role).
create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families (id) on delete cascade,
  provider    text not null default 'paystack',           -- paystack | telco | manual
  reference   text,
  amount      numeric(10,2),
  currency    text default 'ZAR',
  plan        text,
  cycle       text,
  status      text default 'success',
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table families  enable row level security;
alter table parents   enable row level security;
alter table children  enable row level security;
alter table zones     enable row level security;
alter table alerts    enable row level security;
alter table usage_daily enable row level security;
alter table consents  enable row level security;
alter table payments  enable row level security;

-- A parent can see/manage only rows belonging to their own family.
create or replace function auth_family_id() returns uuid language sql stable as $$
  select family_id from parents where id = auth.uid()
$$;

create policy fam_self on families  for all using (id = auth_family_id());
create policy par_self on parents   for all using (family_id = auth_family_id());
create policy chi_self on children  for all using (family_id = auth_family_id());
create policy zon_self on zones     for all using (family_id = auth_family_id());
create policy alr_self on alerts    for all using (family_id = auth_family_id());
create policy usg_self on usage_daily for all using (family_id = auth_family_id());
create policy con_self on consents  for all using (family_id = auth_family_id());
-- Parents may read their own payment history; inserts come from the service role
-- (webhook), which bypasses RLS, so no insert policy is granted to clients.
create policy pay_self on payments  for select using (family_id = auth_family_id());

-- leads + scan_logs accept anonymous inserts from the public tool (no select).
alter table leads     enable row level security;
alter table scan_logs enable row level security;
create policy leads_insert on leads     for insert with check (true);
create policy scans_insert on scan_logs for insert with check (true);
