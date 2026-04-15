'use client';
// apps/org/components/org/profile-edit-form.tsx
// Sprint 23 — Organisation profile edit form

import { useState, useTransition } from 'react';

interface OrgType       { value: string; label: string; }
interface FundTypeOption { value: string; label: string; }

interface InitialValues {
  name: string; legal_name: string; registration_no: string;
  org_type: string; state: string; oversight_authority: string;
  fund_types: string[]; summary: string;
  contact_email: string; contact_phone: string;
  website_url: string; address_text: string;
}

interface Props {
  orgId:            string;
  isManager:        boolean;
  initialValues:    InitialValues;
  orgTypes:         OrgType[];
  states:           string[];
  fundTypeOptions:  FundTypeOption[];
}

export function ProfileEditForm({
  orgId, isManager, initialValues, orgTypes, states, fundTypeOptions,
}: Props) {
  const [values,    setValues]    = useState<InitialValues>(initialValues);
  const [editing,   setEditing]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  function update(field: keyof InitialValues, value: string | string[]) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function toggleFundType(ft: string) {
    const current = values.fund_types;
    setValues((v) => ({
      ...v,
      fund_types: current.includes(ft)
        ? current.filter((f) => f !== ft)
        : [...current, ft],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaved(false);
    startTransition(async () => {
      const res = await fetch('/api/org/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, ...values }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000); }
    });
  }

  const field = (label: string, children: React.ReactNode, required = false) => (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = `w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                    focus:outline-none focus:ring-2 focus:ring-emerald-500
                    disabled:bg-gray-50 disabled:cursor-not-allowed`;

  // Read-only view
  if (!editing) {
    const rows: [string, string][] = [
      ['Name',                values.name],
      ['Legal name',          values.legal_name || '—'],
      ['Registration no.',    values.registration_no || '—'],
      ['Organisation type',   orgTypes.find((t) => t.value === values.org_type)?.label || values.org_type || '—'],
      ['State',               values.state || '—'],
      ['Oversight authority', values.oversight_authority || '—'],
      ['Fund types',          values.fund_types.join(', ') || '—'],
      ['Contact email',       values.contact_email || '—'],
      ['Contact phone',       values.contact_phone || '—'],
      ['Website',             values.website_url || '—'],
      ['Address',             values.address_text || '—'],
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex px-4 py-3 gap-4">
              <span className="text-[11px] text-gray-400 w-44 flex-shrink-0 font-medium pt-0.5">{label}</span>
              <span className="text-[13px] text-gray-700 capitalize">{value}</span>
            </div>
          ))}
          {values.summary && (
            <div className="flex px-4 py-3 gap-4">
              <span className="text-[11px] text-gray-400 w-44 flex-shrink-0 font-medium pt-0.5">Mission summary</span>
              <span className="text-[13px] text-gray-700 leading-relaxed">{values.summary}</span>
            </div>
          )}
        </div>

        {saved && (
          <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            ✓ Profile saved successfully
          </p>
        )}

        {isManager && (
          <button type="button" onClick={() => setEditing(true)}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium
                       rounded-lg hover:bg-gray-50 transition-colors">
            Edit profile
          </button>
        )}
      </div>
    );
  }

  // Edit form
  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-5 space-y-5">

        {/* Basic info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('Organisation name', (
            <input type="text" required value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls} />
          ), true)}
          {field('Legal name', (
            <input type="text" value={values.legal_name}
              onChange={(e) => update('legal_name', e.target.value)}
              className={inputCls} placeholder="If different from name" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('Registration number', (
            <input type="text" required value={values.registration_no}
              onChange={(e) => update('registration_no', e.target.value)}
              placeholder="e.g. PPM-012-10-06102021"
              className={inputCls} />
          ), true)}
          {field('Oversight authority', (
            <input type="text" value={values.oversight_authority}
              onChange={(e) => update('oversight_authority', e.target.value)}
              placeholder="e.g. ROS, JAKIM, SIRC"
              className={inputCls} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('Organisation type', (
            <select value={values.org_type}
              onChange={(e) => update('org_type', e.target.value)}
              className={inputCls}>
              <option value="">— Select type —</option>
              {orgTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          ))}
          {field('State', (
            <select value={values.state}
              onChange={(e) => update('state', e.target.value)}
              className={inputCls}>
              <option value="">— Select state —</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ))}
        </div>

        {/* Fund types */}
        <div>
          <p className="text-[11px] font-medium text-gray-600 mb-2">Fund types handled</p>
          <div className="flex flex-wrap gap-2">
            {fundTypeOptions.map((ft) => (
              <button key={ft.value} type="button"
                onClick={() => toggleFundType(ft.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                  values.fund_types.includes(ft.value)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}>
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('Contact email', (
            <input type="email" value={values.contact_email}
              onChange={(e) => update('contact_email', e.target.value)}
              className={inputCls} />
          ))}
          {field('Contact phone', (
            <input type="tel" value={values.contact_phone}
              onChange={(e) => update('contact_phone', e.target.value)}
              placeholder="+60 3-1234 5678"
              className={inputCls} />
          ))}
        </div>

        {field('Website', (
          <input type="url" value={values.website_url}
            onChange={(e) => update('website_url', e.target.value)}
            placeholder="https://example.org"
            className={inputCls} />
        ))}

        {field('Physical address', (
          <textarea rows={2} value={values.address_text}
            onChange={(e) => update('address_text', e.target.value)}
            placeholder="Full address including postcode and state"
            className={`${inputCls} resize-none`} />
        ))}

        {field('Mission summary', (
          <textarea rows={3} value={values.summary}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="Brief description of your organisation's mission and programmes…"
            className={`${inputCls} resize-none`} />
        ))}
      </div>

      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-medium rounded-lg transition-colors disabled:opacity-40">
          {isPending ? 'Saving…' : 'Save profile'}
        </button>
        <button type="button" onClick={() => { setEditing(false); setValues(initialValues); }}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                     rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
