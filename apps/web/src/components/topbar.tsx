'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Topbar({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex items-center justify-end border-b border-border bg-surface px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted">{email}</span>
        <button
          onClick={handleSignOut}
          className="rounded border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
