create table if not exists web_visits (
  id text primary key,
  path text not null,
  source text not null,
  medium text not null,
  campaign text,
  referrer text,
  user_agent text,
  visitor_hash text,
  created_at timestamptz not null default now()
);

create index if not exists web_visits_created_at_idx on web_visits(created_at);
create index if not exists web_visits_source_medium_idx on web_visits(source, medium);
