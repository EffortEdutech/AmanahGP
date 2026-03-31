'use client';
// apps/admin/app/(dashboard)/onboarding/new/onboarding-form.tsx
// AmanahHub Console — Org classification form (Sprint 8 UI uplift)
// Matches UAT s-a-onboarding: type, oversight, fund-type checkboxes + amber governance notice

import { useState }       from 'react';
import { useActionState } from 'react';
import Link               from 'next/link';

const ORG_TYPES = [
  { value: 'waqf_institution', label: 'Waqf Institution' },
  { value: 'ngo',              label: 'NGO / Welfare Association' },
  { value: 'foundation',       label: 'Foundation (Yayasan)' },
  { value: 'mosque_surau',     label: 'Mosque / Surau' },
  { value: 'zakat_body',       label: 'Zakat Body' },
  { value: 'cooperative',      label: 'Cooperative' },
  { value: 'other',            label: 'Other' },
];

const OVERSIGHT_OPTIONS = [
  'SIRC (State Islamic Religious Council)',
  'ROS (Registrar of Societies)',
  'SSM (Companies Commission)',
  'JAKIM',
  'LHDN',
  'State Government',
  'Other',
];

const FUND_TYPES: { value: string; label: string; desc: string; ctcf?: string }[] = [
  { value: 'waqf',     label: 'Waqf',     desc: 'Requires waqf asset governance docs', ctcf: 'CTCF Layer 5' },
  { value: 'sadaqah',  label: 'Sadaqah',  desc: 'General charity donations' },
  { value: 'zakat',    label: 'Zakat',    desc: 'Requires zakat segregation',           ctcf: 'CTCF Layer 2' },
  { value: 'wakaf',    label: 'Wakaf',    desc: 'State-level waqf (alternative spelling)' },
  { value: 'hibah',    label: 'Hibah',    desc: 'Charitable gifts' },
];

interface Props {
  action: (prev: any, fd: FormData) => Promise<any>;
}

export function OnboardingForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [selectedFunds, setSelectedFunds] = useState<string[]>(['sadaqah']);

  const needsShariahNote = selectedFunds.some((f) => ['waqf', 'zakat', 'wakaf'].includes(f));

  function toggleFund(value: string) {
    setSelectedFunds((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  }

  return (
    <form action={formAction}>
      {/* Org name (step 1 carry-forward in real flow; shown here for single-step) */}
      <div className="card p-5 space-y-4">

        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Organization name *</label>
          <input type="text" name="name" required className="field text-[12px]"
            placeholder="Full registered name" />
        </div>

        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Legal / registered name</label>
          <input type="text" name="legal_name" className="field text-[12px]"
            placeholder="As per official documents" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Registration number</label>
            <input type="text" name="registration_no" className="field text-[12px]"
              placeholder="e.g. PPM-001-…" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">State</label>
            <select name="state" className="field text-[12px]">
              <option value="">Select state</option>
              {['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang',
                'Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor',
                'Terengganu','Kuala Lumpur','Labuan','Putrajaya'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Org type */}
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Organization type *</label>
          <select name="org_type" required className="field text-[12px]">
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Oversight */}
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Primary oversight authority *</label>
          <select name="oversight_authority" required className="field text-[12px]">
            {OVERSIGHT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Fund types */}
        <div>
          <p className="text-[11px] text-gray-500 mb-2">Fund types accepted *</p>
          <div className="space-y-2">
            {FUND_TYPES.map((ft) => (
              <label key={ft.value}
                className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="fund_types"
                  value={ft.value}
                  checked={selectedFunds.includes(ft.value)}
                  onChange={() => toggleFund(ft.value)}
                  className="accent-emerald-600 mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[12px] text-gray-800 font-medium">{ft.label}</span>
                  {ft.ctcf && (
                    <span className="text-[10px] text-gray-400 ml-1">({ft.ctcf})</span>
                  )}
                  <span className="text-[11px] text-gray-500"> — {ft.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Shariah governance notice */}
        {needsShariahNote && (
          <div className="a-card text-[11px] text-amber-800">
            Organizations handling waqf or zakat must demonstrate Shariah governance
            compliance to qualify for CTCF certification.
          </div>
        )}

        {/* Summary */}
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Public summary</label>
          <textarea name="summary" rows={3} className="field text-[12px] resize-none"
            placeholder="Brief description shown publicly…" />
        </div>

        {/* Error */}
        {state?.error && (
          <p className="text-[11px] text-red-600">{state.error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link href="/dashboard" className="btn-secondary text-xs py-2 px-3">
            ← Back
          </Link>
          <button type="submit" disabled={pending} className="btn-primary text-xs px-5 py-2">
            {pending ? 'Saving…' : 'Save and continue →'}
          </button>
        </div>
      </div>
    </form>
  );
}
