'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AnalyzeFailureButton({ testResultId }: { testResultId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/test-results/${testResultId}/analyze-failure`, {
      method: 'POST',
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to analyze');
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded border border-accent/30 px-3 py-1.5 text-xs text-accent transition hover:bg-accent/10 disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Analyze Failure with AI'}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
