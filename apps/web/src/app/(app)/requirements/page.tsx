import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NewRequirementForm } from './new-requirement-form';

export default async function RequirementsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  const { data: requirements } = await supabase
    .from('requirements')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: testCases } = await supabase.from('test_cases').select('requirement_id, status');

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const testCaseCounts = new Map<string, { total: number; approved: number; draft: number }>();
  for (const tc of testCases ?? []) {
    const entry = testCaseCounts.get(tc.requirement_id) ?? { total: 0, approved: 0, draft: 0 };
    entry.total += 1;
    if (tc.status === 'approved') entry.approved += 1;
    if (tc.status === 'draft') entry.draft += 1;
    testCaseCounts.set(tc.requirement_id, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Input Pipeline
        </div>
        <h1 className="text-xl font-semibold">Requirements & Specs</h1>
        <p className="mt-1 text-sm text-muted">
          Every requirement across every project, and how far each one has gotten through AI
          test generation and review.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold">Add a requirement</h2>
        {projects && projects.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            You need a project first —{' '}
            <Link href="/projects" className="text-accent hover:underline">
              create one
            </Link>
            , then come back here.
          </p>
        ) : (
          <div className="mt-4">
            <NewRequirementForm projects={projects ?? []} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {requirements && requirements.length === 0 && (
          <p className="text-sm text-muted">No requirements yet.</p>
        )}
        {requirements?.map((req) => {
          const counts = testCaseCounts.get(req.id);
          const projectName = projectNameById.get(req.project_id) ?? 'Unknown project';
          return (
            <Link
              key={req.id}
              href={`/projects/${req.project_id}/requirements/${req.id}`}
              className="rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {projectName}
                  </span>
                  <p className="mt-1 text-sm">{req.text}</p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  {counts ? (
                    <>
                      <div className="text-accent">{counts.approved} approved</div>
                      {counts.draft > 0 && (
                        <div className="text-warning">{counts.draft} pending</div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted">No test cases yet</div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted">
                Added {new Date(req.created_at).toLocaleString()}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
