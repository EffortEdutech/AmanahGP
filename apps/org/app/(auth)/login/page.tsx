// apps/org/app/(auth)/login/page.tsx
// amanahOS — Login page
// Organisation members sign in here to access their governance workspace.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Sign in — amanahOS',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const params = await searchParams;

  // Already authenticated → go to dashboard
  if (user) redirect(params.next ?? '/dashboard');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">OS</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">amanahOS</h1>
          </div>
          <p className="text-sm text-gray-500">Governance Workspace</p>
          <p className="text-[11px] text-gray-400">Amanah Governance Platform</p>
        </div>

        {/* Error message */}
        {params.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        {/* Login form */}
        <LoginForm next={params.next} />

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">
            This workspace is for organisation members only.
          </p>
          <p className="text-xs text-gray-400">
            Reviewers and platform admins use{' '}
            <a
              href={process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#'}
              className="text-emerald-600 hover:underline"
            >
              AmanahHub Console
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
