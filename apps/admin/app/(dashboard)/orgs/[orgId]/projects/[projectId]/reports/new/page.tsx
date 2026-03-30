'use client';
// apps/admin/app/(dashboard)/orgs/[orgId]/projects/[projectId]/reports/new/page.tsx
// AmanahHub Console — Create new project report

import { useParams, useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { createReport } from '../actions';

export default function NewReportPage() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createReport, null);

  useEffect(() => {
    if (state?.reportId) {
      router.push(`/orgs/${orgId}/projects/${projectId}/reports/${state.reportId}`);
    }
  }, [state?.reportId, orgId, projectId, router]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <a href={`/orgs/${orgId}/projects/${projectId}`}
           className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Project
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">New progress report</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reports saved as drafts. You can attach evidence before submitting for review.
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="projectId" value={projectId} />

        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <Field label="Report title *" htmlFor="title">
          <input id="title" name="title" type="text" required className={inp}
            placeholder="e.g. Q1 2025 Progress Report — Waqf Library Penang" />
        </Field>

        <Field label="Report date" htmlFor="reportDate"
               hint="The date this report covers or was produced.">
          <input id="reportDate" name="reportDate" type="date" className={inp} />
        </Field>

        <Field label="Narrative *" htmlFor="narrative"
               hint="Describe what was accomplished, any challenges, and key observations.">
          <textarea id="narrative" name="narrative" rows={6} required className={inp}
            placeholder="Describe the work done, progress made, and any observations during this period." />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Beneficiaries reached" htmlFor="beneficiariesReached">
            <input id="beneficiariesReached" name="beneficiariesReached"
                   type="number" min="0" className={inp} placeholder="0" />
          </Field>
          <Field label="Spend to date (MYR)" htmlFor="spendToDate">
            <input id="spendToDate" name="spendToDate"
                   type="number" min="0" step="0.01" className={inp} placeholder="0.00" />
          </Field>
        </div>

        <Field label="Milestones completed" htmlFor="milestonesCompleted"
               hint="One milestone per line.">
          <textarea id="milestonesCompleted" name="milestonesCompleted" rows={3} className={inp}
            placeholder={"Reading room fit-out\nBook cataloguing phase 1\nStaff training"} />
        </Field>

        <Field label="Next steps" htmlFor="nextSteps" hint="One item per line.">
          <textarea id="nextSteps" name="nextSteps" rows={3} className={inp}
            placeholder={"Install digital terminals\nLaunch community orientation"} />
        </Field>

        <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
          💡 After saving, you can upload photos and documents as evidence before submitting for review.
        </div>

        <div className="flex items-center justify-between pt-2">
          <a href={`/orgs/${orgId}/projects/${projectId}`}
             className="text-sm text-gray-500 hover:text-gray-700">Cancel</a>
          <button type="submit" disabled={isPending} className={btn}>
            {isPending ? 'Saving…' : 'Save draft'}
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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inp = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
  placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;
const btn = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white
  bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;
