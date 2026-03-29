'use server';
// apps/admin/app/(dashboard)/orgs/actions.ts
// AmanahHub Console — Organization server actions
// Covers: create, update profile, classify, submit onboarding, invite member

import { redirect }          from 'next/navigation';
import { revalidatePath }    from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog }     from '@/lib/audit';
import {
  createOrgSchema,
  classifyOrgSchema,
  inviteMemberSchema,
} from '@agp/validation';
import { AUDIT_ACTIONS, ONBOARDING_STATUS } from '@agp/config';

// ── Helper: resolve current user's internal UUID ──────────────
async function resolveCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('id, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  return data ?? null;
}

// ── Helper: verify org membership at minimum role ─────────────
async function requireOrgRole(orgId: string, minRole: 'org_viewer' | 'org_manager' | 'org_admin') {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: minRole });
  return !!data;
}

// =============================================================
// CREATE ORGANIZATION
// =============================================================
export async function createOrganization(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; orgId?: string }> {
  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const raw = {
    name:           formData.get('name') as string,
    legalName:      formData.get('legalName') as string,
    registrationNo: formData.get('registrationNo') as string,
    websiteUrl:     formData.get('websiteUrl') as string,
    contactEmail:   formData.get('contactEmail') as string,
    contactPhone:   formData.get('contactPhone') as string,
    addressText:    formData.get('addressText') as string,
    state:          formData.get('state') as string,
    summary:        formData.get('summary') as string,
  };

  const parsed = createOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' };
  }

  const serviceClient = createServiceClient();

  // Create org
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({
      name:            parsed.data.name,
      legal_name:      parsed.data.legalName      || null,
      registration_no: parsed.data.registrationNo || null,
      website_url:     parsed.data.websiteUrl      || null,
      contact_email:   parsed.data.contactEmail    || null,
      contact_phone:   parsed.data.contactPhone    || null,
      address_text:    parsed.data.addressText     || null,
      state:           parsed.data.state           || null,
      summary:         parsed.data.summary,
      country:         'MY',
      onboarding_status: 'draft',
      listing_status:    'private',
    })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: 'Failed to create organization. Please try again.' };
  }

  // Make creator org_admin
  await serviceClient.from('org_members').insert({
    organization_id:    org.id,
    user_id:            currentUser.id,
    org_role:           'org_admin',
    status:             'active',
    accepted_at:        new Date().toISOString(),
  });

  await writeAuditLog({
    actorUserId:    currentUser.id,
    actorRole:      'org_admin',
    organizationId: org.id,
    action:         'ORG_CREATED',
    entityTable:    'organizations',
    entityId:       org.id,
    metadata:       { name: parsed.data.name },
  });

  return { orgId: org.id };
}

