// apps/user/app/api/invite/accept/route.ts
// AmanahHub — Accept org invitation API route

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { token } = await request.json() as { token: string };
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token required' }, { status: 400 });
  }

  const svc = createServiceClient();

  // Get current user internal id
  const { data: currentUser } = await svc
    .from('users')
    .select('id')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  // Look up invitation
  const { data: invite } = await svc
    .from('org_invitations')
    .select('id, organization_id, org_role, status, expires_at')
    .eq('token', token)
    .single();

  if (!invite) {
    return NextResponse.json({ ok: false, error: 'Invitation not found' }, { status: 404 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json(
      { ok: false, error: `Invitation already ${invite.status}` },
      { status: 400 }
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    await svc.from('org_invitations').update({ status: 'expired' }).eq('id', invite.id);
    return NextResponse.json({ ok: false, error: 'Invitation has expired' }, { status: 400 });
  }

  // Add as org member
  const { error: memberError } = await svc.from('org_members').insert({
    organization_id:    invite.organization_id,
    user_id:            currentUser.id,
    org_role:           invite.org_role,
    status:             'active',
    accepted_at:        new Date().toISOString(),
  });

  if (memberError) {
    if (memberError.code === '23505') {
      return NextResponse.json(
        { ok: false, error: 'You are already a member of this organization' },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: 'Failed to accept invitation' }, { status: 500 });
  }

  // Mark accepted
  await svc
    .from('org_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  await writeAuditLog({
    actorUserId:    currentUser.id,
    actorRole:      invite.org_role,
    organizationId: invite.organization_id,
    action:         'MEMBER_JOINED',
    entityTable:    'org_members',
    entityId:       invite.organization_id,
    metadata:       { org_role: invite.org_role, via: 'invite_token' },
  });

  return NextResponse.json({ ok: true, orgId: invite.organization_id });
}
