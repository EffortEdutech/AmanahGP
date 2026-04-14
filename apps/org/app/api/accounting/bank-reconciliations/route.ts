// apps/org/app/api/accounting/bank-reconciliations/route.ts
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { orgId, bankAccountId, periodYear, periodMonth, statementDate,
          statementEndingBalance, bookBalance, status, notes, reconId } = body;

  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const payload = {
    organization_id:          orgId,
    bank_account_id:          bankAccountId,
    period_year:              periodYear,
    period_month:             periodMonth,
    statement_date:           statementDate,
    statement_ending_balance: statementEndingBalance,
    book_balance:             bookBalance,
    status,
    notes,
    ...(status === 'reconciled' || status === 'discrepancy' ? {
      reconciled_at:          new Date().toISOString(),
      reconciled_by_user_id:  platformUser.id,
    } : {}),
  };

  let result;
  if (reconId) {
    result = await service
      .from('bank_reconciliations')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', reconId)
      .select('id').single();
  } else {
    result = await service
      .from('bank_reconciliations')
      .insert(payload)
      .select('id').single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: result.data?.id });
}
