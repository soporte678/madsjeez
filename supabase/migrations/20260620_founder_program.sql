-- Founder Program: 100 cupos de Sellers Fundadores
-- Tracking de slots tomados + referral entre fundadores
create table if not exists public.founder_program (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id) on delete cascade unique,
  slot_number int unique,
  referred_by uuid references auth.users(id) on delete set null,
  status text default 'active' check (status in ('active','revoked','paused')),
  joined_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists founder_program_status_idx on public.founder_program(status);

alter table public.founder_program enable row level security;

drop policy if exists founder_program_select_own on public.founder_program;
create policy founder_program_select_own
  on public.founder_program
  for select
  to authenticated
  using (seller_id = auth.uid());
