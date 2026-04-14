'use client';
// apps/org/components/accounting/quick-entry-form.tsx
// amanahOS — Quick Transaction Entry Form
// Handles both income (donation received) and expense (payment made).
// Builds a balanced 2-line journal entry under the hood.

import { useState, useTransition } from 'react';
import { createQuickIncome, createQuickExpense } from '@/lib/accounting-actions';

interface Fund    { id: string; code: string; name: string; type: string; }
interface Account { id: string; code: string; name: string; type: string; normalBalance: string; }

interface Props {
  orgId:    string;
  funds:    Fund[];
  accounts: Account[];
}

export function QuickEntryForm({ orgId, funds, accounts }: Props) {
  const [mode,        setMode]        = useState<'income' | 'expense'>('income');
  const [fundId,      setFundId]      = useState(funds[0]?.id ?? '');
  const [amount,      setAmount]      = useState('');
  const [description, setDescription] = useState('');
  const [entryDate,   setEntryDate]   = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [accountId,   setAccountId]   = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [isPending,   startTransition] = useTransition();

  // Filter accounts by type
  const incomeAccounts  = accounts.filter((a) => a.type === 'income');
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');
  const bankAccounts    = accounts.filter((a) => a.type === 'asset');

  const bankAccount = bankAccounts[0]; // Default: first asset account (cash/bank)

  function handleModeChange(m: 'income' | 'expense') {
    setMode(m);
    setAccountId('');
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!fundId)    { setError('Please select a fund.');    return; }
    if (!accountId) { setError('Please select an account.'); return; }
    if (!bankAccount) { setError('No bank/cash account found in chart of accounts.'); return; }

    startTransition(async () => {
      let result;

      if (mode === 'income') {
        result = await createQuickIncome({
          orgId,
          entryDate,
          description,
          amount:          amountNum,
          fundId,
          bankAccountId:   bankAccount.id,
          incomeAccountId: accountId,
          referenceNo:     referenceNo || undefined,
        });
      } else {
        result = await createQuickExpense({
          orgId,
          entryDate,
          description,
          amount:           amountNum,
          fundId,
          expenseAccountId: accountId,
          bankAccountId:    bankAccount.id,
          referenceNo:      referenceNo || undefined,
        });
      }

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Transaction recorded successfully.');
        setAmount('');
        setDescription('');
        setReferenceNo('');
      }
    });
  }

  const relevantAccounts = mode === 'income' ? incomeAccounts : expenseAccounts;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-5">
        {(['income', 'expense'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              mode === m
                ? m === 'income'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'bg-white text-red-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'income' ? '+ Income received' : '− Expense paid'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Amount (MYR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 font-medium">RM</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-[13px]
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Fund */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Fund <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code} — {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              {mode === 'income' ? 'Income account' : 'Expense account'} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select account…</option>
              {relevantAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={mode === 'income' ? 'e.g. Sadaqah donation — Friday collection' : 'e.g. Food aid — 50 families'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Reference (optional) */}
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Reference number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. REC-2026-001 or cheque no."
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Bank account note */}
        {bankAccount && (
          <p className="text-[10px] text-gray-400">
            Bank/cash account: {bankAccount.code} — {bankAccount.name}
          </p>
        )}

        {/* Error / success */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-[12px] text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
            <p className="text-[12px] text-emerald-700">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={`px-5 py-2.5 text-sm font-medium rounded-md text-white transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${mode === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                      }`}
        >
          {isPending ? 'Saving…' : mode === 'income' ? 'Record income' : 'Record expense'}
        </button>
      </form>
    </div>
  );
}
