create table if not exists public.made_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  baby_id uuid not null references public.babies(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  made_date date not null default current_date,
  notes text,
  rating int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_made_recipes_user_baby on public.made_recipes(user_id, baby_id, made_date desc);
create index if not exists idx_made_recipes_recipe on public.made_recipes(recipe_id);

drop trigger if exists trg_made_recipes_set_updated_at on public.made_recipes;
create trigger trg_made_recipes_set_updated_at
before update on public.made_recipes
for each row execute function public.set_updated_at();
