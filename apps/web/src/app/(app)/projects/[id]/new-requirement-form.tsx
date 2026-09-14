'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function NewRequirementForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}/requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to add requirement');
      return;
    }

    setText('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="As a registered shopper, I want to apply a promo code at checkout so that..."
        rows={3}
        className="rounded border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded bg-accent px-3 py-2 text-sm font-medium text-background transition hover:bg-accent-dim disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add requirement'}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
