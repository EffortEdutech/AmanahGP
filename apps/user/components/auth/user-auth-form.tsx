'use client';
// apps/user/components/auth/user-auth-form.tsx

import { useActionState, useState } from 'react';

interface Props {
  action: (state: any, formData: FormData) => Promise<any>;
  submitLabel: string;
  next?: string;
  showName?: boolean;
  successMessage?: string;
}

const initial = { error: undefined, success: undefined };

export function UserAuthForm({ action, submitLabel, next, showName, successMessage }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && successMessage && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {showName && (
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Your name
          </label>
          <input id="displayName" name="displayName" type="text" className={inputCls} placeholder="Full name" />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete={showName ? 'new-password' : 'current-password'}
            className={`${inputCls} pr-11`}
          />

          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-emerald-700"
          >
            <PasswordEye open={showPassword} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-md text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}

function PasswordEye({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7A3 3 0 0 0 13.4 13.5" />
      <path d="M9.9 5.2A11.2 11.2 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.2 4.8" />
      <path d="M6.6 6.7C4.1 8.4 2.5 12 2.5 12S6 19 12 19c1.8 0 3.4-.4 4.8-1.1" />
    </svg>
  );
}

const inputCls = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
  shadow-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none
  focus:ring-1 focus:ring-emerald-500`;
