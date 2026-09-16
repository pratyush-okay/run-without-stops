create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  owner_clerk_id text not null references public.profiles (clerk_id) on delete cascade,
  name text not null,
  share_slug text not null unique,
  points jsonb not null,
  known_labels jsonb not null default '{}'::jsonb,
  mode text not null,
  coordinates jsonb not null,
  metrics jsonb not null,
  provider text not null,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_routes_name_length check (char_length(trim(name)) between 1 and 80),
  constraint saved_routes_share_slug_format check (share_slug ~ '^[a-z0-9]{8,16}$'),
  constraint saved_routes_mode_check check (mode in ('direct', 'low_stops')),
  constraint saved_routes_provider_check check (provider in ('graphhopper', 'valhalla'))
);

create index if not exists saved_routes_owner_created_idx
  on public.saved_routes (owner_clerk_id, created_at desc);

create trigger saved_routes_set_updated_at
before update on public.saved_routes
for each row
execute function public.set_updated_at();

alter table public.saved_routes enable row level security;

revoke all on table public.saved_routes from anon, authenticated;
grant all on table public.saved_routes to service_role;
