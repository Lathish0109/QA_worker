-- Wrap auth.uid() in a (select ...) so Postgres evaluates it once per
-- query instead of once per row (Supabase RLS performance lint 0003).
drop policy "self insert profile" on public.profiles;
create policy "self insert profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy "self update profile" on public.profiles;
create policy "self update profile" on public.profiles for update to authenticated using ((select auth.uid()) = id);
