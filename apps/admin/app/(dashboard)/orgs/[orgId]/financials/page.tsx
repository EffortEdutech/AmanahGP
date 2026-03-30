'use client';
// apps/admin/app/(dashboard)/orgs/[orgId]/financials/page.tsx
// AmanahHub Console — Financial snapshot (MVP form)
// Note: This page uses 'use client' because it fetches + renders form state.
// A server-component wrapper that passes data could be used in a later sprint.

import { useEffect, useState } from 'react';
import { useParams }          from 'next/navigation';
import { useActionState }     from 'react';
import { upsertFinancialSnapshot, submitFinancialSnapshot } from './actions';
import { StatusBadge } from '@/components/ui/status-badge';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function FinancialsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR - 1));
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading,  setLoading]  = useState(false);

  const [saveState,   saveAction,   savePending]   = useActionState(upsertFinancialSnapshot, null);
  const [submitState, submitAction, submitPending] = useActionState(submitFinancialSnapshot, null);

  // Fetch snapshot for selected year
  useEffect(() => {
    setLoading(true);
    fetch(`/api/orgs/${orgId}/financials/${selectedYear}`)
      .then((r) => r.json())
      .then((d) => { setSnapshot(d.data ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId, selectedYear, saveState?.success]);

  const inputs      = snapshot?.inputs ?? {};
  const isSubmitted = snapshot?.submission_status === 'submitted';
  const isVerified  = snapshot?.verification_status === 'verified';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Organization
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Financial snapshot</h1>
        <p className="mt-1 text-sm text-gray-500">
          Annual financial summary for transparency reporting. Required for CTCF certification.
        </p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Period year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500
                     focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {snapshot && (
          <StatusBadge status={snapshot.verification_status} />
        )}
      </div>

      {/* Reviewer comment if changes_requested */}
      {snapshot?.verification_status === 'changes_requested' && snapshot.reviewer_comment && (
        <div className="mb-6 rounded-md bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-sm font-semibold text-orange-900 mb-1">Changes requested</p>
          <p className="text-sm text-orange-800">{snapshot.reviewer_comment}</p>
        </div>
      )}

      {isVerified && (
        <div className="mb-6 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✅ Verified on {new Date(snapshot.verified_at).toLocaleDateString('en-MY')}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
      ) : (
        <form action={saveAction} className="space-y-5">
          <input type="hidden" name="orgId"       value={orgId} />
          <input type="hidden" name="periodYear"  value={selectedYear} />

          {saveState?.error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveState.error}
            </div>
          )}
          {saveState?.success && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              ✅ Saved successfully.
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <SectionHead>Income &amp; expenditure (MYR)</SectionHead>

            <FormRow label="Total income *" htmlFor="totalIncome">
              <input id="totalIncome" name="totalIncome" type="number" min="0" step="0.01"
                required disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.total_income ?? ''}
                className={inp} placeholder="0.00" />
            </FormRow>

            <FormRow label="Total expenditure *" htmlFor="totalExpenditure">
              <input id="totalExpenditure" name="totalExpenditure" type="number" min="0" step="0.01"
                required disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.total_expenditure ?? ''}
                className={inp} placeholder="0.00" />
            </FormRow>

            <FormRow label="Program expenditure" htmlFor="programExpenditure"
                     hint="Amount spent directly on charitable programs">
              <input id="programExpenditure" name="programExpenditure" type="number" min="0" step="0.01"
                disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.program_expenditure ?? ''}
                className={inp} placeholder="0.00" />
            </FormRow>

            <FormRow label="Admin expenditure" htmlFor="adminExpenditure"
                     hint="Overhead, salaries, operations">
              <input id="adminExpenditure" name="adminExpenditure" type="number" min="0" step="0.01"
                disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.admin_expenditure ?? ''}
                className={inp} placeholder="0.00" />
            </FormRow>

            {/* Waqf assets — only show if relevant */}
            <FormRow label="Waqf assets value" htmlFor="waqfAssetsValue"
                     hint="Total estimated value of waqf assets managed (if applicable)">
              <input id="waqfAssetsValue" name="waqfAssetsValue" type="number" min="0" step="0.01"
                disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.waqf_assets_value ?? ''}
                className={inp} placeholder="0.00" />
            </FormRow>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <SectionHead>Audit</SectionHead>

            <FormRow label="External audit completed?" htmlFor="auditCompleted">
              <select id="auditCompleted" name="auditCompleted"
                disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.audit_completed === true ? 'true' : 'false'}
                className={inp}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </FormRow>

            <FormRow label="Auditor name" htmlFor="auditorName">
              <input id="auditorName" name="auditorName" type="text"
                disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
                defaultValue={inputs.auditor_name ?? ''}
                className={inp} placeholder="e.g. Messrs. Amanah & Partners" />
            </FormRow>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea id="notes" name="notes" rows={3}
              disabled={isSubmitted && !snapshot?.verification_status?.includes('changes')}
              defaultValue={inputs.notes ?? ''}
              className={inp}
              placeholder="Any additional context for the reviewer." />
          </div>

          {/* Actions */}
          {(!isSubmitted || snapshot?.verification_status === 'changes_requested') && !isVerified && (
            <div className="flex items-center justify-between pt-2">
              <button type="submit" disabled={savePending}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                           border border-gray-300 text-gray-700 bg-white hover:bg-gray-50
                           disabled:opacity-60 transition-colors">
                {savePending ? 'Saving…' : 'Save draft'}
              </button>

              {snapshot && !isSubmitted && (
                <form action={submitAction} className="inline">
                  <input type="hidden" name="orgId"      value={orgId} />
                  <input type="hidden" name="periodYear" value={selectedYear} />
                  <button type="submit" disabled={submitPending}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                               text-white bg-emerald-700 hover:bg-emerald-800
                               disabled:opacity-60 transition-colors">
                    {submitPending ? 'Submitting…' : 'Submit for review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 bg-gray-50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function FormRow({ label, htmlFor, hint, children }:
  { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 flex items-start gap-4">
      <div className="w-52 flex-shrink-0 pt-2">
        <label htmlFor={htmlFor} className="text-sm text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inp = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
  placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1
  focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500`;
