-- mommy-kitchen-helper Supabase schema (MVP)
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wechat_openid text unique not null,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nickname text not null,
  gender text check (gender in ('male', 'female')),
  birth_date date not null,
  allergies text[] not null default '{}',
  dietary_preferences text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_recipes_name_unique on recipes(name);

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
  measured_date date not null,
  height numeric(5,2) not null,
  weight numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_babies_user_id on babies(user_id);
create index if not exists idx_growth_baby_date on growth_records(baby_id, measured_date desc);
create index if not exists idx_recipes_age on recipes(min_age_months, max_age_months);
