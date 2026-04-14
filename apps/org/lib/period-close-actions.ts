'use server';
// apps/org/lib/period-close-actions.ts
// Sprint 16 — Period close server action
// Calls the close_period() RPC function in Supabase.

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect }            from 'next/navigation';

export type ClosePeriodInput = {
  orgId:   string;
  year:    number;
  month?:  number;   // undefined = full-year close
  notes?:  string;
};

export type ClosePeriodResult = {
  success: true;
  closeId:          string;
  snapshotId:       string;
  entriesLocked:    number;
  totalIncome:      number;
  totalExpense:     number;
  netMovement:      number;
  programmeExpense: number;
  adminExpense:     number;
  hasZakatFund:     boolean;
} | {
  success: false;
  error:   string;
};

export async function closePeriod(input: ClosePeriodInput): Promise<ClosePeriodResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify membership before calling RPC
  const { data: platformUser } = await supabase
    .from('users')
    .select('id, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!platformUser) {
    return { success: false, error: 'User record not found.' };
  }

  const service = createServiceClient();
  const { data: membership } = await service
    .from('org_members')
    .select('org_role')
    .eq('organization_id', input.orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return { success: false, error: 'Only org_admin or org_manager can close a period.' };
  }

  // Call the close_period RPC
  const { data, error } = await supabase.rpc('close_period', {
    p_org_id: input.orgId,
    p_year:   input.year,
    p_month:  input.month ?? null,
    p_notes:  input.notes ?? null,
  });

  if (error) {
    // Surface friendly message from the RPC exception
    const msg = error.message?.replace('close_period failed: ', '') ?? 'Period close failed.';
    return { success: false, error: msg };
  }

  const r = data as {
    close_id:          string;
    snapshot_id:       string;
    entries_locked:    number;
    total_income:      number;
    total_expense:     number;
    net_movement:      number;
    programme_expense: number;
    admin_expense:     number;
    has_zakat_fund:    boolean;
  };

  return {
    success:          true,
    closeId:          r.close_id,
    snapshotId:       r.snapshot_id,
    entriesLocked:    r.entries_locked,
    totalIncome:      r.total_income,
    totalExpense:     r.total_expense,
    netMovement:      r.net_movement,
    programmeExpense: r.programme_expense,
    adminExpense:     r.admin_expense,
    hasZakatFund:     r.has_zakat_fund,
  };
}
