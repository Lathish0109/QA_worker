import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewRequirementForm } from './new-requirement-form';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
  if (!project) {
    notFound();
  }

  const { data: requirements } = await supabase
    .from('requirements')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const { data: testCases } = await supabase
    .from('test_cases')
    .select('requirement_id, status')
    .eq('project_id', id);

  const testCaseCounts = new Map<string, { total: number; approved: number }>();
  for (const tc of testCases ?? []) {
    const entry = testCaseCounts.get(tc.requirement_id) ?? { total: 0, approved: 0 };
    entry.total += 1;
    if (tc.status === 'approved') entry.approved += 1;
    testCaseCounts.set(tc.requirement_id, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Projects / {project.name}
        </div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <div className="mt-1 font-mono text-xs text-muted">{project.base_url}</div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold">Requirements</h2>
        <p className="mt-1 text-xs text-muted">
          Add a plain-language requirement, then open it to generate AI test cases and
          review/approve them.
        </p>

        <div className="mt-4">
          <NewRequirementForm projectId={project.id} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {requirements && requirements.length === 0 && (
            <p className="text-sm text-muted">No requirements yet.</p>
          )}
          {requirements?.map((req) => {
            const counts = testCaseCounts.get(req.id);
            return (
              <Link
                key={req.id}
                href={`/projects/${project.id}/requirements/${req.id}`}
                className="block rounded border border-border bg-surface-raised p-3 transition hover:border-accent"
              >
                <p className="text-sm">{req.text}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                  <span>Added {new Date(req.created_at).toLocaleString()}</span>
                  {counts && (
                    <span className="text-accent">
                      {counts.approved}/{counts.total} test cases approved
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
