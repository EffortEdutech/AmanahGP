'use client';
// apps/user/components/charity/directory-search.tsx
// AmanahHub — Search bar + filters for charity directory

import { useRouter, usePathname } from 'next/navigation';
import { useTransition }          from 'react';
import { MALAYSIA_STATES, ORG_TYPE_OPTIONS } from '@agp/validation';

interface Props {
  defaultQ?:       string;
  defaultOrgType?: string;
  defaultState?:   string;
}

export function DirectorySearch({ defaultQ, defaultOrgType, defaultState }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd      = new FormData(e.currentTarget);
    const params  = new URLSearchParams();
    const q       = fd.get('q') as string;
    const orgType = fd.get('org_type') as string;
    const state   = fd.get('state') as string;

    if (q)       params.set('q', q);
    if (orgType) params.set('org_type', orgType);
    if (state)   params.set('state', state);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <input
        name="q"
        type="search"
        defaultValue={defaultQ}
        placeholder="Search by name…"
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                   shadow-sm placeholder-gray-400 focus:border-emerald-500
                   focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />

      {/* Org type */}
      <select name="org_type" defaultValue={defaultOrgType ?? ''}
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                   shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                   focus:ring-emerald-500 bg-white">
        <option value="">All types</option>
        {ORG_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* State */}
      <select name="state" defaultValue={defaultState ?? ''}
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                   shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                   focus:ring-emerald-500 bg-white">
        <option value="">All states</option>
        {MALAYSIA_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <button type="submit" disabled={pending}
        className="px-5 py-2.5 rounded-lg text-sm font-medium text-white
                   bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
        {pending ? '…' : 'Search'}
      </button>
    </form>
  );
}
