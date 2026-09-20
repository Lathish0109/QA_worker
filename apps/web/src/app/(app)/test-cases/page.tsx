import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const TYPE_STYLES: Record<string, string> = {
  positive: 'bg-accent/10 text-accent',
  negative: 'bg-danger/10 text-danger',
  edge: 'bg-warning/10 text-warning',
  validation: 'bg-blue-400/10 text-blue-300',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-warning border-warning/30',
  approved: 'text-accent border-accent/30',
  rejected: 'text-danger border-danger/30',
};

export default async function TestSuitesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  const { data: projects } = await supabase.from('projects').select('id, name');
  const { data: requirements } = await supabase.from('requirements').select('id, text');

  const validStatus =
    status === 'draft' || status === 'approved' || status === 'rejected' ? status : undefined;
  let query = supabase.from('test_cases').select('*').order('created_at', { ascending: false });
  if (validStatus) {
    query = query.eq('status', validStatus);
  }
  const { data: testCases } = await query;

  const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const requirementTextById = new Map((requirements ?? []).map((r) => [r.id, r.text]));

  const tabs = [
    { key: undefined, label: 'All' },
    { key: 'draft', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Test Management
        </div>
        <h1 className="text-xl font-semibold">Test Suites & Cases</h1>
        <p className="mt-1 text-sm text-muted">
          Every AI-generated and human-authored test case across every project.
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = (status ?? undefined) === tab.key;
          const href = tab.key ? `/test-cases?status=${tab.key}` : '/test-cases';
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded border px-3 py-1.5 text-xs transition ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {testCases && testCases.length === 0 && (
          <p className="text-sm text-muted">No test cases match this filter.</p>
        )}
        {testCases?.map((tc) => (
          <Link
            key={tc.id}
            href={`/projects/${tc.project_id}/requirements/${tc.requirement_id}`}
            className="rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${TYPE_STYLES[tc.type] ?? 'bg-muted/10 text-muted'}`}
              >
                {tc.type}
              </span>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[tc.status]}`}
              >
                {tc.status}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {projectNameById.get(tc.project_id) ?? 'Unknown project'}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold">{tc.title}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-muted">
              {requirementTextById.get(tc.requirement_id) ?? ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
