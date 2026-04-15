// apps/org/app/api/projects/route.ts
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
  if (!platformUser) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { action, orgId, projectId, title, objective, description, location_text,
          start_date, end_date, budget_amount, status, is_public, beneficiary_summary } = body;

  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();
  if (!membership || !['org_admin','org_manager'].includes(membership.org_role))
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });

  const payload = {
    organization_id:     orgId,
    title, objective,
    description:         description || null,
    location_text:       location_text || null,
    start_date:          start_date || null,
    end_date:            end_date || null,
    budget_amount:       budget_amount ? parseFloat(budget_amount) : null,
    status:              status || 'draft',
    is_public:           !!is_public,
    beneficiary_summary: beneficiary_summary || null,
    updated_at:          new Date().toISOString(),
  };

  if (action === 'create') {
    const { data, error } = await service.from('projects').insert(payload).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  }

  if (action === 'edit' && projectId) {
    const { error } = await service.from('projects').update(payload)
      .eq('id', projectId).eq('organization_id', orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
