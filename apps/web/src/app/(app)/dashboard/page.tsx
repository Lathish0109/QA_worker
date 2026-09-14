import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  const stats = [
    { label: 'Projects', value: projectCount ?? 0 },
    { label: 'Test Runs Today', value: '—', note: 'wired up in Milestone 3' },
    { label: 'AI Root-Cause Accuracy', value: '—', note: 'wired up in Milestone 4' },
    { label: 'Bugs Synced to ICore', value: '—', note: 'wired up in Milestone 5' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          QA Operations
        </div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {stat.label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
            {stat.note && <div className="mt-1 text-xs text-muted">{stat.note}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold">Getting started</h2>
        <p className="mt-2 text-sm text-muted">
          Create a project to give the AI Test Generator a target site, then add a
          requirement to generate your first set of test cases.
        </p>
        <Link
          href="/projects"
          className="mt-4 inline-block rounded bg-accent px-3 py-2 text-sm font-medium text-background transition hover:bg-accent-dim"
        >
          Go to Projects
        </Link>
      </div>
    </div>
  );
}
