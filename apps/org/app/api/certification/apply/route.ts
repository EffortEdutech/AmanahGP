// apps/org/app/api/certification/apply/route.ts
// Sprint 23 — Certification Application API
// Creates certification_application with status = 'submitted'

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { orgId, notes } = body;

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin', 'org_manager'].includes(membership.org_role)) {
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });
  }

  // Guard: no active application already
  const { data: existing } = await service
    .from('certification_applications')
    .select('id, status')
    .eq('organization_id', orgId)
    .not('status', 'in', '(rejected)')
    .limit(1).maybeSingle();

  if (existing) {
    return NextResponse.json({
      error: `An active application already exists (status: ${existing.status}).`
    }, { status: 400 });
  }

  // Create the application
  const { data, error } = await service
    .from('certification_applications')
    .insert({
      organization_id:        orgId,
      status:                 'submitted',
      submitted_at:           new Date().toISOString(),
      submitted_by_user_id:   platformUser.id,
      reviewer_comment:       notes || null,
    })
    .select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit trust event
  await service.rpc('emit_trust_event', {
    p_org_id:          orgId,
    p_event_type:      'certification_updated',
    p_pillar:          'compliance',
    p_score_delta:     0,
    p_source:          'user',
    p_payload:         { action: 'application_submitted', application_id: data.id },
    p_actor_user_id:   platformUser.id,
    p_idempotency_key: `cert_apply_${data.id}`,
    p_ref_table:       'certification_applications',
    p_ref_id:          data.id,
  });

  return NextResponse.json({ success: true, applicationId: data.id });
}
