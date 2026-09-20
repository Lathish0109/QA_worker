import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signEvidenceUrl } from '@/lib/evidence';

const STATUS_STYLES: Record<string, string> = {
  queued: 'text-muted border-border',
  running: 'text-blue-300 border-blue-400/30',
  passed: 'text-accent border-accent/30',
  failed: 'text-danger border-danger/30',
  partial: 'text-warning border-warning/30',
  error: 'text-danger border-danger/30',
  skipped: 'text-muted border-border',
};

export default async function TestRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: testRun } = await supabase.from('test_runs').select('*').eq('id', id).single();
  if (!testRun) {
    notFound();
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, base_url')
    .eq('id', testRun.project_id)
    .single();

  const { data: results } = await supabase
    .from('test_results')
    .select('*')
    .eq('test_run_id', id)
    .order('created_at', { ascending: true });

  const testCaseIds = (results ?? []).map((r) => r.test_case_id);
  const { data: testCases } = testCaseIds.length
    ? await supabase.from('test_cases').select('id, title').in('id', testCaseIds)
    : { data: [] };
  const titleById = new Map((testCases ?? []).map((tc) => [tc.id, tc.title]));

  const resultsWithEvidence = await Promise.all(
    (results ?? []).map(async (r) => ({
      ...r,
      screenshotSignedUrl: await signEvidenceUrl(r.screenshot_url),
      traceSignedUrl: await signEvidenceUrl(r.trace_url),
      consoleLogSignedUrl: await signEvidenceUrl(r.console_log_url),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          <Link href="/test-runs" className="hover:text-foreground">
            Test Runs
          </Link>
          {' / '}
          {project?.name ?? 'Unknown project'}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Run {testRun.id.slice(0, 8)}</h1>
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[testRun.status]}`}
          >
            {testRun.status}
          </span>
        </div>
        <div className="mt-1 font-mono text-xs text-muted">{project?.base_url}</div>
      </div>

      <div className="flex flex-col gap-3">
        {resultsWithEvidence.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[r.status]}`}
                >
                  {r.status}
                </span>
                <h3 className="mt-2 text-sm font-semibold">
                  {titleById.get(r.test_case_id) ?? r.test_case_id}
                </h3>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">{r.duration_ms}ms</span>
            </div>

            {r.error_message && (
              <p className="mt-2 rounded border border-danger/30 bg-danger/5 p-2 text-xs text-danger">
                {r.error_message}
              </p>
            )}

            {(r.screenshotSignedUrl || r.traceSignedUrl || r.consoleLogSignedUrl) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {r.screenshotSignedUrl && (
                  <a
                    href={r.screenshotSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Screenshot →
                  </a>
                )}
                {r.traceSignedUrl && (
                  <a
                    href={r.traceSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Trace →
                  </a>
                )}
                {r.consoleLogSignedUrl && (
                  <a
                    href={r.consoleLogSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    Console log →
                  </a>
                )}
              </div>
            )}

            {r.screenshotSignedUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.screenshotSignedUrl}
                alt={`Failure screenshot for ${titleById.get(r.test_case_id) ?? 'test case'}`}
                className="mt-3 max-w-full rounded border border-border"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
