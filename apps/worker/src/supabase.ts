import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the worker.');
}

export const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function uploadEvidence(
  path: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage.from('evidence').upload(path, data, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Failed to upload evidence to ${path}: ${error.message}`);
  }
  return path;
}
