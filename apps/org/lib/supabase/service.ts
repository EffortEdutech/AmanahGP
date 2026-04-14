// apps/org/lib/supabase/service.ts
// amanahOS — Supabase service-role client
//
// ⚠️  SERVER-SIDE ONLY. Never import in browser ('use client') code.
// ⚠️  Bypasses RLS entirely. Use only for privileged admin operations.
//
// Current uses:
//   - Reading org membership to verify org_admin access in server actions
//   - Writing trust events on behalf of org actions
//   - Generating compliance reports that span multiple tenant boundaries

import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[amanahOS] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Ensure .env.local is configured and SUPABASE_SERVICE_ROLE_KEY is not prefixed with NEXT_PUBLIC_.'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
