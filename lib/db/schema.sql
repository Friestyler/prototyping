-- Qollabi Portfolio Intelligence — persistence schema.
-- Customers stay in code (lib/customer-database.ts) as the read-only seed pool.
-- Only user-created smart lists are persisted, scoped per user.

create table if not exists users (
  id          text primary key,
  email       text unique not null,
  api_key     text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists user_smart_lists (
  id                 text primary key,
  user_id            text not null references users(id) on delete cascade,
  name               text not null,
  type               text not null check (type in ('dynamic', 'static')),
  description        text not null default '',
  source_use_case_id text,
  source_title       text,
  icon_bg            text,
  icon_color         text,
  customer_ids       jsonb not null default '[]'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists user_smart_lists_user_id_idx
  on user_smart_lists(user_id);
