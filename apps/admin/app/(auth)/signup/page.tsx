// apps/admin/app/(auth)/signup/page.tsx
// AmanahHub Console — Sign Up page

import { signUp }   from '../actions';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthCard } from '@/components/auth/auth-card';

export const metadata = {
  title: 'Create Account | AmanahHub Console',
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Register to manage your organization on Amanah Governance Platform."
    >
      <AuthForm
        action={signUp}
        submitLabel="Create Account"
        successMessage="Check your email to confirm your account, then sign in."
      >
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Your name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                       focus:ring-emerald-500"
            placeholder="Full name"
          />
        </div>

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
                       shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                       focus:ring-emerald-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                       focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Min. 8 characters, one uppercase letter, one number.
          </p>
        </div>
      </AuthForm>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
          Sign in
        </a>
      </p>
    </AuthCard>
  );
}
