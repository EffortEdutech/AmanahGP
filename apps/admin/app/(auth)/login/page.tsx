// apps/admin/app/(auth)/login/page.tsx
// AmanahHub Console — Sign In page

import { signIn }           from '../actions';
import { AuthForm }         from '@/components/auth/auth-form';
import { AuthCard }         from '@/components/auth/auth-card';

interface Props {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export const metadata = {
  title: 'Sign In | AmanahHub Console',
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Welcome to AmanahHub Console"
      subtitle="Sign in to manage organizations, submissions, governance, and review workflows."
    >
      {params.error === 'auth_callback_failed' && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Authentication failed. Please try signing in again.
        </div>
      )}

      <AuthForm action={signIn} submitLabel="Sign In">
        {params.next && (
          <input type="hidden" name="next" value={params.next} />
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none
                       focus:ring-1 focus:ring-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <a href="/forgot-password" className="text-xs text-emerald-700 hover:text-emerald-800">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none
                       focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-gray-500">
        Need an account?{' '}
        <a href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
          Sign up
        </a>
      </p>

      <p className="mt-4 text-center text-xs text-gray-400">
        Part of{' '}
        <span className="font-medium text-gray-500">Amanah Governance Platform</span>
      </p>
    </AuthCard>
  );
}
