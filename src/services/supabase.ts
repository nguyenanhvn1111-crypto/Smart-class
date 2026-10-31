import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(urlString: string): boolean {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'your-project.supabase.co' ||
      host.includes('placeholder') ||
      host.includes('example') ||
      host.includes('your-project')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(rawUrl) &&
  rawKey &&
  rawKey !== 'your-anon-key-here' &&
  !rawKey.includes('placeholder')
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(rawUrl, rawKey);
  } catch (err) {
    console.warn('Supabase initialization skipped: invalid configuration', err);
    client = null;
  }
}

export const supabase: SupabaseClient | null = client;
