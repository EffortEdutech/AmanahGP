'use client';
// apps/org/app/(protected)/accounting/transactions/new/journal-entry-form.tsx
// Full multi-line journal entry form. Enforces double-entry balance.
// Up to 10 lines. Debit total must equal credit total before save.

import { useState, useTransition } from 'react';

interface Account { id: string; code: string; name: string; type: string; normalBalance: string; }
interface Fund    { id: string; code: string; name: string; type: string; }
interface Project { id: string; name: string; }

interface JournalLine {
  accountId:    string;
  fundId:       string;
  projectId:    string;
  debitAmount:  string;
  creditAmount: string;
  description:  string;
}

const emptyLine = (): JournalLine => ({
  accountId: '', fundId: '', projectId: '',
  debitAmount: '', creditAmount: '', description: '',
});

interface Props {
  basePath?: string;
  orgId:    string;
  accounts: Account[];
  funds:    Fund[];
  projects: Project[];
}

export function JournalEntryForm({ orgId, accounts, funds, projects,
  basePath,
}: Props) {
  const [entryDate,    setEntryDate]    = useState(new Date().toISOString().split('T')[0]);
  const [description,  setDescription]  = useState('');
  const [referenceNo,  setReferenceNo]  = useState('');
  const [entryType,    setEntryType]    = useState('manual');
  const [lines,        setLines]        = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [isPending,    startTransition] = useTransition();

  // Grouped accounts by type
  const incomeAccounts  = accounts.filter((a) => a.type === 'income');
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');
  const assetAccounts   = accounts.filter((a) => a.type === 'asset');
  const liabilityAccs   = accounts.filter((a) => a.type === 'liability');
  const equityAccounts  = accounts.filter((a) => a.type === 'equity');

  const totalDebits  = lines.reduce((s, l) => s + (parseFloat(l.debitAmount)  || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (parseFloat(l.creditAmount) || 0), 0);
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;
  const difference   = totalDebits - totalCredits;

  function updateLine(idx: number, field: keyof JournalLine, value: string) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  function addLine() {
    if (lines.length < 10) setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(idx: number) {
    if (lines.length > 2) setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  // Smart fill: when account changes, auto-suggest debit/credit side
  function handleAccountChange(idx: number, accountId: string) {
    const acc = accounts.find((a) => a.id === accountId);
    updateLine(idx, 'accountId', accountId);
    // If selecting income account on a blank line, suggest credit side
    if (acc?.type === 'income' && !lines[idx].creditAmount && !lines[idx].debitAmount) {
      setLines((prev) => prev.map((l, i) =>
        i === idx ? { ...l, accountId, creditAmount: '' } : l
      ));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!isBalanced) {
      setError(`Journal entry is not balanced. Difference: RM ${Math.abs(difference).toFixed(2)}`);
      return;
    }

    const validLines = lines.filter(
      (l) => l.accountId && l.fundId && (parseFloat(l.debitAmount) > 0 || parseFloat(l.creditAmount) > 0)
    );

    if (validLines.length < 2) {
      setError('A journal entry requires at least 2 lines with amounts.');
      return;
    }

    startTransition(async () => {
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          entryDate,
          description,
          referenceNo: referenceNo || null,
          entryType,
          periodYear:  new Date(entryDate).getFullYear(),
          periodMonth: new Date(entryDate).getMonth() + 1,
          lines: validLines.map((l) => ({
            accountId:    l.accountId,
            fundId:       l.fundId,
            projectId:    l.projectId || null,
            debitAmount:  parseFloat(l.debitAmount)  || 0,
            creditAmount: parseFloat(l.creditAmount) || 0,
            description:  l.description || null,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Journal entry recorded successfully.');
        setDescription(''); setReferenceNo('');
        setLines([emptyLine(), emptyLine()]);
        setTimeout(() => window.location.href = basePath ? `${basePath}/accounting/transactions` : '/accounting/transactions', 1500);
      }
    });
  }

  const fmt = (n: number) => n.toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Entry metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input type="date" required value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Entry type</label>
          <select value={entryType} onChange={(e) => setEntryType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="manual">Manual entry</option>
            <option value="donation">Donation received</option>
            <option value="fund_transfer">Fund transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Reference no. <span className="text-gray-400">(optional)</span>
          </label>
          <input type="text" placeholder="Receipt / cheque / voucher no."
            value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Narration / description <span className="text-red-500">*</span>
        </label>
        <input type="text" required placeholder="e.g. Zakat received from community — March 2026"
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Lines table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Journal lines</p>
          <p className="text-[10px] text-gray-400">Every RM must answer: which account? which fund?</p>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {/* Column headers */}
          <div className="grid gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-medium text-gray-500 uppercase tracking-wide"
            style={{ gridTemplateColumns: '2.5fr 1.5fr 1.2fr 1fr 1fr 1.5fr 0.3fr' }}>
            <div>Account</div>
            <div>Fund</div>
            <div>Project</div>
            <div className="text-right">Debit (Dr)</div>
            <div className="text-right">Credit (Cr)</div>
            <div>Line note</div>
            <div />
          </div>

          {/* Lines */}
          {lines.map((line, idx) => (
            <div key={idx}
              className="grid gap-2 px-3 py-2 border-b border-gray-100 last:border-0 items-center"
              style={{ gridTemplateColumns: '2.5fr 1.5fr 1.2fr 1fr 1fr 1.5fr 0.3fr' }}>

              {/* Account */}
              <select value={line.accountId}
                onChange={(e) => handleAccountChange(idx, e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           focus:outline-none focus:ring-1 focus:ring-emerald-400">
                <option value="">— Select account —</option>
                <optgroup label="Assets (1000)">
                  {assetAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Liabilities (2000)">
                  {liabilityAccs.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Fund Balances (3000)">
                  {equityAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Income (4000)">
                  {incomeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Expenses (5000)">
                  {expenseAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} {a.name}</option>
                  ))}
                </optgroup>
              </select>

              {/* Fund */}
              <select value={line.fundId}
                onChange={(e) => updateLine(idx, 'fundId', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           focus:outline-none focus:ring-1 focus:ring-emerald-400">
                <option value="">— Fund —</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
                ))}
              </select>

              {/* Project */}
              <select value={line.projectId}
                onChange={(e) => updateLine(idx, 'projectId', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           focus:outline-none focus:ring-1 focus:ring-emerald-400">
                <option value="">—</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Debit */}
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={line.debitAmount}
                onChange={(e) => {
                  updateLine(idx, 'debitAmount', e.target.value);
                  if (e.target.value) updateLine(idx, 'creditAmount', '');
                }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           text-right font-mono focus:outline-none focus:ring-1 focus:ring-red-400
                           focus:border-red-300" />

              {/* Credit */}
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={line.creditAmount}
                onChange={(e) => {
                  updateLine(idx, 'creditAmount', e.target.value);
                  if (e.target.value) updateLine(idx, 'debitAmount', '');
                }}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-400
                           focus:border-emerald-300" />

              {/* Line note */}
              <input type="text" placeholder="Optional"
                value={line.description}
                onChange={(e) => updateLine(idx, 'description', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-[11px]
                           focus:outline-none focus:ring-1 focus:ring-emerald-400" />

              {/* Remove line */}
              <button type="button" onClick={() => removeLine(idx)}
                disabled={lines.length <= 2}
                className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-sm font-medium
                           transition-colors text-center">
                ×
              </button>
            </div>
          ))}

          {/* Totals row */}
          <div className="grid gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200 items-center"
            style={{ gridTemplateColumns: '2.5fr 1.5fr 1.2fr 1fr 1fr 1.5fr 0.3fr' }}>
            <div className="col-span-3 flex items-center gap-2">
              <button type="button" onClick={addLine}
                disabled={lines.length >= 10}
                className="text-[11px] text-emerald-600 hover:text-emerald-800 font-medium disabled:opacity-40">
                + Add line
              </button>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-red-700 font-mono">
                {fmt(totalDebits)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-emerald-700 font-mono">
                {fmt(totalCredits)}
              </p>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              {totalDebits > 0 && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isBalanced
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isBalanced
                    ? '✓ Balanced'
                    : `Diff: ${fmt(Math.abs(difference))}`
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Double-entry rule reminder */}
      <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
        <p className="text-[10px] text-blue-700">
          <strong>Double-entry rule:</strong> Every transaction must have equal debits and credits.
          Example — Zakat received: Dr Bank–Zakat (1120) / Cr Zakat Received (4110).
          Total Debits must equal Total Credits before saving.
        </p>
      </div>

      {error   && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3"><p className="text-[12px] text-red-700">{error}</p></div>}
      {success && <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3"><p className="text-[12px] text-emerald-700">{success}</p></div>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending || !isBalanced}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {isPending ? 'Saving…' : 'Save journal entry'}
        </button>
        <a href={basePath ? `${basePath}/accounting/transactions` : "/accounting/transactions"}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                     rounded-md hover:bg-gray-50 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
