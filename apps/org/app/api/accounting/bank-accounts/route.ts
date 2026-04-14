// apps/org/app/api/accounting/bank-accounts/route.ts
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
  const { orgId, accountName, bankName, accountNumber, accountType, fundType,
          linkedAccountId, openingBalance, openingBalanceDate, isPrimary } = body;

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const { data, error } = await service
    .from('bank_accounts')
    .insert({
      organization_id:       orgId,
      account_name:          accountName,
      bank_name:             bankName,
      account_number:        accountNumber,
      account_type:          accountType,
      fund_type:             fundType,
      linked_account_id:     linkedAccountId,
      opening_balance:       openingBalance ?? 0,
      opening_balance_date:  openingBalanceDate,
      is_primary:            isPrimary ?? false,
    })
    .select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
