'use client';
// apps/org/components/reports/report-form.tsx
// Sprint 25 — Report create + submit form
// Option A: accepts basePath so redirects go to /org/[orgId]/reports

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface Props {
  orgId:             string;
  basePath:          string;    // e.g. /org/abc-123
  projects:          Array<{ id: string; title: string }>;
  defaultProjectId?: string;
}

const inputCls = `w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                  focus:outline-none focus:ring-2 focus:ring-emerald-500`;

export function ReportForm({ orgId, basePath, projects, defaultProjectId }: Props) {
  const router = useRouter();
  const [projectId,    setProjectId]    = useState(defaultProjectId ?? '');
  const [title,        setTitle]        = useState('');
  const [reportDate,   setReportDate]   = useState('');
  const [narrative,    setNarrative]    = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [spendToDate,  setSpendToDate]  = useState('');
  const [milestones,   setMilestones]   = useState('');
  const [nextSteps,    setNextSteps]    = useState('');
  const [submitNow,    setSubmitNow]    = useState(false);
  const [error,        setError]        = useState('');
  const [isPending,    startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent, autoSubmit = false) {
    e.preventDefault(); setError('');
    startTransition(async () => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId, projectId, title, reportDate: reportDate || null,
          narrative, beneficiariesReached: beneficiaries || null,
          spendToDate: spendToDate || null, milestonesCompleted: milestones,
          nextSteps, submitNow: autoSubmit || submitNow,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`${basePath}/reports`);
    });
  }

  const field = (label: string, children: React.ReactNode, required = false, hint?: string) => (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">

      {field('Project', (
        <select required value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className={inputCls}>
          <option value="">— Select project —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      ), true)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('Report title', (
          <input type="text" required value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q1 2026 Progress Report"
            className={inputCls} />
        ), true)}
        {field('Report date', (
          <input type="date" value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className={inputCls} />
        ))}
      </div>

      {field('Narrative', (
        <textarea rows={5} required value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Describe what activities were carried out, what was achieved, and any challenges…"
          className={`${inputCls} resize-none`} />
      ), true, 'Minimum 20 characters. Be specific — reviewers evaluate this for CTCF Layer 3.')}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('Beneficiaries reached', (
          <input type="number" min="0" value={beneficiaries}
            onChange={(e) => setBeneficiaries(e.target.value)}
            placeholder="e.g. 45"
            className={inputCls} />
        ), false, 'Number of individuals or families served this period')}
        {field('Cumulative spend (RM)', (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">RM</span>
            <input type="number" min="0" step="0.01" value={spendToDate}
              onChange={(e) => setSpendToDate(e.target.value)}
              placeholder="0.00"
              className={`${inputCls} pl-10`} />
          </div>
        ), false, 'Total spent against budget to date')}
      </div>

      {field('Milestones completed', (
        <textarea rows={2} value={milestones}
          onChange={(e) => setMilestones(e.target.value)}
          placeholder="List key milestones or deliverables completed this period…"
          className={`${inputCls} resize-none`} />
      ))}

      {field('Next steps', (
        <textarea rows={2} value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          placeholder="What happens next? Expected activities for next reporting period…"
          className={`${inputCls} resize-none`} />
      ))}

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-[11px] text-blue-700">
          <strong>After submitting</strong>, a platform reviewer will verify this report.
          Verified reports with beneficiary data and spend figures earn{' '}
          <strong>CTCF Layer 3 credit</strong>.
          You cannot approve your own reports.
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" disabled={isPending}
          onClick={(e) => { setSubmitNow(false); handleSubmit(e as never); }}
          className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                     rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40">
          {isPending ? 'Saving…' : 'Save as draft'}
        </button>
        <button type="button" disabled={isPending}
          onClick={(e) => { setSubmitNow(true); handleSubmit(e as never, true); }}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-semibold rounded-lg transition-colors disabled:opacity-40">
          {isPending ? 'Submitting…' : 'Submit for review →'}
        </button>
        <a href={`${basePath}/reports`}
          className="px-5 py-2.5 text-gray-400 hover:text-gray-600 text-sm transition-colors self-center">
          Cancel
        </a>
      </div>
    </form>
  );
}
