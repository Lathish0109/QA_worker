import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: testRun, error } = await supabase.from('test_runs').select('*').eq('id', id).single();
  if (error || !testRun) {
    return NextResponse.json({ error: error?.message ?? 'Test run not found' }, { status: 404 });
  }

  const { data: results } = await supabase
    .from('test_results')
    .select('*')
    .eq('test_run_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ testRun, results: results ?? [] });
}
