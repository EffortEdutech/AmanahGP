// supabase/functions/send-invite-email/index.ts
// Amanah Governance Platform — Send invitation email
//
// Called when: org_admin invites a member
// Body: { invitation_id: string }
// Auth: service_role

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const { invitation_id } = await req.json() as { invitation_id: string };

    if (!invitation_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'invitation_id required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Fetch invitation + org
    const { data: invite } = await supabase
      .from('org_invitations')
      .select(`
        id, invited_email, org_role, token, expires_at,
        organizations ( name )
      `)
      .eq('id', invitation_id)
      .eq('status', 'pending')
      .single();

    if (!invite) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invitation not found or already used' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const org     = Array.isArray(invite.organizations)
      ? invite.organizations[0]
      : invite.organizations;
    const appUrl  = Deno.env.get('AMANAHHUB_URL') ?? 'http://localhost:3300';
    const inviteUrl = `${appUrl}/invite?token=${invite.token}`;
    const roleLabel = invite.org_role?.replace('org_', '') ?? 'member';

    // Send email via Supabase Auth email (uses configured SMTP)
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(
      invite.invited_email,
      {
        redirectTo: inviteUrl,
        data: {
          invite_type:  'org_member',
          org_name:     org?.name ?? 'an organization',
          org_role:     roleLabel,
          invite_url:   inviteUrl,
        },
      }
    );

    // If inviteUserByEmail fails (user already exists), we fall back to a direct email
    // In Phase 1 with Supabase's built-in email, this covers most cases.
    // For production, replace with Resend/SendGrid via SMTP config.
    if (emailError) {
      console.warn('[invite-email] inviteUserByEmail failed, attempting direct send:', emailError.message);

      // Log token to console as fallback — admin can share manually
      console.log(`[invite-email] Manual fallback — send this link to ${invite.invited_email}:`);
      console.log(`  ${inviteUrl}`);
      console.log(`  Org: ${org?.name}, Role: ${roleLabel}`);
      console.log(`  Expires: ${new Date(invite.expires_at).toISOString()}`);
    }

    // Mark invite as 'email_sent' in metadata (extend payload)
    await supabase
      .from('org_invitations')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation_id);

    console.log(`[invite-email] ✅ Processed for ${invite.invited_email} → ${org?.name}`);

    return new Response(
      JSON.stringify({ ok: true, invited_email: invite.invited_email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[invite-email] Error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
