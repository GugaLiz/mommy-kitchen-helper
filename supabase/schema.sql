-- mommy-kitchen-helper Supabase schema (MVP)
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wechat_openid text unique not null,
  nickname text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'editor',
  relation text,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create table if not exists family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  code text not null unique,
  created_by_user_id uuid not null references users(id) on delete cascade,
  role_to_grant text not null default 'editor',
  relation text,
  expires_at timestamptz not null,
  used_by_user_id uuid references users(id) on delete set null,
  used_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  nickname text not null,
  gender text check (gender in ('male', 'female')),
  birth_date date not null,
  allergies text[] not null default '{}',
  dietary_preferences text[] not null default '{}',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references users(id) on delete set null,
  name text not null,
  min_age_months int not null,
  max_age_months int not null,
  cooking_time int not null,
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tips text,
  nutrition_info text,
  image_url text,
  image_text text,
  is_public boolean not null default true,
  audit_status text not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_recipes_name_unique on recipes(name);
create index if not exists idx_recipes_created_by_user_id on recipes(created_by_user_id);
create index if not exists idx_recipes_public_status on recipes(is_public, audit_status);

create table if not exists recipe_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, recipe_id)
);

create table if not exists growth_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  measured_date date not null,
  height numeric(5,2) not null,
  weight numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  baby_id uuid not null references babies(id) on delete cascade,
  family_id uuid references families(id) on delete set null,
  week_start date not null,
  week_end date not null,
  is_confirmed boolean not null default false,
  plan_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, baby_id, week_start)
);

create index if not exists idx_babies_user_id on babies(user_id);
create index if not exists idx_babies_family_id on babies(family_id);
create index if not exists idx_growth_baby_date on growth_records(baby_id, measured_date desc);
create index if not exists idx_growth_records_family_id on growth_records(family_id);
create index if not exists idx_recipes_age on recipes(min_age_months, max_age_months);
create index if not exists idx_weekly_plan_snapshots_user_baby_week on weekly_plan_snapshots(user_id, baby_id, week_start desc);
create index if not exists idx_weekly_plan_snapshots_family_id on weekly_plan_snapshots(family_id);
create index if not exists idx_family_members_user_status on family_members(user_id, status);
create index if not exists idx_family_members_family_status on family_members(family_id, status);
create index if not exists idx_family_invites_code_status on family_invites(code, status);
