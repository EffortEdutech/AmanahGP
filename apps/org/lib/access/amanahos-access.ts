// apps/org/lib/access/amanahos-access.ts
// amanahOS access resolver — v5 SUPER_ADMIN all-organisations fix
//
// Core rule:
// - super_admin/platform_owner does NOT need org_members.
// - super_admin gets organisation context from public.organizations.
// - normal charity users still get organisation context from public.org_members.
//
// This file is intentionally server-only. Do not import it into client components.

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

export type AmanahOsOrgEntry = {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
};

type PublicUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  platform_role: string | null;
  auth_provider_user_id: string | null;
  is_active: boolean | null;
  created_at?: string | null;
};

type ConsoleRoleRow = {
  role: string | null;
  is_active: boolean | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
  onboarding_status: string | null;
  listing_status: string | null;
};

type MembershipRow = {
  organization_id: string;
  org_role: string;
  organizations: OrganizationRow | OrganizationRow[] | null;
};

export type AmanahOsAccessDiagnostic = {
  reason: string;
  authUserId: string | null;
  authEmail: string | null;
  effectiveRole: string | null;
  publicUserRole: string | null;
  platformRoles: string[];
  matchedPublicUsers: number;
  orgSource: 'public.organizations' | 'public.org_members' | 'none';
  orgCount: number;
  supabaseUrl: string | null;
};

export type AmanahOsAccessContext = {
  ok: boolean;
  reason: string;
  authUser: SupabaseAuthUser | null;
  publicUser: PublicUserRow | null;
  effectiveRole: string | null;
  platformRoles: string[];
  orgs: AmanahOsOrgEntry[];
  diagnostic: AmanahOsAccessDiagnostic;
};

type AccessOptions = {
  /** Dashboard can render a diagnostic page for super_admin even when public.organizations is empty. */
  allowEmptySuperAdmin?: boolean;
};

const BLOCKED_AMANAHOS_ROLES = new Set(['admin', 'reviewer', 'scholar']);

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function uniqById(rows: PublicUserRow[]): PublicUserRow[] {
  const map = new Map<string, PublicUserRow>();
  for (const row of rows) map.set(row.id, row);
  return [...map.values()];
}

function pickBestPublicUser(rows: PublicUserRow[], authUser: SupabaseAuthUser): PublicUserRow | null {
  if (rows.length === 0) return null;

  const authEmail = normalizeEmail(authUser.email);

  const exactAuthId = rows.find((row) => row.auth_provider_user_id === authUser.id);
  if (exactAuthId) return exactAuthId;

  const exactEmail = rows.find((row) => normalizeEmail(row.email) === authEmail);
  if (exactEmail) return exactEmail;

  return rows[0] ?? null;
}

function mapConsoleRoleToPlatformRole(role: string | null | undefined): string | null {
  switch (role) {
    case 'platform_owner':
      return 'super_admin';
    case 'platform_admin':
      return 'admin';
    case 'platform_scholar':
      return 'scholar';
    case 'platform_reviewer':
    case 'platform_auditor':
    case 'platform_approver':
      return 'reviewer';
    default:
      return null;
  }
}

