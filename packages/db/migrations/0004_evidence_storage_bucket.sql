-- Private Storage bucket for Playwright failure evidence (screenshots,
-- traces, console logs). Only the worker (service role key) writes to it;
-- the web app reads via signed URLs generated server-side.
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

create policy "authenticated read evidence" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence');
