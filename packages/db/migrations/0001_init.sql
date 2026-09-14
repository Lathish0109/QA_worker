-- Obsidian QA Engine — V1 schema
-- Run this once in the Supabase SQL Editor for project qkmjvgaiuzofvwntxlrg.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists projects_created_by_idx on public.projects(created_by);

create table if not exists public.project_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  username text not null,
  encrypted_password text not null,
  created_at timestamptz not null default now()
);
create index if not exists project_credentials_project_id_idx on public.project_credentials(project_id);

create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists requirements_project_id_idx on public.requirements(project_id);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  title text not null,
  description text,
  type text not null check (type in ('positive','negative','edge','validation')),
  steps jsonb not null default '[]'::jsonb,
  expected_result text not null,
  status text not null default 'draft' check (status in ('draft','approved','rejected')),
  generated_by text not null default 'ai' check (generated_by in ('ai','human')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists test_cases_project_id_idx on public.test_cases(project_id);
create index if not exists test_cases_requirement_id_idx on public.test_cases(requirement_id);
create index if not exists test_cases_status_idx on public.test_cases(status);

create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  triggered_by uuid references public.profiles(id),
  status text not null default 'queued' check (status in ('queued','running','passed','failed','partial','error')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists test_runs_project_id_idx on public.test_runs(project_id);
create index if not exists test_runs_status_idx on public.test_runs(status);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  test_run_id uuid not null references public.test_runs(id) on delete cascade,
  test_case_id uuid not null references public.test_cases(id),
  status text not null check (status in ('passed','failed','skipped','error')),
  duration_ms integer,
  error_message text,
  screenshot_url text,
  trace_url text,
  console_log_url text,
  created_at timestamptz not null default now()
);
create index if not exists test_results_test_run_id_idx on public.test_results(test_run_id);
create index if not exists test_results_test_case_id_idx on public.test_results(test_case_id);
create index if not exists test_results_status_idx on public.test_results(status);

create table if not exists public.failure_analyses (
  id uuid primary key default gen_random_uuid(),
  test_result_id uuid not null references public.test_results(id) on delete cascade,
  summary text not null,
  expected_behavior text not null,
  actual_behavior text not null,
  root_cause_hypothesis text,
  confidence_level text check (confidence_level in ('low','medium','high')),
  error_category text,
  suggested_severity text check (suggested_severity in ('low','medium','high','critical')),
  suggested_priority text check (suggested_priority in ('low','medium','high','urgent')),
  reproduction_steps jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists failure_analyses_test_result_id_idx on public.failure_analyses(test_result_id);

create table if not exists public.bug_references (
  id uuid primary key default gen_random_uuid(),
  failure_analysis_id uuid not null references public.failure_analyses(id) on delete cascade,
  external_bug_id text not null,
  external_bug_url text,
  cached_status text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bug_references_failure_analysis_id_idx on public.bug_references(failure_analysis_id);
create index if not exists bug_references_external_bug_id_idx on public.bug_references(external_bug_id);

-- Row Level Security: every table scoped to authenticated users for V1.
-- (Project-level sharing/roles is out of scope per the V1 design; all
-- authenticated users can see all projects for now.)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_credentials enable row level security;
alter table public.requirements enable row level security;
alter table public.test_cases enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_results enable row level security;
alter table public.failure_analyses enable row level security;
alter table public.bug_references enable row level security;

create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "self insert profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "self update profile" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "authenticated full access projects" on public.projects for all to authenticated using (true) with check (true);
create policy "authenticated full access project_credentials" on public.project_credentials for all to authenticated using (true) with check (true);
create policy "authenticated full access requirements" on public.requirements for all to authenticated using (true) with check (true);
create policy "authenticated full access test_cases" on public.test_cases for all to authenticated using (true) with check (true);
create policy "authenticated full access test_runs" on public.test_runs for all to authenticated using (true) with check (true);
create policy "authenticated full access test_results" on public.test_results for all to authenticated using (true) with check (true);
create policy "authenticated full access failure_analyses" on public.failure_analyses for all to authenticated using (true) with check (true);
create policy "authenticated full access bug_references" on public.bug_references for all to authenticated using (true) with check (true);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
