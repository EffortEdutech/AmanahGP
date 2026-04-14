'use server';
// apps/org/lib/accounting-actions.ts
// amanahOS — Fund Accounting Server Actions
//
// All write operations go through these server actions.
// Uses service client for writes (RLS UUID mismatch workaround).
// Validates org membership before every write.

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';

// ── Helper: resolve auth user → platform user + org membership ──
async function resolveOrgAccess(orgId: string) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users')
    .select('id, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!platformUser) throw new Error('User record not found');

  const { data: membership } = await service
    .from('org_members')
    .select('org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .single();

  if (!membership) throw new Error('Not a member of this organisation');

  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  return { platformUser, membership, isManager, service };
}

// ── Action: Create journal entry with lines ──────────────────────
export type JournalEntryInput = {
  orgId: string;
  entryDate: string;         // ISO date string
  description: string;
  referenceNo?: string;
  periodYear: number;
  periodMonth: number;
  lines: Array<{
    accountId: string;
    fundId: string;
    projectId?: string;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }>;
};

export async function createJournalEntry(input: JournalEntryInput) {
  const { platformUser, isManager, service } = await resolveOrgAccess(input.orgId);

  if (!isManager) {
    return { error: 'Only org_admin or org_manager can create journal entries.' };
  }

  // Validate: debits must equal credits
  const totalDebits  = input.lines.reduce((s, l) => s + l.debitAmount,  0);
  const totalCredits = input.lines.reduce((s, l) => s + l.creditAmount, 0);
  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    return { error: `Journal entry is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}` };
  }

  // Validate: at least 2 lines
  if (input.lines.length < 2) {
    return { error: 'A journal entry requires at least 2 lines.' };
  }

  // Insert header
  const { data: entry, error: entryError } = await service
    .from('journal_entries')
    .insert({
      organization_id:     input.orgId,
      entry_date:          input.entryDate,
      description:         input.description,
      reference_no:        input.referenceNo ?? null,
      period_year:         input.periodYear,
      period_month:        input.periodMonth,
      entry_type:          'manual',
      created_by_user_id:  platformUser.id,
    })
    .select('id')
    .single();

  if (entryError || !entry) {
    return { error: `Failed to create entry: ${entryError?.message}` };
  }

  // Insert lines
  const lines = input.lines.map((l) => ({
    journal_entry_id: entry.id,
    organization_id:  input.orgId,
    account_id:       l.accountId,
    fund_id:          l.fundId,
    project_id:       l.projectId ?? null,
    debit_amount:     l.debitAmount,
    credit_amount:    l.creditAmount,
    description:      l.description ?? null,
  }));

  const { error: linesError } = await service
    .from('journal_lines')
    .insert(lines);

  if (linesError) {
    // Roll back entry if lines failed
    await service.from('journal_entries').delete().eq('id', entry.id);
    return { error: `Failed to create lines: ${linesError.message}` };
  }

  return { success: true, entryId: entry.id };
}

// ── Action: Quick income entry (simplified form) ──────────────────
// Creates a balanced 2-line entry: Bank Dr / Fund Income Cr
export type QuickIncomeInput = {
  orgId:       string;
  entryDate:   string;
  description: string;
  amount:      number;
  fundId:      string;
  bankAccountId:   string;
  incomeAccountId: string;
  referenceNo?: string;
};

export async function createQuickIncome(input: QuickIncomeInput) {
  return createJournalEntry({
    orgId:       input.orgId,
    entryDate:   input.entryDate,
    description: input.description,
    referenceNo: input.referenceNo,
    periodYear:  new Date(input.entryDate).getFullYear(),
    periodMonth: new Date(input.entryDate).getMonth() + 1,
    lines: [
      {
        accountId:    input.bankAccountId,
        fundId:       input.fundId,
        debitAmount:  input.amount,
        creditAmount: 0,
        description:  'Cash / bank received',
      },
      {
        accountId:    input.incomeAccountId,
        fundId:       input.fundId,
        debitAmount:  0,
        creditAmount: input.amount,
        description:  'Donation / income',
      },
    ],
  });
}

// ── Action: Quick expense entry ───────────────────────────────────
// Creates a balanced 2-line entry: Expense Dr / Bank Cr
export type QuickExpenseInput = {
  orgId:            string;
  entryDate:        string;
  description:      string;
  amount:           number;
  fundId:           string;
  expenseAccountId: string;
  bankAccountId:    string;
  projectId?:       string;
  referenceNo?:     string;
};

export async function createQuickExpense(input: QuickExpenseInput) {
  return createJournalEntry({
    orgId:       input.orgId,
    entryDate:   input.entryDate,
    description: input.description,
    referenceNo: input.referenceNo,
    periodYear:  new Date(input.entryDate).getFullYear(),
    periodMonth: new Date(input.entryDate).getMonth() + 1,
    lines: [
      {
        accountId:    input.expenseAccountId,
        fundId:       input.fundId,
        projectId:    input.projectId,
        debitAmount:  input.amount,
        creditAmount: 0,
        description:  'Expense incurred',
      },
      {
        accountId:    input.bankAccountId,
        fundId:       input.fundId,
        debitAmount:  0,
        creditAmount: input.amount,
        description:  'Bank / cash payment',
      },
    ],
  });
}
