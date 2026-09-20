'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CredentialRow {
  id: string;
  label: string;
  username: string;
  created_at: string;
}

export function CredentialsSection({
  projectId,
  credentials,
}: {
  projectId: string;
  credentials: CredentialRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to add credential');
      return;
    }

    setLabel('');
    setUsername('');
    setPassword('');
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold">Login Credentials</h2>
      <p className="mt-1 text-xs text-muted">
        Stored encrypted, only used by the Playwright worker to log in before running test
        steps that need an authenticated session. Never sent to the LLM.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {credentials.length === 0 && (
          <p className="text-sm text-muted">No credentials added yet.</p>
        )}
        {credentials.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded border border-border bg-surface-raised px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium">{c.label}</span>
              <span className="ml-2 font-mono text-xs text-muted">{c.username}</span>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-xs text-danger hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Label</span>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Primary test account"
              className="rounded border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Username / email</span>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-fit rounded bg-accent px-3 py-2 text-sm font-medium text-background hover:bg-accent-dim disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save credential'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-fit rounded border border-border px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
        >
          + Add credential
        </button>
      )}
    </div>
  );
}
