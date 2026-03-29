'use client';
// apps/user/components/account/accept-invite-button.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { token: string; orgId: string; }

export function AcceptInviteButton({ token, orgId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const router = useRouter();

  async function handleAccept() {
    setLoading(true);
    setError('');

    const res  = await fetch('/api/invite/accept', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    });
    const data = await res.json();

    if (data.ok) {
      router.push('/dashboard?invited=true');
    } else {
      setError(data.error ?? 'Failed to accept invitation');
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                   bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
        {loading ? 'Accepting…' : 'Accept invitation'}
      </button>
    </div>
  );
}
