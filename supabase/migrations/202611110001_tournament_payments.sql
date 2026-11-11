-- Shadow Strike tournament payments.
-- Cash tournaments are closed by default. Enable only after all required approvals.
create table if not exists public.tournament_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  description text,
  entry_fee_minor bigint not null check (entry_fee_minor >= 100),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'draft' check (status in ('draft','open','locked','completed','cancelled')),
  cash_enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  max_players integer not null default 32 check (max_players between 2 and 10000),
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournament_events(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_reference text not null unique,
  amount_minor bigint not null check (amount_minor >= 100),
  currency text not null default 'NGN' check (currency = 'NGN'),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','initialization_failed','refunded')),
  entry_status text not null default 'awaiting_payment'
    check (entry_status in ('awaiting_payment','registered','payment_failed','disqualified','completed','refunded')),
  paid_at timestamptz,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create index if not exists tournament_events_open_idx
  on public.tournament_events(status, starts_at);
create index if not exists tournament_entries_event_idx
  on public.tournament_entries(tournament_id, payment_status);
create index if not exists tournament_entries_user_idx
  on public.tournament_entries(user_id, created_at desc);

alter table public.tournament_events enable row level security;
alter table public.tournament_entries enable row level security;

-- Browser clients cannot change events, payments, entries, or payment status.
revoke all on public.tournament_events from anon, authenticated;
revoke all on public.tournament_entries from anon, authenticated;
grant all on public.tournament_events to service_role;
grant all on public.tournament_entries to service_role;

-- No seed event is created: entry fees and tournament rules must be configured by the operator.
