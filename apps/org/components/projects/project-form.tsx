'use client';
// apps/org/components/projects/project-form.tsx
// Sprint 25 — Project create/edit form
// Option A: accepts basePath so redirects go to /org/[orgId]/projects/...

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface InitialValues {
  title: string; objective: string; description: string;
  location_text: string; start_date: string; end_date: string;
  budget_amount: string; status: string; is_public: boolean;
  beneficiary_summary: string;
}

interface Props {
  orgId:          string;
  basePath:       string;          // e.g. /org/abc-123
  mode:           'create' | 'edit';
  projectId?:     string;
  initialValues?: InitialValues;
}

const DEFAULT: InitialValues = {
  title: '', objective: '', description: '', location_text: '',
  start_date: '', end_date: '', budget_amount: '', status: 'draft',
  is_public: false, beneficiary_summary: '',
};

const inputCls = `w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                  focus:outline-none focus:ring-2 focus:ring-emerald-500`;

export function ProjectForm({ orgId, basePath, mode, projectId, initialValues }: Props) {
  const router = useRouter();
  const [v, setV]         = useState<InitialValues>(initialValues ?? DEFAULT);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function upd(k: keyof InitialValues, val: string | boolean) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    startTransition(async () => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, orgId, projectId, ...v }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(data.id ? `${basePath}/projects/${data.id}` : `${basePath}/projects`);
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

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
      {field('Project title', (
        <input type="text" required value={v.title}
          onChange={(e) => upd('title', e.target.value)}
          placeholder="e.g. Ramadan Food Aid Programme 2026"
          className={inputCls} />
      ), true)}

      {field('Objective', (
        <textarea rows={2} required value={v.objective}
          onChange={(e) => upd('objective', e.target.value)}
          placeholder="What does this project aim to achieve?"
          className={`${inputCls} resize-none`} />
      ), true)}

      {field('Description', (
        <textarea rows={3} value={v.description}
          onChange={(e) => upd('description', e.target.value)}
          placeholder="Detailed description of activities, approach, and beneficiaries…"
          className={`${inputCls} resize-none`} />
      ))}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('Location', (
          <input type="text" value={v.location_text}
            onChange={(e) => upd('location_text', e.target.value)}
            placeholder="e.g. Shah Alam, Selangor"
            className={inputCls} />
        ))}
        {field('Beneficiary summary', (
          <input type="text" value={v.beneficiary_summary}
            onChange={(e) => upd('beneficiary_summary', e.target.value)}
            placeholder="e.g. 50 low-income families"
            className={inputCls} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field('Start date', (
          <input type="date" value={v.start_date}
            onChange={(e) => upd('start_date', e.target.value)}
            className={inputCls} />
        ))}
        {field('End date', (
          <input type="date" value={v.end_date}
            onChange={(e) => upd('end_date', e.target.value)}
            className={inputCls} />
        ))}
        {field('Budget (RM)', (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">RM</span>
            <input type="number" min="0" step="0.01" value={v.budget_amount}
              onChange={(e) => upd('budget_amount', e.target.value)}
              placeholder="0.00"
              className={`${inputCls} pl-10`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('Status', (
          <select value={v.status} onChange={(e) => upd('status', e.target.value)} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        ))}
        <div className="flex items-center gap-3 pt-5">
          <input type="checkbox" id="is_public" checked={v.is_public}
            onChange={(e) => upd('is_public', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <label htmlFor="is_public" className="text-[13px] text-gray-700">
            Publish on AmanahHub
            <p className="text-[10px] text-gray-400">Visible to donors after reviewer approval</p>
          </label>
        </div>
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
          {isPending ? 'Saving…' : mode === 'create' ? 'Create project' : 'Save changes'}
        </button>
        <a href={`${basePath}/projects`}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                     rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
