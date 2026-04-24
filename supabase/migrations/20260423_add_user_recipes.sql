alter table if exists recipes
  add column if not exists created_by_user_id uuid references users(id) on delete set null,
  add column if not exists image_text text,
  add column if not exists is_public boolean not null default true,
  add column if not exists audit_status text not null default 'approved';

create index if not exists idx_recipes_created_by_user_id on recipes(created_by_user_id);
create index if not exists idx_recipes_public_status on recipes(is_public, audit_status);
