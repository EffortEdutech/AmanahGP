'use client';
// apps/user/app/(auth)/forgot-password/page.tsx
// AmanahHub — Forgot password page

import { useActionState } from 'react';
import { forgotPassword } from '../actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                          bg-emerald-700 text-white text-lg font-bold mb-4">A</div>
          <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 px-7 py-7">
          {state?.success ? (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              ✅ Check your email for a password reset link.
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input id="email" name="email" type="email" required
                  autoComplete="email"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                             shadow-sm placeholder-gray-400 focus:border-emerald-500
                             focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={isPending}
                className="w-full py-2.5 rounded-md text-sm font-medium text-white
                           bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
                {isPending ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <p className="mt-5 text-center text-sm text-gray-500">
            <a href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
