// apps/org/lib/supabase/server.ts
// amanahOS — Supabase server client
// Use in Server Components, Server Actions, and API Route Handlers.
// Reads session cookies; respects RLS as the authenticated user.

import { createServerClient } from '@supabase/ssr';

type ServerCookieToSet = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];
};
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: ServerCookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies cannot be set.
            // Middleware handles session refresh.
          }
        },
      },
    }
  );
}
