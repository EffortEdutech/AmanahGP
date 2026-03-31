'use client';
// apps/admin/app/(dashboard)/orgs/[orgId]/financials/page.tsx
// Sprint 11 fix: year dropdown covers 2019–2030 (future + historical)

import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import { useActionState }      from 'react';
import { upsertFinancialSnapshot, submitFinancialSnapshot } from './actions';
import { StatusBadge }         from '@/components/ui/badge';
import { DocumentUploadPanel } from '@/components/documents/document-upload-panel';
import type { DocumentSpec, UploadedDoc } from '@/components/documents/document-upload-panel';

// ── Year range: 2019 → 2030, newest first ────────────────────
const MIN_YEAR     = 2019;
const MAX_YEAR     = 2030;
const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = String(Math.min(CURRENT_YEAR - 1, MAX_YEAR));
const YEARS        = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MAX_YEAR - i          // descending: 2030, 2029, … 2019
);

function getFinancialSpecs(year: number): DocumentSpec[] {
  return [
    {
      documentType:  'financial_statement',
      label:         `${year} Annual financial statement`,
      description:   'Full income & expenditure statement for the year. Required for CTCF Layer 2.',
      required:      true,
      acceptedTypes: 'application/pdf',
    },
    {
      documentType:  'audit_report',
      label:         `${year} Audit report / auditor's letter`,
      description:   'External audit report or management letter from a registered auditor.',
      required:      true,
      acceptedTypes: 'application/pdf',
    },
    {
      documentType:  'bank_reconciliation',
      label:         'Bank reconciliation statement',
      description:   'Bank reconciliation or bank statement confirming fund balances.',
      required:      false,
      acceptedTypes: 'application/pdf,image/*',
    },
    {
      documentType:  'management_accounts',
      label:         'Program vs. admin expense breakdown',
      description:   'Breakdown showing program expenditure vs. administrative costs.',
      required:      false,
      acceptedTypes: 'application/pdf',
    },
  ];
}

