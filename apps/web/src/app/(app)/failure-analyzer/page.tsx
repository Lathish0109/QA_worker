import { createClient } from '@/lib/supabase/server';

export default async function FailureAnalyzerPage() {
  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from('failure_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          AI Diagnostics
        </div>
        <h1 className="text-xl font-semibold">Failure Analyzer</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Not built yet (Milestone 4). Once test execution exists, a failed test&rsquo;s
          screenshot, console logs, and trace will feed the AI here — producing a summary,
          expected vs. actual behavior, and a root-cause hypothesis that&rsquo;s always labeled
          as a hypothesis, never asserted as confirmed fact.
        </p>
      </div>

      {(!analyses || analyses.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No failures analyzed yet — this fills in automatically once Test Runs (Milestone 3)
          and this analyzer (Milestone 4) are built.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {analyses?.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="rounded border border-warning/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warning">
                {a.confidence_level ?? 'unknown'} confidence
              </span>
              {a.error_category && (
                <span className="font-mono text-[10px] text-muted">{a.error_category}</span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-semibold">{a.summary}</h3>
            {a.root_cause_hypothesis && (
              <p className="mt-1 text-xs text-muted">
                <span className="text-warning">Hypothesis: </span>
                {a.root_cause_hypothesis}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
