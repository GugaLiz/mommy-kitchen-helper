-- Enable RLS
alter table public.users enable row level security;
alter table public.babies enable row level security;
alter table public.recipe_collections enable row level security;
alter table public.growth_records enable row level security;
alter table public.made_recipes enable row level security;

-- users: a logged-in user can only read/write their own app profile
drop policy if exists users_select_own on public.users;
create policy users_select_own
on public.users
for select
using (auth.uid() = auth_user_id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
on public.users
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own
on public.users
for insert
with check (auth.uid() = auth_user_id);

-- babies: only owner can read/write
drop policy if exists babies_select_own on public.babies;
create policy babies_select_own
on public.babies
for select
using (
  exists (
    select 1 from public.users u
    where u.id = babies.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists babies_insert_own on public.babies;
create policy babies_insert_own
on public.babies
for insert
with check (
  exists (
    select 1 from public.users u
    where u.id = babies.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists babies_update_own on public.babies;
create policy babies_update_own
on public.babies
for update
using (
  exists (
    select 1 from public.users u
    where u.id = babies.user_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = babies.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists babies_delete_own on public.babies;
create policy babies_delete_own
on public.babies
for delete
using (
  exists (
    select 1 from public.users u
    where u.id = babies.user_id and u.auth_user_id = auth.uid()
  )
);

-- recipe_collections: only owner can CRUD
drop policy if exists recipe_collections_select_own on public.recipe_collections;
create policy recipe_collections_select_own
on public.recipe_collections
for select
using (
  exists (
    select 1 from public.users u
    where u.id = recipe_collections.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists recipe_collections_insert_own on public.recipe_collections;
create policy recipe_collections_insert_own
on public.recipe_collections
for insert
with check (
  exists (
    select 1 from public.users u
    where u.id = recipe_collections.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists recipe_collections_delete_own on public.recipe_collections;
create policy recipe_collections_delete_own
on public.recipe_collections
for delete
using (
  exists (
    select 1 from public.users u
    where u.id = recipe_collections.user_id and u.auth_user_id = auth.uid()
  )
);

-- growth_records: only owner can CRUD
drop policy if exists growth_records_select_own on public.growth_records;
create policy growth_records_select_own
on public.growth_records
for select
using (
  exists (
    select 1 from public.users u
    where u.id = growth_records.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists growth_records_insert_own on public.growth_records;
create policy growth_records_insert_own
on public.growth_records
for insert
with check (
  exists (
    select 1 from public.users u
    where u.id = growth_records.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists growth_records_update_own on public.growth_records;
create policy growth_records_update_own
on public.growth_records
for update
using (
  exists (
    select 1 from public.users u
    where u.id = growth_records.user_id and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = growth_records.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists growth_records_delete_own on public.growth_records;
create policy growth_records_delete_own
on public.growth_records
for delete
using (
  exists (
    select 1 from public.users u
    where u.id = growth_records.user_id and u.auth_user_id = auth.uid()
  )
);

-- made_recipes: only owner can CRUD
drop policy if exists made_recipes_select_own on public.made_recipes;
create policy made_recipes_select_own
on public.made_recipes
for select
using (
  exists (
    select 1 from public.users u
    where u.id = made_recipes.user_id and u.auth_user_id = auth.uid()
  )
);

drop policy if exists made_recipes_insert_own on public.made_recipes;
create policy made_recipes_insert_own
on public.made_recipes
for insert
with check (
  exists (
    select 1 from public.users u
    where u.id = made_recipes.user_id and u.auth_user_id = auth.uid()
  )
);

-- recipes: readable by all logged-in users, write protected
alter table public.recipes enable row level security;
drop policy if exists recipes_select_all_auth on public.recipes;
create policy recipes_select_all_auth
on public.recipes
for select
using (auth.uid() is not null);
