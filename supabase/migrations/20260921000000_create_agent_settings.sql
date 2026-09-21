create table if not exists public.agent_settings (
  id text primary key default 'default',
  enabled_model_ids text[],
  default_model_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_settings_singleton check (id = 'default')
);

create trigger agent_settings_set_updated_at
before update on public.agent_settings
for each row
execute function public.set_updated_at();

alter table public.agent_settings enable row level security;

revoke all on table public.agent_settings from anon, authenticated;
grant all on table public.agent_settings to service_role;
