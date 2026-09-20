'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function TriggerRunForm({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger() {
    setError(null);
    setLoading(true);

    const res = await fetch('/api/test-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to trigger test run');
      return;
    }

    const body = await res.json();
    router.push(`/test-runs/${body.testRun.id}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-muted">Project</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleTrigger}
          disabled={loading || !projectId}
          className="whitespace-nowrap rounded bg-accent px-3 py-2 text-sm font-medium text-background transition hover:bg-accent-dim disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Approved Tests'}
        </button>
        {error && <p className="max-w-xs text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