function deriveEffectiveRole(publicRole: string | null, consoleRoles: string[]): string | null {
  const mappedConsoleRoles = consoleRoles
    .map((role) => mapConsoleRoleToPlatformRole(role))
    .filter((role): role is string => Boolean(role));

  const candidates = [publicRole, ...mappedConsoleRoles].filter((role): role is string => Boolean(role));

  if (candidates.includes('super_admin')) return 'super_admin';
  if (candidates.includes('admin')) return 'admin';
  if (candidates.includes('scholar')) return 'scholar';
  if (candidates.includes('reviewer')) return 'reviewer';
  if (candidates.includes('donor')) return 'donor';

  return candidates[0] ?? null;
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function orgRowToEntry(org: OrganizationRow, role: string): AmanahOsOrgEntry {
  return {
    organization_id: org.id,
    org_name: org.name ?? 'Unnamed organisation',
    org_role: role,
    onboarding_status: org.onboarding_status ?? 'draft',
    listing_status: org.listing_status ?? 'unlisted',
  };
}

function toDiagnostic(
  reason: string,
  authUser: SupabaseAuthUser | null,
  publicUser: PublicUserRow | null,
  effectiveRole: string | null,
  platformRoles: string[],
  matchedPublicUsers: number,
  orgSource: AmanahOsAccessDiagnostic['orgSource'],
  orgCount: number
): AmanahOsAccessDiagnostic {
  return {
    reason,
    authUserId: authUser?.id ?? null,
    authEmail: authUser?.email ?? null,
    effectiveRole,
    publicUserRole: publicUser?.platform_role ?? null,
    platformRoles,
    matchedPublicUsers,
    orgSource,
    orgCount,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  };
}

export function buildNoAccessUrl(diagnostic: AmanahOsAccessDiagnostic): string {
  const params = new URLSearchParams();
  params.set('reason', diagnostic.reason);
  if (diagnostic.authUserId) params.set('auth_id', diagnostic.authUserId);
  if (diagnostic.authEmail) params.set('auth_email', diagnostic.authEmail);
  if (diagnostic.effectiveRole) params.set('effective_role', diagnostic.effectiveRole);
  if (diagnostic.publicUserRole) params.set('public_role', diagnostic.publicUserRole);
  if (diagnostic.platformRoles.length > 0) params.set('platform_roles', diagnostic.platformRoles.join(','));
  params.set('matched_users', String(diagnostic.matchedPublicUsers));
  params.set('org_source', diagnostic.orgSource);
  params.set('org_count', String(diagnostic.orgCount));
  if (diagnostic.supabaseUrl) params.set('supabase_url', diagnostic.supabaseUrl);

  if (diagnostic.reason === 'platform_role') {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    params.set('redirect', consoleUrl);
  }

  return `/no-access?${params.toString()}`;
}

async function getAuthUser(): Promise<SupabaseAuthUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  };
}

async function findPublicUsers(authUser: SupabaseAuthUser): Promise<PublicUserRow[]> {
  const service = createServiceClient();
  const rows: PublicUserRow[] = [];

  const { data: byAuthId, error: byAuthIdError } = await service
    .from('users')
    .select('id, email, display_name, platform_role, auth_provider_user_id, is_active, created_at')
    .eq('auth_provider_user_id', authUser.id)
    .order('created_at', { ascending: false });

  if (byAuthIdError) {
    console.error('[amanahOS access] public.users lookup by auth_provider_user_id failed:', byAuthIdError.message);
  }

  rows.push(...((byAuthId ?? []) as PublicUserRow[]));

  const email = normalizeEmail(authUser.email);
  if (email) {
    const { data: byEmail, error: byEmailError } = await service
      .from('users')
      .select('id, email, display_name, platform_role, auth_provider_user_id, is_active, created_at')
      .ilike('email', email)
      .order('created_at', { ascending: false });

    if (byEmailError) {
      console.error('[amanahOS access] public.users lookup by email failed:', byEmailError.message);
    }

    rows.push(...((byEmail ?? []) as PublicUserRow[]));
  }

  return uniqById(rows);
}

async function findConsoleRoles(authUserId: string): Promise<string[]> {
  const service = createServiceClient();

  const { data, error } = await service
    .from('platform_user_roles')
    .select('role, is_active')
    .eq('user_id', authUserId)
    .eq('is_active', true);

  if (error) {
    // Older local DBs may not yet have platform_user_roles. Do not fail amanahOS because of that.
    console.warn('[amanahOS access] platform_user_roles lookup skipped/failed:', error.message);
    return [];
  }

  return ((data ?? []) as ConsoleRoleRow[])
    .map((row) => row.role)
    .filter((role): role is string => Boolean(role));
}

