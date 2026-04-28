// apps/org/lib/access/org-access.ts
// amanahOS — centralized organization access guard
//
// Purpose:
// - Normal org users must be active org_members.
// - super_admin / platform_owner can open every organization without org_members rows.
// - Page-level guards should call getOrgAccessOrRedirect(orgId) instead of querying org_members directly.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const AMANAHOS_BLOCKED_PLATFORM_ROLES = ['admin', 'reviewer', 'scholar'] as const;
export const AMANAHOS_SUPER_ADMIN_PLATFORM_ROLES = ['super_admin', 'platform_owner'] as const;

export type OrgShellEntry = {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
};

export type PlatformUserForAccess = {
  id: string;
  email: string | null;
  display_name: string | null;
  platform_role: string | null;
  auth_provider_user_id?: string | null;
  is_active?: boolean | null;
};

export type OrgMembershipForAccess = {
  id?: string;
  organization_id: string;
  user_id: string;
  org_role: string;
  status?: string;
  organizations: Record<string, unknown> | null;
};

function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

function normalizeRole(role: unknown): string {
  return String(role ?? '').trim();
}

function isBlockedRole(role: unknown): boolean {
  return (AMANAHOS_BLOCKED_PLATFORM_ROLES as readonly string[]).includes(normalizeRole(role));
}

function hasSuperAdminRole(role: unknown): boolean {
  return (AMANAHOS_SUPER_ADMIN_PLATFORM_ROLES as readonly string[]).includes(normalizeRole(role));
}

async function getCurrentAuthUserOrRedirect() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  return user;
}

async function getPlatformUserOrRedirect(authUser: { id: string; email?: string | null }) {
  const service = createServiceClient();
  const email = authUser.email?.toLowerCase() ?? null;

  let query = service
    .from('users')
    .select('id, email, display_name, platform_role, auth_provider_user_id, is_active, created_at')
    .eq('auth_provider_user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(1);

  let { data, error } = await query;

  if ((!data || data.length === 0) && email) {
    const fallback = await service
      .from('users')
      .select('id, email, display_name, platform_role, auth_provider_user_id, is_active, created_at')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data || data.length === 0) {
    console.error('[amanahOS/access] public.users lookup failed:', {
      authUserId: authUser.id,
      email,
      error: error?.message,
    });
    redirect('/no-access?reason=no_user_record');
  }

  const platformUser = data[0] as PlatformUserForAccess;
  if (platformUser.is_active === false) redirect('/no-access?reason=user_inactive');
  return platformUser;
}

async function getConsoleRoles(publicUserId: string) {
  const service = createServiceClient();

  // Some older local schemas do not have platform_user_roles yet.
  // In that case, public.users.platform_role remains the source of truth.
  const { data, error } = await service
    .from('platform_user_roles')
    .select('role, is_active')
    .eq('user_id', publicUserId)
    .eq('is_active', true);

  if (error) {
    if (!['42P01', 'PGRST205', 'PGRST116'].includes(String(error.code))) {
      console.warn('[amanahOS/access] platform_user_roles lookup skipped:', error.message);
    }
    return [] as string[];
  }

  return (data ?? []).map((row) => normalizeRole(row.role)).filter(Boolean);
}

export async function getAmanahOsUserContextOrRedirect() {
  const authUser = await getCurrentAuthUserOrRedirect();
  const platformUser = await getPlatformUserOrRedirect(authUser);
  const consoleRoles = await getConsoleRoles(platformUser.id);

  const publicRole = normalizeRole(platformUser.platform_role);
  const isSuperAdmin = hasSuperAdminRole(publicRole) || consoleRoles.some(hasSuperAdminRole);

  if (!isSuperAdmin && isBlockedRole(publicRole)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  return {
    authUser,
    platformUser,
    publicRole,
    consoleRoles,
    isSuperAdmin,
  };
}

export async function listAccessibleOrgsForAmanahOs() {
  const service = createServiceClient();
  const context = await getAmanahOsUserContextOrRedirect();
  const { platformUser, isSuperAdmin } = context;

  if (isSuperAdmin) {
    const { data: organizations, error } = await service
      .from('organizations')
      .select('id, name, onboarding_status, listing_status')
      .order('name', { ascending: true });

    if (error) {
      console.error('[amanahOS/access] super_admin organizations query failed:', error.message);
      redirect('/no-access?reason=org_lookup_failed');
    }

    return {
      ...context,
      orgs: (organizations ?? []).map((org) => ({
        organization_id: org.id,
        org_name: org.name ?? 'Unnamed org',
        org_role: 'super_admin',
        onboarding_status: org.onboarding_status ?? 'draft',
        listing_status: org.listing_status ?? 'unlisted',
      })) as OrgShellEntry[],
    };
  }

  const { data: memberships, error } = await service
    .from('org_members')
    .select(`
      organization_id,
      org_role,
      organizations (
        id,
        name,
        onboarding_status,
        listing_status
      )
    `)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[amanahOS/access] org_members query failed:', error.message);
  }

  const orgs = (memberships ?? []).map((m) => {
    const org = relationOne<{
      id: string;
      name: string | null;
      onboarding_status: string | null;
      listing_status: string | null;
    }>(m.organizations);

    return {
      organization_id: m.organization_id,
      org_name: org?.name ?? 'Unnamed org',
      org_role: m.org_role,
      onboarding_status: org?.onboarding_status ?? 'draft',
      listing_status: org?.listing_status ?? 'unlisted',
    };
  }) as OrgShellEntry[];

  return {
    ...context,
    orgs,
  };
}

export async function getOrgAccessOrRedirect(orgId: string) {
  const service = createServiceClient();
  const context = await getAmanahOsUserContextOrRedirect();
  const { platformUser, isSuperAdmin } = context;

  if (isSuperAdmin) {
    const { data: organization, error } = await service
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle();

    if (error) {
      console.error('[amanahOS/access] super_admin organization lookup failed:', error.message);
      redirect('/no-access?reason=org_lookup_failed');
    }

    if (!organization) redirect('/no-access?reason=org_not_found');

    const membership: OrgMembershipForAccess = {
      id: 'super-admin-' + orgId,
      organization_id: orgId,
      user_id: platformUser.id,
      // Deliberately org_admin inside the selected org context so existing pages/forms
      // treat super_admin as manager-level without requiring org_members rows.
      org_role: 'org_admin',
      status: 'active',
      organizations: organization as Record<string, unknown>,
    };

    return {
      ...context,
      organization,
      org: organization,
      membership,
      effectiveOrgRole: 'super_admin',
      isManager: true,
      canManageOrg: true,
    };
  }

  const { data: membership, error } = await service
    .from('org_members')
    .select('*, organizations(*)')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('[amanahOS/access] membership lookup failed:', error.message);
    redirect('/no-access?reason=membership_lookup_failed');
  }

  if (!membership) redirect('/no-access?reason=not_member_of_org');

  const role = normalizeRole(membership.org_role);
  const isManager = ['org_admin', 'org_manager'].includes(role);
  const organization = relationOne<Record<string, unknown>>(membership.organizations);

  return {
    ...context,
    organization,
    org: organization,
    membership: membership as OrgMembershipForAccess,
    effectiveOrgRole: role,
    isManager,
    canManageOrg: isManager,
  };
}
