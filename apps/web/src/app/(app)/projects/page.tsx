import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NewProjectForm } from './new-project-form';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Workspace
          </div>
          <h1 className="text-xl font-semibold">Projects</h1>
        </div>
      </div>

      <NewProjectForm />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {projects && projects.length === 0 && (
        <p className="text-sm text-muted">No projects yet — create one above to get started.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
          >
            <div className="text-sm font-semibold">{project.name}</div>
            <div className="mt-1 truncate font-mono text-xs text-muted">{project.base_url}</div>
            <div className="mt-3 text-[11px] text-muted">
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
