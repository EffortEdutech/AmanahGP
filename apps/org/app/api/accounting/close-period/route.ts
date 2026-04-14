// apps/org/app/api/accounting/close-period/route.ts
import { createClient }        from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await request.json();
  const { orgId, year, month, notes } = body;

  // Call the close_period RPC (already exists from Sprint 16 migration)
  const { data, error } = await supabase.rpc('close_period', {
    p_org_id: orgId,
    p_year:   year,
    p_month:  month,
    p_notes:  notes ?? null,
  });

  if (error) {
    const msg = error.message?.replace('close_period failed: ', '') ?? 'Period close failed.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({
    success:       true,
    entriesLocked: data.entries_locked,
    totalIncome:   data.total_income,
    totalExpense:  data.total_expense,
    netMovement:   data.net_movement,
  });
}
