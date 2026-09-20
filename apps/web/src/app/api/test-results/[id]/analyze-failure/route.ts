import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runFailureAnalysis, syncBugForAnalysis } from '@/lib/pipeline';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: testResult, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !testResult) {
    return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
  }
  if (testResult.status !== 'failed' && testResult.status !== 'error') {
    return NextResponse.json({ error: 'Only failed/errored results can be analyzed' }, { status: 400 });
  }

  const analysis = await runFailureAnalysis(supabase, testResult);
  if (!analysis) {
    return NextResponse.json(
      { error: 'Analysis failed — check ANTHROPIC_API_KEY is set on the server.' },
      { status: 503 },
    );
  }

  const bugRef = await syncBugForAnalysis(supabase, analysis, testResult);

  return NextResponse.json({ analysis, bugReference: bugRef }, { status: 201 });
}
