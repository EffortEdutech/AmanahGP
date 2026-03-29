// apps/admin/lib/supabase/client.ts
// AmanahHub Console — Supabase browser client
// Use this in Client Components only

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/supabase/types/supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
