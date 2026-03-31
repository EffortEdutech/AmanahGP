'use client';
// components/charity/directory-search.tsx
// AmanahHub — Search + filters for charity directory (Sprint 7 UI uplift)
// Data logic unchanged — only visual layer replaced

import { useRouter, usePathname } from 'next/navigation';
import { useTransition }          from 'react';
import { MALAYSIA_STATES, ORG_TYPE_OPTIONS } from '@agp/validation';

interface Props {
  defaultQ?:       string;
  defaultOrgType?: string;
  defaultState?:   string;
}

export function DirectorySearch({ defaultQ, defaultOrgType, defaultState }: Props) {
  const router  = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd     = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const q       = (fd.get('q') as string)?.trim();
    const orgType = fd.get('org_type') as string;
    const state   = fd.get('state') as string;

    if (q)       params.set('q', q);
    if (orgType) params.set('org_type', orgType);
    if (state)   params.set('state', state);

    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2">

      <input
        name="q"
        type="search"
        defaultValue={defaultQ}
        placeholder="Search by name…"
        className="field flex-1 max-w-[260px]"
      />

      <select
        name="org_type"
        defaultValue={defaultOrgType ?? ''}
        className="field w-[148px]"
      >
        <option value="">All types</option>
        {ORG_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        name="state"
        defaultValue={defaultState ?? ''}
        className="field w-[128px]"
      >
        <option value="">All states</option>
        {MALAYSIA_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-4 py-2 text-xs disabled:opacity-60 whitespace-nowrap"
      >
        {pending ? '…' : 'Search'}
      </button>
    </form>
  );
}
