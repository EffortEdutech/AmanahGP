'use client';
// apps/user/components/auth/user-auth-form.tsx

import { useActionState } from 'react';

interface Props {
  action:      (state: any, formData: FormData) => Promise<any>;
  submitLabel: string;
  next?:       string;
  showName?:   boolean;
  successMessage?: string;
}

const initial = { error: undefined, success: undefined };

export function UserAuthForm({ action, submitLabel, next, showName, successMessage }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);

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
          <input id="displayName" name="displayName" type="text"
            className={inputCls} placeholder="Full name" />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email"
          className={inputCls} placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input id="password" name="password" type="password" required
          autoComplete={showName ? 'new-password' : 'current-password'}
          className={inputCls} />
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-2.5 rounded-md text-sm font-medium text-white
                   bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
        {isPending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}

const inputCls = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
  shadow-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none
  focus:ring-1 focus:ring-emerald-500`;
