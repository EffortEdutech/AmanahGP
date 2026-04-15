// apps/org/app/api/reports/route.ts
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
  const {
    orgId, projectId, title, reportDate, narrative,
    beneficiariesReached, spendToDate, milestonesCompleted, nextSteps, submitNow,
  } = body;

  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();

  if (!membership || !['org_admin','org_manager'].includes(membership.org_role))
    return NextResponse.json({ error: 'Manager role required' }, { status: 403 });

  if (!title || title.trim().length < 3)
    return NextResponse.json({ error: 'Report title must be at least 3 characters' }, { status: 400 });
  if (!narrative || narrative.trim().length < 20)
    return NextResponse.json({ error: 'Narrative must be at least 20 characters' }, { status: 400 });

  const reportBody = {
    narrative,
    beneficiaries_reached:  beneficiariesReached ? parseInt(beneficiariesReached) : null,
    spend_to_date:          spendToDate ? parseFloat(spendToDate) : null,
    milestones_completed:   milestonesCompleted || null,
    next_steps:             nextSteps || null,
  };

  const submissionStatus = submitNow ? 'submitted' : 'draft';

  const { data, error } = await service
    .from('project_reports')
    .insert({
      organization_id:    orgId,
      project_id:         projectId || null,
      title,
      report_body:        reportBody,
      report_date:        reportDate || null,
      submission_status:  submissionStatus,
      submitted_at:       submitNow ? new Date().toISOString() : null,
    })
    .select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit trust event if submitted
  if (submitNow) {
    await service.rpc('emit_trust_event', {
      p_org_id:          orgId,
      p_event_type:      'trn_report_submitted',
      p_pillar:          'transparency',
      p_score_delta:     5,
      p_source:          'user',
      p_payload:         { report_id: data.id, title },
      p_actor_user_id:   platformUser.id,
      p_idempotency_key: `trn_report_${data.id}`,
      p_ref_table:       'project_reports',
      p_ref_id:          data.id,
    });
  }

  return NextResponse.json({ success: true, id: data.id });
}
