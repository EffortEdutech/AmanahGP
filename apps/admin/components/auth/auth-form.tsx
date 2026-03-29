'use client';
// apps/admin/components/auth/auth-form.tsx
// AmanahHub Console — Generic auth form wrapper
// Handles useActionState, loading state, error/success display

import { useActionState, useEffect, useRef } from 'react';

interface AuthFormProps {
  action:          (state: any, formData: FormData) => Promise<any>;
  submitLabel:     string;
  successMessage?: string;
  children:        React.ReactNode;
}

const initialState = { error: undefined, success: undefined };

export function AuthForm({ action, submitLabel, successMessage, children }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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

      {children}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md
                   shadow-sm text-sm font-medium text-white bg-emerald-700
                   hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2
                   focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed
                   transition-colors"
      >
        {isPending ? 'Please wait…' : submitLabel}
      </button>
    </form>
  );
}
