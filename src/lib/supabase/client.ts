// SINGLETON PATTERN IMPLEMENTED HERE
// Explanation: We create a single Supabase browser client instance
// that is reused across the entire client-side application.
// This prevents multiple GoTrue/Realtime connections and ensures
// consistent auth state everywhere.

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // === SINGLETON: Return existing instance if already created ===
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
