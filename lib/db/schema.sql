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

-- OAuth 2.0 authorization codes issued during the Connect-via-Claude flow.
-- Codes are short-lived (5 min) and single-use. The "access token" we
-- ultimately hand back to the client is the user's existing api_key — so
-- the same withMcpAuth verifyToken path stays in use.
create table if not exists oauth_codes (
  code                  text primary key,
  user_id               text not null references users(id) on delete cascade,
  client_id             text not null,
  redirect_uri          text not null,
  code_challenge        text not null,
  code_challenge_method text not null default 'S256',
  scope                 text not null default '',
  resource              text,
  expires_at            timestamptz not null,
  used_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists oauth_codes_expires_at_idx
  on oauth_codes(expires_at);
