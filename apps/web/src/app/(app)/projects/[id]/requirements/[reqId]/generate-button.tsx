'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateButton({
  requirementId,
  hasExisting,
}: {
  requirementId: string;
  hasExisting: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/requirements/${requirementId}/generate-test-cases`, {
      method: 'POST',
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to generate test cases');
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="whitespace-nowrap rounded bg-accent px-3 py-2 text-sm font-medium text-background transition hover:bg-accent-dim disabled:opacity-50"
      >
        {loading
          ? 'Generating…'
          : hasExisting
            ? 'Regenerate Test Cases'
            : 'Generate Test Cases'}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
