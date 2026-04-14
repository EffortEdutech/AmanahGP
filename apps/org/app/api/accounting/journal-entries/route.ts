// apps/org/app/api/accounting/journal-entries/route.ts
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
  const { orgId, entryDate, description, referenceNo, entryType,
          periodYear, periodMonth, lines } = body;

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id).eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  // Validate balance
  const totalDebits  = lines.reduce((s: number, l: { debitAmount: number })  => s + (l.debitAmount  || 0), 0);
  const totalCredits = lines.reduce((s: number, l: { creditAmount: number }) => s + (l.creditAmount || 0), 0);
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    return NextResponse.json({
      error: `Journal entry not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`
    }, { status: 400 });
  }

  // Insert journal entry
  const { data: entry, error: entryError } = await service
    .from('journal_entries')
    .insert({
      organization_id:    orgId,
      entry_date:         entryDate,
      description,
      reference_no:       referenceNo,
      entry_type:         entryType || 'manual',
      period_year:        periodYear,
      period_month:       periodMonth,
      created_by_user_id: platformUser.id,
    })
    .select('id').single();

  if (entryError || !entry) {
    return NextResponse.json({ error: entryError?.message ?? 'Failed to create entry' }, { status: 500 });
  }

  // Insert lines
  const lineRows = lines.map((l: {
    accountId: string; fundId: string; projectId?: string;
    debitAmount: number; creditAmount: number; description?: string;
  }) => ({
    journal_entry_id: entry.id,
    organization_id:  orgId,
    account_id:       l.accountId,
    fund_id:          l.fundId,
    project_id:       l.projectId || null,
    debit_amount:     l.debitAmount  || 0,
    credit_amount:    l.creditAmount || 0,
    description:      l.description  || null,
  }));

  const { error: linesError } = await service.from('journal_lines').insert(lineRows);

  if (linesError) {
    await service.from('journal_entries').delete().eq('id', entry.id);
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, entryId: entry.id });
}
