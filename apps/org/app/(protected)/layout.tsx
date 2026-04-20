// apps/org/app/(protected)/layout.tsx
// amanahOS — Protected layout (auth guard only)
// OrgShell is now rendered by the inner /org/[orgId]/layout.tsx.
// This layout just ensures the user is authenticated before reaching any protected route.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  return <>{children}</>;
}