// =============================================================
// CLASSIFY ORGANIZATION (Malaysia classification — step 2)
// =============================================================
export async function classifyOrganization(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;
  if (!orgId) return { error: 'Organization ID missing' };

  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const hasAccess = await requireOrgRole(orgId, 'org_admin');
  if (!hasAccess) return { error: 'You do not have permission to update this organization' };

  const rawFundTypes = formData.getAll('fundTypes') as string[];
  const raw = {
    orgType:            formData.get('orgType') as string,
    oversightAuthority: formData.get('oversightAuthority') as string,
    fundTypes:          rawFundTypes,
  };

  const parsed = classifyOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from('organizations')
    .update({
      org_type:            parsed.data.orgType,
      oversight_authority: parsed.data.oversightAuthority,
      fund_types:          parsed.data.fundTypes,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) return { error: 'Failed to save classification' };

  await writeAuditLog({
    actorUserId:    currentUser.id,
    actorRole:      'org_admin',
    organizationId: orgId,
    action:         'ORG_CLASSIFIED',
    entityTable:    'organizations',
    entityId:       orgId,
    metadata:       {
      org_type: parsed.data.orgType,
      fund_types: parsed.data.fundTypes,
    },
  });

  revalidatePath(`/orgs/${orgId}`);
  return { success: true };
}

// =============================================================
// UPDATE ORG PROFILE
// =============================================================
export async function updateOrgProfile(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;
  if (!orgId) return { error: 'Organization ID missing' };

  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const hasAccess = await requireOrgRole(orgId, 'org_manager');
  if (!hasAccess) return { error: 'Permission denied' };

  const raw = {
    name:           formData.get('name') as string,
    legalName:      formData.get('legalName') as string,
    registrationNo: formData.get('registrationNo') as string,
    websiteUrl:     formData.get('websiteUrl') as string,
    contactEmail:   formData.get('contactEmail') as string,
    contactPhone:   formData.get('contactPhone') as string,
    addressText:    formData.get('addressText') as string,
    state:          formData.get('state') as string,
    summary:        formData.get('summary') as string,
  };

  const parsed = createOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from('organizations')
    .update({
      name:            parsed.data.name,
      legal_name:      parsed.data.legalName      || null,
      registration_no: parsed.data.registrationNo || null,
      website_url:     parsed.data.websiteUrl      || null,
      contact_email:   parsed.data.contactEmail    || null,
      contact_phone:   parsed.data.contactPhone    || null,
      address_text:    parsed.data.addressText     || null,
      state:           parsed.data.state           || null,
      summary:         parsed.data.summary,
      updated_at:      new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) return { error: 'Failed to update profile' };

  revalidatePath(`/orgs/${orgId}`);
  return { success: true };
}

// =============================================================
// SUBMIT ONBOARDING
// =============================================================
export async function submitOnboarding(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;
  if (!orgId) return { error: 'Organization ID missing' };

  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const hasAccess = await requireOrgRole(orgId, 'org_admin');
  if (!hasAccess) return { error: 'Permission denied' };

  const serviceClient = createServiceClient();

  // Check org has minimum required fields
  const { data: org } = await serviceClient
    .from('organizations')
    .select('name, summary, org_type, oversight_authority, fund_types, onboarding_status')
    .eq('id', orgId)
    .single();

  if (!org) return { error: 'Organization not found' };

  if (org.onboarding_status !== ONBOARDING_STATUS.DRAFT) {
    return { error: `Cannot submit — current status is "${org.onboarding_status}"` };
  }

  // Gate: require classification before submission
  if (!org.org_type || !org.oversight_authority || !org.fund_types?.length) {
    return { error: 'Please complete Malaysia classification before submitting' };
  }

  const { error } = await serviceClient
    .from('organizations')
    .update({
      onboarding_status:       ONBOARDING_STATUS.SUBMITTED,
      onboarding_submitted_at: new Date().toISOString(),
      updated_at:              new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) return { error: 'Failed to submit onboarding' };

  await writeAuditLog({
    actorUserId:    currentUser.id,
    actorRole:      'org_admin',
    organizationId: orgId,
    action:         AUDIT_ACTIONS.ORG_SUBMITTED,
    entityTable:    'organizations',
    entityId:       orgId,
    metadata:       { name: org.name },
  });

  revalidatePath(`/orgs/${orgId}`);
  return { success: true };
}

// =============================================================
// INVITE MEMBER
// =============================================================
export async function inviteMember(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const orgId = formData.get('orgId') as string;
  if (!orgId) return { error: 'Organization ID missing' };

  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Not authenticated' };

  const hasAccess = await requireOrgRole(orgId, 'org_admin');
  if (!hasAccess) return { error: 'Only org admins can invite members' };

  const raw = {
    email:   formData.get('email') as string,
    orgRole: formData.get('orgRole') as string,
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Validation error' };
  }

  const serviceClient = createServiceClient();

  // Check if already a member
  const { data: existing } = await serviceClient
    .from('org_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  // Check for pending invite
  const { data: existingInvite } = await serviceClient
    .from('org_invitations')
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('invited_email', parsed.data.email)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvite) {
    return { error: 'An active invitation already exists for this email' };
  }

  const { data: invitation, error: inviteError } = await serviceClient
    .from('org_invitations')
    .insert({
      organization_id:    orgId,
      invited_email:      parsed.data.email,
      org_role:           parsed.data.orgRole,
      invited_by_user_id: currentUser.id,
    })
    .select('id, token')
    .single();

  if (inviteError || !invitation) {
    return { error: 'Failed to create invitation' };
  }

  // TODO Sprint 2: send invitation email via Supabase Edge Function
  // For now: token is stored, can be shared manually in pilot
  console.log(`[invite] Token for ${parsed.data.email}: ${invitation.token}`);

  await writeAuditLog({
    actorUserId:    currentUser.id,
    actorRole:      'org_admin',
    organizationId: orgId,
    action:         'MEMBER_INVITED',
    entityTable:    'org_invitations',
    entityId:       invitation.id,
    metadata:       { invited_email: parsed.data.email, org_role: parsed.data.orgRole },
  });

  revalidatePath(`/orgs/${orgId}/members`);
  return { success: true };
}

// =============================================================
// ACCEPT INVITATION (called when invitee signs up/in and visits token link)
// =============================================================
export async function acceptInvitation(token: string): Promise<{ error?: string; orgId?: string }> {
  const currentUser = await resolveCurrentUser();
  if (!currentUser) return { error: 'Please sign in to accept your invitation' };

  const serviceClient = createServiceClient();

  const { data: invite } = await serviceClient
    .from('org_invitations')
    .select('id, organization_id, org_role, invited_email, status, expires_at')
    .eq('token', token)
    .single();

  if (!invite)                          return { error: 'Invitation not found' };
  if (invite.status !== 'pending')      return { error: 'This invitation has already been used or revoked' };
  if (new Date(invite.expires_at) < new Date()) {
    await serviceClient
      .from('org_invitations')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return { error: 'This invitation has expired. Please request a new one.' };
  }

  // Add as org member
  const { error: memberError } = await serviceClient
    .from('org_members')
    .insert({
      organization_id:    invite.organization_id,
      user_id:            currentUser.id,
      org_role:           invite.org_role,
      status:             'active',
      accepted_at:        new Date().toISOString(),
    });

  if (memberError) {
    if (memberError.code === '23505') {
      return { error: 'You are already a member of this organization' };
    }
    return { error: 'Failed to accept invitation' };
  }

  // Mark invitation accepted
  await serviceClient
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
    metadata:       { org_role: invite.org_role },
  });

  return { orgId: invite.organization_id };
}
