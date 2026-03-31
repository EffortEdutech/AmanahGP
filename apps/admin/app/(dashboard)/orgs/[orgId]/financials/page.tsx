'use client';
// apps/admin/app/(dashboard)/orgs/[orgId]/financials/page.tsx
// AmanahHub Console — Financial snapshot (Sprint 8 UI uplift)
// Matches UAT s-a-financial: income/expenditure tables + compliance checklist
// Client component (year selector drives data fetch) — logic unchanged

import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import { useActionState }      from 'react';
import { upsertFinancialSnapshot, submitFinancialSnapshot } from './actions';
import { StatusBadge }         from '@/components/ui/badge';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function FinancialsPage() {
  const { orgId }     = useParams<{ orgId: string }>();
  const [year, setYear] = useState(String(CURRENT_YEAR - 1));
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading,  setLoading]  = useState(false);

  const [saveState,   saveAction,   savePending]   = useActionState(upsertFinancialSnapshot, null);
  const [submitState, submitAction, submitPending] = useActionState(submitFinancialSnapshot, null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orgs/${orgId}/financials/${year}`)
      .then((r) => r.json())
      .then((d) => { setSnapshot(d.data ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId, year, saveState?.success]);

  const inputs      = snapshot?.inputs ?? {};
  const isSubmitted = snapshot?.submission_status === 'submitted';
  const isVerified  = snapshot?.verification_status === 'verified';

  function fmtMYR(v: any) {
    const n = Number(v);
    return isNaN(n) ? '—' : `MYR ${n.toLocaleString('en-MY')}`;
  }

  // Program ratio
  const programExp = Number(inputs.program_expenses ?? 0);
  const adminExp   = Number(inputs.admin_expenses ?? 0);
  const total      = programExp + adminExp;
  const ratio      = total > 0 ? ((programExp / total) * 100).toFixed(1) : null;

  // Compliance checks
  const checks = [
    { label: 'Annual financial statement', ok: !!inputs.total_income },
    { label: 'External audit',             ok: !!inputs.is_audited },
    { label: 'Program / admin breakdown',  ok: !!(inputs.program_expenses && inputs.admin_expenses) },
  ];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">Financial snapshot</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Annual summary for transparency reporting and CTCF certification.
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="field w-[90px]"
        >
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      {/* Status banner */}
      {snapshot && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-[12px] font-medium
          ${isVerified ? 'g-card text-emerald-800' : isSubmitted ? 'a-card text-amber-800' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
          {isVerified
            ? `✓ Verified by reviewer${snapshot.verified_at ? ` — ${new Date(snapshot.verified_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`
            : isSubmitted
              ? 'Submitted — awaiting reviewer verification'
              : 'Draft — not yet submitted'}
        </div>
      )}

      {loading && (
        <div className="card p-8 text-center">
          <p className="text-[12px] text-gray-400">Loading…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Display mode (submitted/verified) */}
          {(isSubmitted || isVerified) && snapshot ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Income */}
              <div className="space-y-3">
                <div className="card p-4">
                  <p className="sec-label">Income ({year})</p>
                  <table className="w-full text-[12px] border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">Total income</td>
                        <td className="py-1.5 text-right font-semibold">{fmtMYR(inputs.total_income)}</td>
                      </tr>
                      {inputs.waqf_income && (
                        <tr>
                          <td className="py-1.5 text-gray-400 text-[11px]">Waqf proceeds</td>
                          <td className="py-1.5 text-right text-[11px]">{fmtMYR(inputs.waqf_income)}</td>
                        </tr>
                      )}
                      {inputs.donation_income && (
                        <tr>
                          <td className="py-1.5 text-gray-400 text-[11px]">Sadaqah donations</td>
                          <td className="py-1.5 text-right text-[11px]">{fmtMYR(inputs.donation_income)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="card p-4">
                  <p className="sec-label">Expenditure ({year})</p>
                  <table className="w-full text-[12px] border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">Program expenses</td>
                        <td className="py-1.5 text-right font-semibold">{fmtMYR(inputs.program_expenses)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-400 text-[11px]">Administration</td>
                        <td className="py-1.5 text-right text-[11px]">{fmtMYR(inputs.admin_expenses)}</td>
                      </tr>
                      {ratio && (
                        <tr>
                          <td className="py-1.5 text-gray-400 text-[11px]">Program ratio</td>
                          <td className="py-1.5 text-right font-semibold text-emerald-700">{ratio}%</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compliance */}
              <div>
                <div className="card p-4">
                  <p className="sec-label">Compliance status</p>
                  <div className="space-y-2 mb-3">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-700">{c.label}</span>
                        <span className={`chk ${c.ok ? 'chk-y' : 'chk-n'} flex items-center justify-center`}>
                          {c.ok ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {isVerified && (
                    <div className="g-card mt-2">
                      <p className="text-[11px] font-medium text-emerald-800">✓ Verified by reviewer</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Edit form (draft) */
            <form action={saveAction} className="space-y-4">
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="year"  value={year} />

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 space-y-3">
                  <p className="sec-label">Income (MYR)</p>
                  <Field name="total_income"    label="Total income"       defaultValue={inputs.total_income} />
                  <Field name="waqf_income"     label="Waqf proceeds"      defaultValue={inputs.waqf_income} />
                  <Field name="donation_income" label="Sadaqah donations"  defaultValue={inputs.donation_income} />
                </div>
                <div className="card p-4 space-y-3">
                  <p className="sec-label">Expenditure (MYR)</p>
                  <Field name="program_expenses" label="Program expenses"  defaultValue={inputs.program_expenses} />
                  <Field name="admin_expenses"   label="Administration"    defaultValue={inputs.admin_expenses} />
                </div>
              </div>

              <div className="card p-4">
                <p className="sec-label">Compliance</p>
                <CheckField name="is_audited"         label="External audit completed"   defaultChecked={!!inputs.is_audited} />
                <CheckField name="has_annual_report"  label="Annual financial statement" defaultChecked={!!inputs.has_annual_report} />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={savePending}
                  className="btn-secondary text-xs px-4 py-2">
                  {savePending ? 'Saving…' : 'Save draft'}
                </button>
              </div>
            </form>
          )}

          {/* Submit button */}
          {snapshot && !isSubmitted && !isVerified && (
            <form action={submitAction} className="mt-4">
              <input type="hidden" name="orgId"      value={orgId} />
              <input type="hidden" name="snapshotId" value={snapshot.id} />
              <button type="submit" disabled={submitPending}
                className="btn-primary text-xs px-5 py-2">
                {submitPending ? 'Submitting…' : 'Submit for review'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: any }) {
  return (
    <div>
      <label className="text-[11px] text-gray-500 block mb-1">{label}</label>
      <input type="number" name={name} defaultValue={defaultValue ?? ''} min="0" step="1"
        className="field text-[12px]" placeholder="0" />
    </div>
  );
}

function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked}
        className="accent-emerald-600" />
      <span className="text-[12px] text-gray-700">{label}</span>
    </label>
  );
}
