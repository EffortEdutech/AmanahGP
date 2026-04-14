'use client';
// apps/org/components/accounting/add-bank-account-form.tsx

import { useState, useTransition } from 'react';
import { createServiceClient }     from '@/lib/supabase/service';

interface Props {
  orgId: string;
  assetAccounts: Array<{ id: string; code: string; name: string }>;
}

export function AddBankAccountForm({ orgId, assetAccounts }: Props) {
  const [accountName,    setAccountName]    = useState('');
  const [bankName,       setBankName]       = useState('');
  const [accountNumber,  setAccountNumber]  = useState('');
  const [accountType,    setAccountType]    = useState<'bank' | 'cash' | 'e_wallet' | 'payment_gateway'>('bank');
  const [fundType,       setFundType]       = useState<string>('general');
  const [linkedAccount,  setLinkedAccount]  = useState('');
  const [openingBalance, setOpeningBalance] = useState('0.00');
  const [openingDate,    setOpeningDate]    = useState(new Date().toISOString().split('T')[0]);
  const [isPrimary,      setIsPrimary]      = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState('');
  const [isPending,      startTransition]   = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');

    startTransition(async () => {
      const res = await fetch('/api/accounting/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          accountName,
          bankName:         bankName || null,
          accountNumber:    accountNumber || null,
          accountType,
          fundType,
          linkedAccountId:  linkedAccount || null,
          openingBalance:   parseFloat(openingBalance) || 0,
          openingBalanceDate: openingDate,
          isPrimary,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Bank account added successfully.');
        setAccountName(''); setBankName(''); setAccountNumber('');
        setOpeningBalance('0.00'); setIsPrimary(false);
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Account label <span className="text-red-500">*</span>
            </label>
            <input type="text" required placeholder="e.g. Maybank Current – General"
              value={accountName} onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Account type</label>
            <select value={accountType}
              onChange={(e) => setAccountType(e.target.value as typeof accountType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="bank">Bank account</option>
              <option value="cash">Cash / petty cash</option>
              <option value="e_wallet">E-wallet</option>
              <option value="payment_gateway">Payment gateway</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Fund type</label>
            <select value={fundType} onChange={(e) => setFundType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="general">General</option>
              <option value="zakat">Zakat</option>
              <option value="waqf">Waqf</option>
              <option value="sadaqah">Sadaqah</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Bank name <span className="text-gray-400">(optional)</span>
            </label>
            <input type="text" placeholder="e.g. Maybank Berhad"
              value={bankName} onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Account number <span className="text-gray-400">(last 4 digits or masked)</span>
            </label>
            <input type="text" placeholder="e.g. ****-6789"
              value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Link to CoA account <span className="text-gray-400">(optional)</span>
            </label>
            <select value={linkedAccount} onChange={(e) => setLinkedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Select account —</option>
              {assetAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Opening balance (RM)</label>
            <input type="number" step="0.01" min="0"
              value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Opening balance date</label>
            <input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-[12px] text-gray-700">Set as primary operating account</span>
        </label>

        {error   && <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
        {success && <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">{success}</p>}

        <button type="submit" disabled={isPending}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-medium rounded-md transition-colors disabled:opacity-50">
          {isPending ? 'Adding…' : 'Add bank account'}
        </button>
      </form>
    </div>
  );
}