export default function FinancialsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR);
  const [snapshot,     setSnapshot]     = useState<any>(null);
  const [loading,      setLoading]      = useState(false);
  const [finDocs,      setFinDocs]      = useState<UploadedDoc[]>([]);
  const [docsLoading,  setDocsLoading]  = useState(false);

  const [saveState,   saveAction,   savePending]   = useActionState(upsertFinancialSnapshot, null);
  const [submitState, submitAction, submitPending] = useActionState(submitFinancialSnapshot, null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orgs/${orgId}/financials/${selectedYear}`)
      .then((r) => r.json())
      .then((d) => { setSnapshot(d.data ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgId, selectedYear, saveState?.success]);

  useEffect(() => {
    setDocsLoading(true);
    fetch(`/api/orgs/${orgId}/documents?category=financial&year=${selectedYear}`)
      .then((r) => r.json())
      .then((d) => { setFinDocs(d.data ?? []); setDocsLoading(false); })
      .catch(() => setDocsLoading(false));
  }, [orgId, selectedYear]);

  const inputs      = snapshot?.inputs ?? {};
  const isSubmitted = snapshot?.submission_status === 'submitted';
  const isVerified  = snapshot?.verification_status === 'verified';

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <a href={`/orgs/${orgId}`}
          className="text-[11px] text-gray-400 hover:text-emerald-700 mb-3 block">
          ← Organization
        </a>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Financial snapshot</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Annual summary + supporting documents for CTCF Layer 2.
            </p>
          </div>
          {snapshot && (
            <div className="flex gap-2">
              <StatusBadge status={snapshot.submission_status} />
              <StatusBadge status={snapshot.verification_status} />
            </div>
          )}
        </div>
      </div>

      {/* Year selector */}
      <div className="card p-4 mb-4">
        <label className="sec-label block mb-1" htmlFor="year-select">
          Reporting year
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="field w-36"
        >
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}{y === CURRENT_YEAR ? ' (current)' : y === CURRENT_YEAR - 1 ? ' (last)' : ''}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          Select the financial year this snapshot covers.
        </p>
      </div>

      {loading ? (
        <div className="text-[12px] text-gray-400 py-6 text-center">Loading…</div>
      ) : (
        <>
          <form action={!isSubmitted ? saveAction : undefined} className="card p-4 mb-4">
            <p className="sec-label mb-3">Financial figures — {selectedYear}</p>
            <input type="hidden" name="orgId"      value={orgId} />
            <input type="hidden" name="periodYear" value={selectedYear} />

            {(saveState?.error || submitState?.error) && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2
                              text-[11px] text-red-700 mb-3">
                {saveState?.error ?? submitState?.error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Total income (MYR)" id="total_income">
                <input id="total_income" name="total_income" type="number" step="0.01"
                  defaultValue={inputs.total_income ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
              <Field label="Total expenditure (MYR)" id="total_expenditure">
                <input id="total_expenditure" name="total_expenditure" type="number" step="0.01"
                  defaultValue={inputs.total_expenditure ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
              <Field label="Program expenditure (MYR)" id="program_expenditure"
                hint="Funds spent directly on programs / beneficiaries">
                <input id="program_expenditure" name="program_expenditure" type="number" step="0.01"
                  defaultValue={inputs.program_expenditure ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
              <Field label="Admin expenditure (MYR)" id="admin_expenditure"
                hint="Staff salaries, rent, overheads">
                <input id="admin_expenditure" name="admin_expenditure" type="number" step="0.01"
                  defaultValue={inputs.admin_expenditure ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
              <Field label="Waqf income (MYR)" id="waqf_income"
                hint="Rental or asset income from waqf — if applicable">
                <input id="waqf_income" name="waqf_income" type="number" step="0.01"
                  defaultValue={inputs.waqf_income ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
              <Field label="Waqf asset value (MYR)" id="waqf_assets_value"
                hint="Total market value of waqf assets managed">
                <input id="waqf_assets_value" name="waqf_assets_value" type="number" step="0.01"
                  defaultValue={inputs.waqf_assets_value ?? ''} disabled={isSubmitted}
                  className="field" placeholder="0.00" />
              </Field>
            </div>

            {/* Compliance */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-medium text-gray-700 mb-3">
                Compliance declarations — CTCF Layer 2
              </p>
              <div className="space-y-2">
                {[
                  { id: 'is_audited',            label: 'External audit completed for this year' },
                  { id: 'has_annual_report',      label: 'Annual report prepared and available' },
                  { id: 'has_program_breakdown',  label: 'Program vs. admin expense breakdown available' },
                  { id: 'has_fund_segregation',   label: 'Fund segregation maintained (Zakat / Waqf / Sadaqah separate)' },
                ].map((item) => (
                  <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                    <input type="checkbox" name={item.id} value="true"
                      defaultChecked={!!inputs[item.id]} disabled={isSubmitted}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600
                                 focus:ring-emerald-500 flex-shrink-0" />
                    <span className="text-[12px] text-gray-700 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <Field label="Audit firm name" id="audit_firm"
                hint="Name of registered auditor if audited">
                <input id="audit_firm" name="audit_firm" type="text"
                  defaultValue={inputs.audit_firm ?? ''} disabled={isSubmitted}
                  className="field"
                  placeholder="e.g. Messrs. Ahmad & Partners (AF0123)" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Notes" id="notes">
                <textarea id="notes" name="notes" rows={2}
                  defaultValue={inputs.notes ?? ''} disabled={isSubmitted}
                  className="field resize-none"
                  placeholder="Any context about this financial year…" />
              </Field>
            </div>

            {!isSubmitted && (
              <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                <button type="submit" disabled={savePending}
                  className="btn-secondary text-xs px-4 py-2">
                  {savePending ? 'Saving…' : 'Save draft'}
                </button>
              </div>
            )}
          </form>

          {!isSubmitted && snapshot && (
            <form action={submitAction} className="mb-4">
              <input type="hidden" name="orgId"      value={orgId} />
              <input type="hidden" name="periodYear" value={selectedYear} />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={submitPending}
                  className="btn-primary text-sm px-5 py-2">
                  {submitPending ? 'Submitting…' : 'Submit for review'}
                </button>
                <p className="text-[11px] text-gray-400">
                  Upload all documents below before submitting.
                </p>
              </div>
            </form>
          )}

          {isSubmitted && !isVerified && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3
                            text-[12px] text-amber-800 mb-4">
              Submitted for review — a reviewer will verify your documents and figures.
            </div>
          )}
          {isVerified && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3
                            text-[12px] text-emerald-800 mb-4">
              ✓ Verified. Financial snapshot accepted for CTCF scoring.
            </div>
          )}
        </>
      )}

      {docsLoading ? (
        <div className="text-[12px] text-gray-400 py-4 text-center">Loading documents…</div>
      ) : (
        <DocumentUploadPanel
          orgId={orgId}
          category="financial"
          title={`Layer 2 — Financial documents (${selectedYear})`}
          specs={getFinancialSpecs(Number(selectedYear))}
          existingDocs={finDocs}
          periodYear={Number(selectedYear)}
          readOnly={isVerified}
        />
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-[12px]
                      text-blue-800 leading-relaxed mt-1">
        <p className="font-medium mb-1">CTCF Layer 2 — Financial Transparency (25% of score)</p>
        <p>
          Upload your annual financial statement and audit report for reviewer verification.
          Approved documents become publicly visible to donors on AmanahHub.
          Per AAOIFI FAS 9, Zakat fund segregation must be separately disclosed.
        </p>
      </div>
    </div>
  );
}

function Field({ label, id, hint, children }: {
  label: string; id: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}
