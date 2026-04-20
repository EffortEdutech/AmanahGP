'use client';
// apps/org/components/accounting/new-payment-request-form.tsx

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface Props {
  orgId:            string;
  userId:           string;
  requestNo:        string;
  funds:            Array<{ id: string; code: string; name: string; type: string }>;
  expenseAccounts:  Array<{ id: string; code: string; name: string }>;
  bankAccounts:     Array<{ id: string; name: string; bank: string | null; fundType: string | null }>;
  projects:         Array<{ id: string; title: string }>;
  basePath:         string;
}

const LARGE_THRESHOLD = 5000;

export function NewPaymentRequestForm({
  orgId, userId, requestNo, funds, expenseAccounts, bankAccounts, projects, basePath,
}: Props) {
  const router = useRouter();
  const [description,   setDescription]  = useState('');
  const [amount,        setAmount]        = useState('');
  const [vendorName,    setVendorName]    = useState('');
  const [referenceNo,   setReferenceNo]   = useState('');
  const [paymentDate,   setPaymentDate]   = useState('');
  const [fundId,        setFundId]        = useState('');
  const [expenseAccId,  setExpenseAccId]  = useState('');
  const [bankAccId,     setBankAccId]     = useState('');
  const [projectId,     setProjectId]     = useState('');
  const [error,         setError]         = useState('');
  const [isPending,     startTransition]  = useTransition();

  const amountNum = parseFloat(amount) || 0;
  const isLarge   = amountNum >= LARGE_THRESHOLD;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/accounting/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:          'create',
          orgId,
          currentUserId:   userId,
          requestNo,
          description,
          amount:          amountNum,
          fundId,
          expenseAccountId: expenseAccId || null,
          bankAccountId:    bankAccId    || null,
          projectId:        projectId    || null,
          vendorName:       vendorName   || null,
          referenceNo:      referenceNo  || null,
          paymentDate:      paymentDate  || null,
          isLargeTransaction: isLarge,
          largeTransactionThreshold: isLarge ? LARGE_THRESHOLD : null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.push(`${basePath}/accounting/payment-requests/${data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">

      {/* Request no */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">Request no.</span>
        <span className="text-[12px] font-mono font-semibold text-gray-700">{requestNo}</span>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <input type="text" required
          placeholder="e.g. Food aid supplies — May distribution"
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Amount (RM) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RM</span>
          <input type="number" required min="0.01" step="0.01"
            placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-[15px] font-mono
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {isLarge && amountNum > 0 && (
          <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <span>⚠</span> Large transaction — requires additional committee endorsement
          </p>
        )}
      </div>

      {/* Fund + Account */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Fund <span className="text-red-500">*</span>
          </label>
          <select required value={fundId} onChange={(e) => setFundId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Select fund —</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Expense account</label>
          <select value={expenseAccId} onChange={(e) => setExpenseAccId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Select —</option>
            {expenseAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bank account + project */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Pay from bank account</label>
          <select value={bankAccId} onChange={(e) => setBankAccId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Select —</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}{b.bank ? ` (${b.bank})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Project (optional)</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor + reference */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Vendor / Payee</label>
          <input type="text" placeholder="e.g. Kedai Pembekal Makanan"
            value={vendorName} onChange={(e) => setVendorName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Invoice / Ref. no.</label>
          <input type="text" placeholder="e.g. INV-2026-042"
            value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {/* Payment date */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">Requested payment date</label>
        <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-medium rounded-lg transition-colors disabled:opacity-40">
          {isPending ? 'Saving…' : 'Save as draft'}
        </button>
        <a href={`${basePath}/accounting/payment-requests`}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                     rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
