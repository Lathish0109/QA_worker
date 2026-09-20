-- Workspace-wide settings, e.g. which AI provider is active. Matches the
-- existing shared-workspace model (every authenticated user sees/edits the
-- same data) rather than being per-user.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
create policy "authenticated full access app_settings" on public.app_settings for all to authenticated using (true) with check (true);

insert into public.app_settings (key, value)
values ('ai_provider', '{"provider": "anthropic"}'::jsonb)
on conflict (key) do nothing;
