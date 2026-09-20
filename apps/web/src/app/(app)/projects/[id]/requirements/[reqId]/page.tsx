import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GenerateButton } from './generate-button';
import { TestCaseCard } from './test-case-card';

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string; reqId: string }>;
}) {
  const { id: projectId, reqId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  const { data: requirement } = await supabase
    .from('requirements')
    .select('*')
    .eq('id', reqId)
    .single();

  if (!project || !requirement) {
    notFound();
  }

  const { data: testCases } = await supabase
    .from('test_cases')
    .select('*')
    .eq('requirement_id', reqId)
    .order('created_at', { ascending: true });

  const draftCount = testCases?.filter((tc) => tc.status === 'draft').length ?? 0;
  const approvedCount = testCases?.filter((tc) => tc.status === 'approved').length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
          {' / '}
          <Link href={`/projects/${project.id}`} className="hover:text-foreground">
            {project.name}
          </Link>
          {' / Requirement'}
        </div>
        <h1 className="text-xl font-semibold">AI Test Generator</h1>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Requirement
            </div>
            <p className="mt-1 max-w-2xl text-sm">{requirement.text}</p>
            <div className="mt-2 font-mono text-xs text-muted">Target: {project.base_url}</div>
          </div>
          <GenerateButton requirementId={requirement.id} hasExisting={(testCases?.length ?? 0) > 0} />
        </div>
      </div>

      {testCases && testCases.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{testCases.length} total</span>
          <span className="text-warning">{draftCount} pending review</span>
          <span className="text-accent">{approvedCount} approved</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {(!testCases || testCases.length === 0) && (
          <p className="text-sm text-muted">
            No test cases yet — click &ldquo;Generate Test Cases&rdquo; above to have the AI draft
            positive, negative, edge, and validation scenarios from this requirement.
          </p>
        )}
        {testCases?.map((tc) => (
          <TestCaseCard key={tc.id} testCase={tc} />
        ))}
      </div>
    </div>
  );
}
