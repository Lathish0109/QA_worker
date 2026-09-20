import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type { Database, Json } from './types';
export { encryptSecret, decryptSecret } from './crypto';

/**
 * Server-only client using the service role key. Never import this from
 * client components — it bypasses Row Level Security.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (server-side only).');
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
