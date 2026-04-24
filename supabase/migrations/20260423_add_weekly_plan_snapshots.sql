create table if not exists weekly_plan_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  baby_id uuid not null references babies(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  is_confirmed boolean not null default false,
  plan_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, baby_id, week_start)
);

create index if not exists idx_weekly_plan_snapshots_user_baby_week
  on weekly_plan_snapshots(user_id, baby_id, week_start desc);
