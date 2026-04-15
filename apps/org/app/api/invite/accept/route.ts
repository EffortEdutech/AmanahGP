// apps/org/app/api/invite/accept/route.ts
// Sprint 28 — Accept organisation invitation
//
// Called after the user has authenticated (sign in or sign up).
// Validates token, creates org_members record, marks invitation accepted.
// Uses service client to bypass RLS for the member creation.

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  // User must be authenticated at this point
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Must be signed in to accept invitation' }, { status: 401 });

  // Resolve platform user (may have just been created by signup trigger)
  let platformUser: { id: string; email: string } | null = null;

  // Retry up to 3 times — Supabase auth trigger may have a small delay
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await service
      .from('users').select('id, email')
      .eq('auth_provider_user_id', user.id).maybeSingle();
    if (data) { platformUser = data; break; }
    await new Promise((r) => setTimeout(r, 600));
  }

  if (!platformUser) {
    return NextResponse.json({
      error: 'User profile not found. Please wait a moment and try again.'
    }, { status: 404 });
  }

  const { token, invitationId, orgId, orgRole } = await request.json();

  // Re-validate token server-side (client could be tampered)
  const { data: invitation } = await service
    .from('org_invitations')
    .select('id, organization_id, invited_email, org_role, status, expires_at')
    .eq('token', token)
    .eq('id', invitationId)
    .single();

  if (!invitation)                                    return NextResponse.json({ error: 'Invitation not found' },        { status: 404 });
  if (invitation.status === 'accepted')               return NextResponse.json({ error: 'Already accepted' },            { status: 400 });
  if (invitation.status === 'revoked')                return NextResponse.json({ error: 'Invitation revoked' },          { status: 400 });
  if (new Date(invitation.expires_at) < new Date())   return NextResponse.json({ error: 'Invitation expired' },          { status: 400 });
  if (invitation.organization_id !== orgId)           return NextResponse.json({ error: 'Organisation mismatch' },       { status: 400 });
  if (invitation.org_role !== orgRole)                return NextResponse.json({ error: 'Role mismatch' },               { status: 400 });

  // Check not already a member
  const { data: existingMember } = await service
    .from('org_members')
    .select('id').eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').maybeSingle();

  if (existingMember) {
    // Already a member — still mark invitation accepted and redirect
    await service.from('org_invitations').update({
      status:      'accepted',
      accepted_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }).eq('id', invitationId);
    return NextResponse.json({ success: true, alreadyMember: true });
  }

  // Create org_members record
  const { error: memberError } = await service.from('org_members').insert({
    organization_id:  orgId,
    user_id:          platformUser.id,
    org_role:         invitation.org_role,
    status:           'active',
    invited_at:       new Date().toISOString(),
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  });

  if (memberError) {
    console.error('[invite/accept] org_members insert error:', memberError.message);
    return NextResponse.json({ error: 'Failed to add member: ' + memberError.message }, { status: 500 });
  }

  // Mark invitation accepted
  const { error: invError } = await service.from('org_invitations').update({
    status:      'accepted',
    accepted_at: new Date().toISOString(),
    updated_at:  new Date().toISOString(),
  }).eq('id', invitationId);

  if (invError) {
    console.error('[invite/accept] invitation update error:', invError.message);
    // Non-fatal — member was created successfully
  }

  // Emit trust event for team growth (SoD readiness)
  const { count: memberCount } = await service
    .from('org_members').select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId).eq('status', 'active');

  if ((memberCount ?? 0) >= 2) {
    await service.rpc('emit_trust_event', {
      p_org_id:          orgId,
      p_event_type:      'gov_role_segregation_verified',
      p_pillar:          'governance',
      p_score_delta:     7,
      p_source:          'system',
      p_payload:         { member_count: memberCount, new_member_user_id: platformUser.id },
      p_actor_user_id:   platformUser.id,
      p_idempotency_key: `gov_sod_${orgId}`,
      p_ref_table:       'org_members',
      p_ref_id:          null,
    });
  }

  return NextResponse.json({ success: true });
}
