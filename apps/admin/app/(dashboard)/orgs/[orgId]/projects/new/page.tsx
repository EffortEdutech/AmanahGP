// apps/admin/app/(dashboard)/orgs/[orgId]/projects/new/page.tsx
// AmanahHub Console — Create new project

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { createProject } from '../actions';

export default function NewProjectPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router    = useRouter();
  const [state, formAction, isPending] = useActionState(createProject, null);

  useEffect(() => {
    if (state?.projectId) {
      router.push(`/orgs/${orgId}/projects/${state.projectId}`);
    }
  }, [state?.projectId, orgId, router]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <a href={`/orgs/${orgId}/projects`}
           className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Projects
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">New project</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a project to organise your work and submit transparency reports.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="orgId" value={orgId} />

        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <Field label="Project title *" htmlFor="title">
          <input id="title" name="title" type="text" required className={inp}
            placeholder="e.g. Waqf Library Penang — Phase 1" />
        </Field>

        <Field label="Objective *" htmlFor="objective"
               hint="What is this project trying to achieve? (min 20 characters)">
          <textarea id="objective" name="objective" rows={3} required className={inp}
            placeholder="Describe the project's primary goal and the community it serves." />
        </Field>

        <Field label="Description" htmlFor="description">
          <textarea id="description" name="description" rows={4} className={inp}
            placeholder="Additional details, background, methodology…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date" htmlFor="startDate">
            <input id="startDate" name="startDate" type="date" className={inp} />
          </Field>
          <Field label="End date" htmlFor="endDate">
            <input id="endDate" name="endDate" type="date" className={inp} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget (MYR)" htmlFor="budgetAmount">
            <input id="budgetAmount" name="budgetAmount" type="number" min="0" step="0.01"
                   className={inp} placeholder="0.00" />
          </Field>
          <Field label="Location" htmlFor="locationText">
            <input id="locationText" name="locationText" type="text"
                   className={inp} placeholder="e.g. George Town, Penang" />
          </Field>
        </div>

        <Field label="Beneficiary summary" htmlFor="beneficiarySummary"
               hint="Who benefits from this project? How many people?">
          <textarea id="beneficiarySummary" name="beneficiarySummary" rows={2} className={inp}
            placeholder="e.g. 500 students and families in George Town" />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <a href={`/orgs/${orgId}/projects`} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </a>
          <button type="submit" disabled={isPending} className={btn}>
            {isPending ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }:
  { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inp = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
  placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;
const btn = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white
  bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;
