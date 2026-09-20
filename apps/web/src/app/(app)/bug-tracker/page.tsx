import { createClient } from '@/lib/supabase/server';

export default async function BugTrackerPage() {
  const supabase = await createClient();
  const { data: bugs } = await supabase
    .from('bug_references')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          ICore Integration
        </div>
        <h1 className="text-xl font-semibold">Bug Tracker</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Not built yet (Milestone 5). This system never owns bug data — once a failure is
          analyzed, a structured bug gets sent to your ICore Bug Tracker via API, and this page
          will show each synced bug&rsquo;s ID, link, and cached status. Bug status, assignment,
          and comments stay owned by ICore, not duplicated here.
        </p>
      </div>

      {(!bugs || bugs.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No bugs synced yet — this fills in automatically once Failure Analyzer (Milestone 4)
          and the ICore integration (Milestone 5) are built.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {bugs?.map((bug) => (
          <div key={bug.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{bug.external_bug_id}</span>
              {bug.cached_status && (
                <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                  {bug.cached_status}
                </span>
              )}
            </div>
            {bug.external_bug_url && (
              <a
                href={bug.external_bug_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-xs text-accent hover:underline"
              >
                View in ICore →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
