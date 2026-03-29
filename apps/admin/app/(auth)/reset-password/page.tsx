'use client';
// apps/admin/app/(auth)/reset-password/page.tsx
// AmanahHub Console — Reset password

import { useActionState } from 'react';
import { resetPassword }  from '../actions';
import { AuthCard }       from '@/components/auth/auth-card';

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);

  if (state?.success) {
    return (
      <AuthCard title="Password updated">
        <div className="text-center">
          <div className="text-3xl mb-3">✓</div>
          <p className="text-sm text-gray-500 mb-4">
            Your password has been updated. Sign in to continue.
          </p>
          <a href="/login"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                       text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
            Sign in
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a strong password for your AmanahHub Console account.">
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input id="password" name="password" type="password" required
            autoComplete="new-password" className={inp}
            placeholder="Min. 8 characters" />
          <p className="mt-1 text-xs text-gray-400">
            At least 8 characters, one uppercase letter, one number.
          </p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input id="confirmPassword" name="confirmPassword" type="password" required
            autoComplete="new-password" className={inp} />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full py-2.5 rounded-md text-sm font-medium text-white
                     bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
          {isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthCard>
  );
}

const inp = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
  placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;
