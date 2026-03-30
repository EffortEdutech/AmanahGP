// apps/admin/app/api/orgs/[orgId]/financials/[year]/route.ts
// AmanahHub Console — Read financial snapshot for a given year

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Props { params: Promise<{ orgId: string; year: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { orgId, year } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { data: hasRole } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_viewer' });
  if (!hasRole) return NextResponse.json({ ok: false }, { status: 403 });

  const { data } = await supabase
    .from('financial_snapshots')
    .select(`
      id, period_year, currency, inputs,
      submission_status, verification_status,
      submitted_at, verified_at, reviewer_comment
    `)
    .eq('organization_id', orgId)
    .eq('period_year', parseInt(year, 10))
    .maybeSingle();

  return NextResponse.json({ ok: true, data });
}
