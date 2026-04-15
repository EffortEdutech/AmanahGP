'use client';
// apps/org/app/invite/[token]/invite-accept-form.tsx
// Sprint 28 — Client form for accepting invitation
//
// Three states:
//   1. isCorrectUser = true → one-click accept (already signed in as invited email)
//   2. isLoggedIn = true (wrong email) → show who they're logged in as, offer to continue
//   3. isLoggedIn = false → tabs: Sign in | Create account

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';
import { createClient }            from '@/lib/supabase/client';

interface Props {
  token:            string;
  invitationId:     string;
  orgId:            string;
  orgName:          string;
  orgRole:          string;
  invitedEmail:     string;
  isLoggedIn:       boolean;
  isCorrectUser:    boolean;
  currentUserEmail: string | null;
}

type Tab = 'signin' | 'signup';

const inputCls = `w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[13px]
                  focus:outline-none focus:ring-2 focus:ring-emerald-500`;

export function InviteAcceptForm({
  token, invitationId, orgId, orgName, orgRole, invitedEmail,
  isLoggedIn, isCorrectUser, currentUserEmail,
}: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [tab,       setTab]       = useState<Tab>('signin');
  const [email,     setEmail]     = useState(invitedEmail);
  const [password,  setPassword]  = useState('');
  const [fullName,  setFullName]  = useState('');
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  // Call server-side accept API after auth
  async function acceptInvitation() {
    const res  = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, invitationId, orgId, orgRole }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error ?? 'Failed to accept invitation');
  }

  // Path A — already signed in as correct user
  async function handleDirectAccept() {
    setError('');
    startTransition(async () => {
      try {
        await acceptInvitation();
        router.push('/dashboard?welcome=1');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to accept');
      }
    });
  }

  // Path B — sign in then accept
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault(); setError('');
    startTransition(async () => {
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message);
        await acceptInvitation();
        router.push('/dashboard?welcome=1');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
      }
    });
  }

  // Path C — create account then accept
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    startTransition(async () => {
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw new Error(signUpError.message);
        if (!signUpData.user) throw new Error('Account creation failed');

        // Small wait for DB trigger to create public.users record
        await new Promise((r) => setTimeout(r, 800));

        await acceptInvitation();
        router.push('/dashboard?welcome=1');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
      }
    });
  }

  // ── State A: Correct user already logged in ──────────────
  if (isCorrectUser) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <span className="text-emerald-500 text-lg">✓</span>
          <div>
            <p className="text-[12px] font-semibold text-emerald-800">Signed in as {currentUserEmail}</p>
            <p className="text-[11px] text-emerald-700">This matches your invitation — ready to accept.</p>
          </div>
        </div>
        {error && <p className="text-[12px] text-red-700 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}
        <button type="button" disabled={isPending} onClick={handleDirectAccept}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-bold rounded-xl transition-colors disabled:opacity-40">
          {isPending ? 'Joining…' : `✓ Join ${orgName}`}
        </button>
      </div>
    );
  }

  // ── State B: Logged in as a different user ───────────────
  if (isLoggedIn && !isCorrectUser) {
    return (
      <div className="rounded-xl border border-amber-200 bg-white p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-[12px] font-semibold text-amber-800">
            You're signed in as {currentUserEmail}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            This invitation is for <strong>{invitedEmail}</strong>.
            You can still accept — your account will be added if it matches, or sign in as the invited email.
          </p>
        </div>
        {error && <p className="text-[12px] text-red-700 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}
        <button type="button" disabled={isPending} onClick={handleDirectAccept}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-bold rounded-xl transition-colors disabled:opacity-40">
          {isPending ? 'Joining…' : `Accept invitation`}
        </button>
        <a href="/login" className="block text-center text-[12px] text-gray-500 hover:text-gray-700">
          Sign in as a different account →
        </a>
      </div>
    );
  }

  // ── State C: Not logged in — sign in or sign up ──────────
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['signin', 'signup'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setError(''); }}
            className={`flex-1 py-3 text-[12px] font-semibold transition-colors ${
              tab === t
                ? 'text-emerald-700 border-b-2 border-emerald-600 -mb-px bg-white'
                : 'text-gray-500 hover:text-gray-700 bg-gray-50'
            }`}>
            {t === 'signin' ? 'Sign in to accept' : 'Create new account'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Email</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Password</label>
              <input type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={inputCls} />
            </div>
            {error && (
              <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}
            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-bold rounded-xl transition-colors disabled:opacity-40">
              {isPending ? 'Signing in & joining…' : `Sign in and join ${orgName}`}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-blue-700">
                Creating an account for <strong>{invitedEmail}</strong>.
                Use the invited email address.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Email</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls} />
              {email.toLowerCase() !== invitedEmail.toLowerCase() && (
                <p className="text-[10px] text-amber-600 mt-1">
                  ⚠ This differs from the invited email ({invitedEmail})
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input type="password" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputCls} />
            </div>
            {error && (
              <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}
            <button type="submit" disabled={isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-bold rounded-xl transition-colors disabled:opacity-40">
              {isPending ? 'Creating account & joining…' : `Create account and join ${orgName}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
