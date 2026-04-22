-- Incremental migration after initial schema.sql
-- Goal: bind app users table with Supabase auth.users for RLS policies

alter table public.users
  add column if not exists auth_user_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_unique'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_unique unique (auth_user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_auth_user_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_babies_set_updated_at on public.babies;
create trigger trg_babies_set_updated_at
before update on public.babies
for each row execute function public.set_updated_at();

drop trigger if exists trg_recipes_set_updated_at on public.recipes;
create trigger trg_recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists trg_growth_records_set_updated_at on public.growth_records;
create trigger trg_growth_records_set_updated_at
before update on public.growth_records
for each row execute function public.set_updated_at();