export async function loadAllOrganizationsForSuperAdmin(): Promise<AmanahOsOrgEntry[]> {
  const service = createServiceClient();

  // IMPORTANT: super_admin uses public.organizations directly, not public.org_members.
  const { data, error } = await service
    .from('organizations')
    .select('id, name, onboarding_status, listing_status')
    .order('name', { ascending: true });

  if (error) {
    console.error('[amanahOS access] super_admin public.organizations query failed:', error.message);
    return [];
  }

  return ((data ?? []) as OrganizationRow[]).map((org) => orgRowToEntry(org, 'super_admin'));
}

export async function loadOrganizationByIdForSuperAdmin(orgId: string): Promise<AmanahOsOrgEntry | null> {
  const service = createServiceClient();

  const { data, error } = await service
    .from('organizations')
    .select('id, name, onboarding_status, listing_status')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[amanahOS access] super_admin public.organizations by id query failed:', error.message);
    return null;
  }

  return data ? orgRowToEntry(data as OrganizationRow, 'super_admin') : null;
}

async function loadMemberOrganizations(publicUserId: string): Promise<AmanahOsOrgEntry[]> {
  const service = createServiceClient();
  const { data, error } = await service
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
    .eq('user_id', publicUserId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[amanahOS access] org_members query failed:', error.message);
    return [];
  }

  return ((data ?? []) as MembershipRow[]).map((membership) => {
    const org = relationOne(membership.organizations);

    return {
      organization_id: membership.organization_id,
      org_name: org?.name ?? 'Unnamed organisation',
      org_role: membership.org_role,
      onboarding_status: org?.onboarding_status ?? 'draft',
      listing_status: org?.listing_status ?? 'unlisted',
    };
  });
}

export async function getAmanahOsAccessContext(options: AccessOptions = {}): Promise<AmanahOsAccessContext> {
  const authUser = await getAuthUser();
  if (!authUser) {
    const diagnostic = toDiagnostic('not_authenticated', null, null, null, [], 0, 'none', 0);
    return { ok: false, reason: 'not_authenticated', authUser: null, publicUser: null, effectiveRole: null, platformRoles: [], orgs: [], diagnostic };
  }

  const matchedUsers = await findPublicUsers(authUser);
  const publicUser = pickBestPublicUser(matchedUsers, authUser);
  const platformRoles = await findConsoleRoles(authUser.id);
  const effectiveRole = deriveEffectiveRole(publicUser?.platform_role ?? null, platformRoles);

  if (!publicUser && platformRoles.length === 0) {
    const diagnostic = toDiagnostic('no_user_record', authUser, null, effectiveRole, platformRoles, matchedUsers.length, 'none', 0);
    return { ok: false, reason: 'no_user_record', authUser, publicUser: null, effectiveRole, platformRoles, orgs: [], diagnostic };
  }

  if (effectiveRole && BLOCKED_AMANAHOS_ROLES.has(effectiveRole)) {
    const diagnostic = toDiagnostic('platform_role', authUser, publicUser, effectiveRole, platformRoles, matchedUsers.length, 'none', 0);
    return { ok: false, reason: 'platform_role', authUser, publicUser, effectiveRole, platformRoles, orgs: [], diagnostic };
  }

  const isSuperAdmin = effectiveRole === 'super_admin';
  const orgs = isSuperAdmin
    ? await loadAllOrganizationsForSuperAdmin()
    : publicUser
      ? await loadMemberOrganizations(publicUser.id)
      : [];

  const orgSource: AmanahOsAccessDiagnostic['orgSource'] = isSuperAdmin ? 'public.organizations' : publicUser ? 'public.org_members' : 'none';

  if (orgs.length === 0) {
    const reason = isSuperAdmin ? 'no_organizations_available' : 'not_member_of_org';
    const diagnostic = toDiagnostic(reason, authUser, publicUser, effectiveRole, platformRoles, matchedUsers.length, orgSource, 0);

    if (isSuperAdmin && options.allowEmptySuperAdmin) {
      return { ok: true, reason, authUser, publicUser, effectiveRole, platformRoles, orgs, diagnostic };
    }

    return { ok: false, reason, authUser, publicUser, effectiveRole, platformRoles, orgs: [], diagnostic };
  }

  const diagnostic = toDiagnostic('ok', authUser, publicUser, effectiveRole, platformRoles, matchedUsers.length, orgSource, orgs.length);
  return { ok: true, reason: 'ok', authUser, publicUser, effectiveRole, platformRoles, orgs, diagnostic };
}

