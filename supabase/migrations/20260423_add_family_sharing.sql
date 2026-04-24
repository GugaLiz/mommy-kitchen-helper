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

alter table babies add column if not exists family_id uuid references families(id) on delete set null;
alter table growth_records add column if not exists family_id uuid references families(id) on delete set null;
alter table weekly_plan_snapshots add column if not exists family_id uuid references families(id) on delete set null;

create index if not exists idx_family_members_user_status on family_members(user_id, status);
create index if not exists idx_family_members_family_status on family_members(family_id, status);
create index if not exists idx_family_invites_code_status on family_invites(code, status);
create index if not exists idx_babies_family_id on babies(family_id);
create index if not exists idx_growth_records_family_id on growth_records(family_id);
create index if not exists idx_weekly_plan_snapshots_family_id on weekly_plan_snapshots(family_id);

insert into families (name, owner_user_id, status)
select
  coalesce(nullif(trim(u.nickname), ''), '我的') || '的家庭',
  u.id,
  'active'
from users u
where not exists (
  select 1 from family_members fm where fm.user_id = u.id and fm.status = 'active'
);

insert into family_members (family_id, user_id, role, relation, status)
select
  f.id,
  u.id,
  'owner',
  '自己',
  'active'
from users u
join families f on f.owner_user_id = u.id
where not exists (
  select 1 from family_members fm where fm.family_id = f.id and fm.user_id = u.id
);

update babies b
set family_id = f.id
from families f
where b.user_id = f.owner_user_id
  and b.family_id is null;

update growth_records g
set family_id = b.family_id
from babies b
where g.baby_id = b.id
  and g.family_id is null
  and b.family_id is not null;

update weekly_plan_snapshots w
set family_id = b.family_id
from babies b
where w.baby_id = b.id
  and w.family_id is null
  and b.family_id is not null;
