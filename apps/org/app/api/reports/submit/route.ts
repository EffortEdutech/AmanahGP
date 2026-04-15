// apps/org/app/api/reports/submit/route.ts
// Sprint 27 — Submit / Resubmit report
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

  const { reportId, orgId } = await request.json();

  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();
  if (!membership || !['org_admin','org_manager'].includes(membership.org_role))
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });

  const { data: report } = await service
    .from('project_reports').select('id, title, submission_status, verification_status')
    .eq('id', reportId).eq('organization_id', orgId).single();
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  // Allow submit from draft OR resubmit from changes_requested
  const canSubmit = report.submission_status === 'draft' ||
                    report.verification_status === 'changes_requested';
  if (!canSubmit) return NextResponse.json({ error: 'Report cannot be submitted at this stage.' }, { status: 400 });

  const { error } = await service.from('project_reports').update({
    submission_status:   'submitted',
    verification_status: 'pending', // reset to pending on resubmit
    submitted_at:        new Date().toISOString(),
    reviewer_comment:    null,       // clear previous reviewer comment
    updated_at:          new Date().toISOString(),
  }).eq('id', reportId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit trust event (idempotent per report)
  await service.rpc('emit_trust_event', {
    p_org_id:          orgId,
    p_event_type:      'trn_report_submitted',
    p_pillar:          'transparency',
    p_score_delta:     5,
    p_source:          'user',
    p_payload:         { report_id: reportId, title: report.title },
    p_actor_user_id:   platformUser.id,
    p_idempotency_key: `trn_report_${reportId}`,
    p_ref_table:       'project_reports',
    p_ref_id:          reportId,
  });

  return NextResponse.json({ success: true });
}