export type AmanahOsOrgWorkspaceAccess =
  | {
      ok: true;
      orgId: string;
      organization: {
        id: string;
        name: string;
        onboarding_status?: string | null;
        listing_status?: string | null;
        org_type?: string | null;
        state?: string | null;
      };
      isSuperAdmin: boolean;
      effectiveRole: string;
      orgRole: string;
      isManager: boolean;
      context: AmanahOsAccessContext;
    }
  | {
      ok: false;
      orgId: string;
      reason: string;
      diagnostic: AmanahOsAccessDiagnostic;
      context: AmanahOsAccessContext;
    };

/**
 * Per-organisation amanahOS access check.
 *
 * Important:
 * - Org members must still be active members of the requested organisation.
 * - super_admin / platform_owner are NOT required to exist in org_members.
 *   They are allowed to open any active organisation workspace by organisation_id.
 */
export async function getAmanahOsOrgWorkspaceAccess(
  orgId: string
): Promise<AmanahOsOrgWorkspaceAccess> {
  const context = await getAmanahOsAccessContext();

  if (!context.ok) {
    return {
      ok: false,
      orgId,
      reason: context.reason,
      diagnostic: context.diagnostic,
      context,
    };
  }

  const service = createServiceClient();
  const isSuperAdmin = context.effectiveRole === 'super_admin';

  if (isSuperAdmin) {
    const { data: org } = await service
      .from('organizations')
      .select('id, name, onboarding_status, listing_status, org_type, state')
      .eq('id', orgId)
      .maybeSingle();

    if (!org) {
      return {
        ok: false,
        orgId,
        reason: 'org_not_found',
        diagnostic: {
          ...context.diagnostic,
          reason: 'org_not_found',
        },
        context,
      };
    }

    return {
      ok: true,
      orgId,
      organization: {
        id: org.id,
        name: org.name ?? 'Unnamed organisation',
        onboarding_status: org.onboarding_status ?? null,
        listing_status: org.listing_status ?? null,
        org_type: org.org_type ?? null,
        state: org.state ?? null,
      },
      isSuperAdmin: true,
      effectiveRole: 'super_admin',
      orgRole: 'super_admin',
      isManager: true,
      context,
    };
  }

  const membership = context.orgs.find((row) => row.organization_id === orgId);

  if (!membership) {
    return {
      ok: false,
      orgId,
      reason: 'not_member_of_org',
      diagnostic: {
        ...context.diagnostic,
        reason: 'not_member_of_org',
      },
      context,
    };
  }

  const { data: org } = await service
    .from('organizations')
    .select('id, name, onboarding_status, listing_status, org_type, state')
    .eq('id', orgId)
    .maybeSingle();

  if (!org) {
    return {
      ok: false,
      orgId,
      reason: 'org_not_found',
      diagnostic: {
        ...context.diagnostic,
        reason: 'org_not_found',
      },
      context,
    };
  }

  const orgRole = membership.org_role ?? 'org_member';

  return {
    ok: true,
    orgId,
    organization: {
      id: org.id,
      name: org.name ?? 'Unnamed organisation',
      onboarding_status: org.onboarding_status ?? null,
      listing_status: org.listing_status ?? null,
      org_type: org.org_type ?? null,
      state: org.state ?? null,
    },
    isSuperAdmin: false,
    effectiveRole: orgRole,
    orgRole,
    isManager: ['org_admin', 'org_manager'].includes(orgRole),
    context,
  };
}
