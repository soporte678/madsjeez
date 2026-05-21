create type if not exists seller_lead_status as enum ('NEW', 'CONTACTED', 'ACTIVATED', 'SELLING');

create table if not exists seller_invites (
  id text primary key,
  code text unique not null,
  owner_user_id text references users(id) on delete set null,
  source text not null default 'direct',
  campaign_name text,
  clicks integer not null default 0,
  signups integer not null default 0,
  activations integer not null default 0,
  first_sales integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seller_leads (
  id text primary key,
  invite_code text references seller_invites(code) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  business_name text,
  business_type text,
  monthly_catalog integer,
  message text,
  status seller_lead_status not null default 'NEW',
  user_id text unique references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_invites_owner_user_id_idx on seller_invites(owner_user_id);
create index if not exists seller_invites_is_active_idx on seller_invites(is_active);
create index if not exists seller_leads_email_idx on seller_leads(email);
create index if not exists seller_leads_status_idx on seller_leads(status);
create index if not exists seller_leads_invite_code_idx on seller_leads(invite_code);
