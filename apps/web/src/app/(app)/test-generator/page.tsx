import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function TestGeneratorPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase.from('projects').select('id, name, base_url');
  const { data: requirements } = await supabase
    .from('requirements')
    .select('*')
    .order('created_at', { ascending: false });
  const { data: testCases } = await supabase.from('test_cases').select('requirement_id, status');

  const projectById = new Map((projects ?? []).map((p) => [p.id, p]));
  const counts = new Map<string, { total: number; draft: number; approved: number; rejected: number }>();
  for (const tc of testCases ?? []) {
    const entry = counts.get(tc.requirement_id) ?? { total: 0, draft: 0, approved: 0, rejected: 0 };
    entry.total += 1;
    entry[tc.status as 'draft' | 'approved' | 'rejected'] += 1;
    counts.set(tc.requirement_id, entry);
  }

  const rows = (requirements ?? []).map((req) => ({
    req,
    project: projectById.get(req.project_id),
    counts: counts.get(req.id) ?? { total: 0, draft: 0, approved: 0, rejected: 0 },
  }));

  // Needs attention first: nothing generated yet, then pending review, then fully approved.
  rows.sort((a, b) => {
    const rank = (c: typeof a.counts) => (c.total === 0 ? 0 : c.draft > 0 ? 1 : 2);
    return rank(a.counts) - rank(b.counts);
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Human-in-the-Loop Review Gate
        </div>
        <h1 className="text-xl font-semibold">AI Test Generator</h1>
        <p className="mt-1 text-sm text-muted">
          Every requirement, ranked by what still needs generation or review. AI-generated test
          cases never execute until a human approves them here.
        </p>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-muted">
          No requirements yet — add one from a{' '}
          <Link href="/projects" className="text-accent hover:underline">
            project
          </Link>{' '}
          to get started.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {rows.map(({ req, project, counts }) => (
          <Link
            key={req.id}
            href={`/projects/${req.project_id}/requirements/${req.id}`}
            className="rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {project?.name ?? 'Unknown project'}
                </span>
                <p className="mt-1 max-w-2xl text-sm">{req.text}</p>
                <div className="mt-1 font-mono text-[11px] text-muted">{project?.base_url}</div>
              </div>
              <div className="shrink-0">
                {counts.total === 0 ? (
                  <span className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                    Not generated
                  </span>
                ) : counts.draft > 0 ? (
                  <span className="rounded border border-warning/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-warning">
                    {counts.draft} pending review
                  </span>
                ) : (
                  <span className="rounded border border-accent/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
                    {counts.approved}/{counts.total} approved
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
