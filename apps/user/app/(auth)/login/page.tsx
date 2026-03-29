// apps/user/app/(auth)/login/page.tsx
// AmanahHub — Donor sign in page

import { signIn } from '../actions';
import { UserAuthForm } from '@/components/auth/user-auth-form';

export const metadata = { title: 'Sign In | AmanahHub' };

interface Props { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                          bg-emerald-700 text-white text-lg font-bold mb-4">A</div>
          <h1 className="text-xl font-semibold text-gray-900">Sign in to AmanahHub</h1>
          <p className="mt-1 text-sm text-gray-500">Track your donations and giving history.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-7 py-7">
          <UserAuthForm action={signIn} submitLabel="Sign In" next={next} />

          <p className="mt-5 text-center text-sm text-gray-500">
            No account?{' '}
            <a href="/signup" className="font-medium text-emerald-700 hover:text-emerald-800">
              Create one
            </a>
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            You can also{' '}
            <a href="/charities" className="underline">browse charities</a>
            {' '}and donate without signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
