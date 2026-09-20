import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const CONFIDENCE_STYLES: Record<string, string> = {
  low: 'text-muted border-border',
  medium: 'text-warning border-warning/30',
  high: 'text-accent border-accent/30',
};

export default async function FailureAnalyzerPage() {
  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from('failure_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  const resultIds = (analyses ?? []).map((a) => a.test_result_id);
  const { data: results } = resultIds.length
    ? await supabase.from('test_results').select('id, test_run_id, test_case_id').in('id', resultIds)
    : { data: [] };
  const resultById = new Map((results ?? []).map((r) => [r.id, r]));

  const testCaseIds = (results ?? []).map((r) => r.test_case_id);
  const { data: testCases } = testCaseIds.length
    ? await supabase.from('test_cases').select('id, title').in('id', testCaseIds)
    : { data: [] };
  const titleByTestCaseId = new Map((testCases ?? []).map((tc) => [tc.id, tc.title]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          AI Diagnostics
        </div>
        <h1 className="text-xl font-semibold">Failure Analyzer</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Every AI analysis of a failed test case. Confirmed evidence (error message, screenshot,
          console log) is kept separate from the root-cause hypothesis, which is always labeled a
          hypothesis — never stated as confirmed fact.
        </p>
      </div>

      {(!analyses || analyses.length === 0) && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
          No failures analyzed yet. Trigger a{' '}
          <Link href="/test-runs" className="text-accent hover:underline">
            test run
          </Link>{' '}
          — any failures are analyzed automatically (or trigger analysis manually from the run
          if <code className="text-foreground">ANTHROPIC_API_KEY</code> wasn&rsquo;t set yet).
        </div>
      )}

      <div className="flex flex-col gap-3">
        {analyses?.map((a) => {
          const result = resultById.get(a.test_result_id);
          return (
            <Link
              key={a.id}
              href={result ? `/test-runs/${result.test_run_id}` : '/test-runs'}
              className="block rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${CONFIDENCE_STYLES[a.confidence_level ?? 'low']}`}
                >
                  {a.confidence_level ?? 'unknown'} confidence
                </span>
                {a.error_category && (
                  <span className="font-mono text-[10px] text-muted">{a.error_category}</span>
                )}
                {result && (
                  <span className="font-mono text-[10px] text-muted">
                    {titleByTestCaseId.get(result.test_case_id) ?? result.test_case_id}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold">{a.summary}</h3>
              {a.root_cause_hypothesis && (
                <p className="mt-1 text-xs text-muted">
                  <span className="text-warning">Hypothesis: </span>
                  {a.root_cause_hypothesis}
                </p>
              )}
              <div className="mt-2 flex gap-3 font-mono text-[10px] uppercase tracking-wide text-muted">
                <span>Severity: {a.suggested_severity}</span>
                <span>Priority: {a.suggested_priority}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
