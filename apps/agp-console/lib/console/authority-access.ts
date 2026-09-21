import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsolePermission } from "@/lib/console/constants";

export type AuthorityRole = "authority_viewer" | "authority_reviewer" | "authority_manager" | "authority_admin";
export type AuthorityScopeType = "view" | "review" | "manage" | "admin";

export type AuthorityMembership = {
  id: string;
  authority_id: string;
  authority_name: string | null;
  user_id: string;
  role: AuthorityRole;
  status: string;
};

export type AuthorityJurisdictionScope = {
  id: string;
  authority_id: string;
  authority_member_id: string;
  jurisdiction_id: string;
  jurisdiction_name: string | null;
  jurisdiction_type: string | null;
  scope_type: AuthorityScopeType;
  status: string;
};

export const AUTHORITY_ROLE_PERMISSIONS: Record<AuthorityRole, ConsolePermission[]> = {
  authority_viewer: [
    "authority.dashboard.read",
    "authority.organizations.read",
    "authority.submissions.read",
    "authority.obligations.read",
    "authority.exceptions.read",
    "authority.cases.read",
    "authority.evidence.read",
    "authority.policy.read",
    "authority.audit.read",
    "authority.reports.export",
  ],
  authority_reviewer: [
    "authority.dashboard.read",
    "authority.organizations.read",
    "authority.submissions.read",
    "authority.submissions.review",
    "authority.obligations.read",
    "authority.exceptions.read",
    "authority.cases.read",
    "authority.cases.write",
    "authority.evidence.read",
    "authority.policy.read",
    "authority.audit.read",
    "authority.reports.export",
  ],
  authority_manager: [
    "authority.dashboard.read",
    "authority.organizations.read",
    "authority.submissions.read",
    "authority.submissions.review",
    "authority.obligations.read",
    "authority.exceptions.read",
    "authority.exceptions.manage",
    "authority.cases.read",
    "authority.cases.write",
    "authority.evidence.read",
    "authority.policy.read",
    "authority.audit.read",
    "authority.reports.export",
  ],
  authority_admin: [
    "authority.dashboard.read",
    "authority.organizations.read",
    "authority.submissions.read",
    "authority.submissions.review",
    "authority.obligations.read",
    "authority.exceptions.read",
    "authority.exceptions.manage",
    "authority.cases.read",
    "authority.cases.write",
    "authority.evidence.read",
    "authority.policy.read",
    "authority.policy.write",
    "authority.audit.read",
    "authority.reports.export",
  ],
};

export function authorityRolesToPermissions(roles: AuthorityRole[]) {
  const permissions = new Set<ConsolePermission>();
  roles.forEach((role) => {
    AUTHORITY_ROLE_PERMISSIONS[role].forEach((permission) => permissions.add(permission));
  });
  return permissions;
}

function isAuthorityRole(value: string): value is AuthorityRole {
  return ["authority_viewer", "authority_reviewer", "authority_manager", "authority_admin"].includes(value);
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listAuthorityMemberships(
  supabase: SupabaseClient,
  authUserId: string,
  email?: string | null,
): Promise<AuthorityMembership[]> {
  const { data: usersByAuthId, error: authIdError } = await supabase
    .from("users")
    .select("id, email, auth_provider_user_id, is_active")
    .eq("auth_provider_user_id", authUserId)
    .eq("is_active", true)
    .limit(5);

  if (authIdError) throw new Error(authIdError.message);

  const users = [...(usersByAuthId ?? [])];

  if (email) {
    const { data: usersByEmail, error: emailError } = await supabase
      .from("users")
      .select("id, email, auth_provider_user_id, is_active")
      .ilike("email", email)
      .eq("is_active", true)
      .limit(5);

    if (emailError) throw new Error(emailError.message);
    users.push(...(usersByEmail ?? []));
  }

  const userIds = Array.from(new Set(users.map((row) => String(row.id))));
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("authority_members")
    .select(`
      id,
      authority_id,
      user_id,
      role,
      status,
      authority:authorities!authority_members_authority_id_fkey (
        id,
        name
      )
    `)
    .in("user_id", userIds)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row: any) => {
      const role = String(row.role);
      if (!isAuthorityRole(role)) return null;
      const authority = relationOne(row.authority) as { id?: string; name?: string | null } | null;
      return {
        id: String(row.id),
        authority_id: String(row.authority_id),
        authority_name: authority?.name ? String(authority.name) : null,
        user_id: String(row.user_id),
        role,
        status: String(row.status),
      } satisfies AuthorityMembership;
    })
    .filter((row): row is AuthorityMembership => Boolean(row));
}

export async function listAuthorityJurisdictionScopes(
  supabase: SupabaseClient,
  authorityMemberIds: string[],
): Promise<AuthorityJurisdictionScope[]> {
  if (authorityMemberIds.length === 0) return [];

  const { data, error } = await supabase
    .from("authority_jurisdiction_assignments")
    .select(`
      id,
      authority_id,
      authority_member_id,
      jurisdiction_id,
      scope_type,
      status,
      jurisdiction:jurisdictions!authority_jurisdiction_assignments_jurisdiction_id_fkey (
        id,
        name,
        jurisdiction_type
      )
    `)
    .in("authority_member_id", authorityMemberIds)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null; jurisdiction_type?: string | null } | null;
    return {
      id: String(row.id),
      authority_id: String(row.authority_id),
      authority_member_id: String(row.authority_member_id),
      jurisdiction_id: String(row.jurisdiction_id),
      jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
      jurisdiction_type: jurisdiction?.jurisdiction_type ? String(jurisdiction.jurisdiction_type) : null,
      scope_type: String(row.scope_type) as AuthorityScopeType,
      status: String(row.status),
    } satisfies AuthorityJurisdictionScope;
  });
}