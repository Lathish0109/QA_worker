import { createClient } from '@/lib/supabase/server';

const STATUS_STYLES: Record<string, string> = {
  queued: 'text-muted border-border',
  running: 'text-blue-300 border-blue-400/30',
  passed: 'text-accent border-accent/30',
  failed: 'text-danger border-danger/30',
  partial: 'text-warning border-warning/30',
  error: 'text-danger border-danger/30',
};

export default async function TestRunsPage() {
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from('test_runs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Execution
          </div>
          <h1 className="text-xl font-semibold">Test Runs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Playwright execution isn&rsquo;t built yet (Milestone 3) — this page will show live
            and historical runs of your approved test cases once the execution worker exists.
          </p>
        </div>
        <button
          disabled
          title="Execution engine arrives in Milestone 3"
          className="shrink-0 whitespace-nowrap rounded bg-accent/30 px-3 py-2 text-sm font-medium text-background/60"
        >
          Trigger Test Run
        </button>
      </div>

      {(!runs || runs.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No test runs yet. Approve some test cases in the{' '}
          <a href="/test-generator" className="text-accent hover:underline">
            AI Test Generator
          </a>{' '}
          — once the execution engine ships, runs triggered from approved test cases will show
          up here with pass/fail status per test case.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {runs?.map((run) => (
          <div key={run.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">Run {run.id.slice(0, 8)}</span>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[run.status]}`}
              >
                {run.status}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-muted">
              Created {new Date(run.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
