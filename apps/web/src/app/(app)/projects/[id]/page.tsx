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
          Add a plain-language requirement here. AI test case generation from a
          requirement lands in Milestone 2.
        </p>

        <div className="mt-4">
          <NewRequirementForm projectId={project.id} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {requirements && requirements.length === 0 && (
            <p className="text-sm text-muted">No requirements yet.</p>
          )}
          {requirements?.map((req) => (
            <div key={req.id} className="rounded border border-border bg-surface-raised p-3">
              <p className="text-sm">{req.text}</p>
              <div className="mt-2 text-[11px] text-muted">
                Added {new Date(req.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
