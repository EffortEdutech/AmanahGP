import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsolePermission } from "@/lib/console/constants";

const SUPER_ADMIN_PERMISSIONS: ConsolePermission[] = [
  "organizations.read",
  "organizations.write",
  "members.read",
  "members.write",
  "apps.read",
  "apps.write",
  "billing.read",
  "billing.write",
  "roles.read",
  "roles.write",
  "audit.read",
  "notifications.read",
  "cases.read",
  "cases.write",
];

const PLATFORM_ADMIN_PERMISSIONS: ConsolePermission[] = [
  "organizations.read",
  "organizations.write",
  "members.read",
  "members.write",
  "apps.read",
  "apps.write",
  "billing.read",
  "billing.write",
  "audit.read",
  "notifications.read",
  "cases.read",
  "cases.write",
];

const rolePermissions: Record<string, ConsolePermission[]> = {
  platform_owner: SUPER_ADMIN_PERMISSIONS,
  platform_admin: PLATFORM_ADMIN_PERMISSIONS,
  platform_auditor: [
    "organizations.read",
    "members.read",
    "apps.read",
    "billing.read",
    "audit.read",
    "notifications.read",
    "cases.read",
  ],
  platform_reviewer: [
    "organizations.read",
    "members.read",
    "audit.read",
    "notifications.read",
    "cases.read",
    "cases.write",
  ],
  platform_scholar: [
    "organizations.read",
    "audit.read",
    "notifications.read",
    "cases.read",
    "cases.write",
  ],
  platform_approver: [
    "organizations.read",
    "audit.read",
    "notifications.read",
    "cases.read",
    "cases.write",
  ],

  // Defensive support if raw direct platform_role values are ever returned as roles.
  super_admin: SUPER_ADMIN_PERMISSIONS,
  admin: PLATFORM_ADMIN_PERMISSIONS,
  reviewer: [
    "organizations.read",
    "members.read",
    "audit.read",
    "notifications.read",
    "cases.read",
    "cases.write",
  ],
  scholar: [
    "organizations.read",
    "audit.read",
    "notifications.read",
    "cases.read",
    "cases.write",
  ],
};

const DIRECT_SUPER_ADMIN_CONSOLE_ROLES = [
  "platform_owner",
  "platform_admin",
  "platform_auditor",
  "platform_reviewer",
  "platform_scholar",
  "platform_approver",
];

function directPlatformRoleToConsoleRoles(platformRole?: string | null): string[] {
  switch (platformRole) {
    case "super_admin":
      return DIRECT_SUPER_ADMIN_CONSOLE_ROLES;
    case "admin":
      return ["platform_admin"];
    case "reviewer":
      return ["platform_reviewer"];
    case "scholar":
      return ["platform_scholar"];
    default:
      return [];
  }
}

export async function requireAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getPlatformRoles(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<string[]> {
  const roleSet = new Set<string>();

  const { data: assignedRoles, error: assignedRoleError } = await supabase
    .from("platform_user_roles")
    .select("role, is_active")
    .eq("user_id", authUserId)
    .eq("is_active", true);

  if (assignedRoleError) {
    console.error("getPlatformRoles platform_user_roles error", assignedRoleError);
  } else {
    (assignedRoles ?? []).forEach((row) => roleSet.add(String(row.role)));
  }

  // Direct public.users.platform_role fallback.
  // This is important for the AGP access model:
  // - public.users.platform_role = super_admin => full console access
  // - public.users.platform_role = admin       => console platform_admin access
  // auth_provider_user_id is text in your schema, therefore compare it to user.id as string.
  const { data: directUsers, error: directUserError } = await supabase
    .from("users")
    .select("platform_role, is_active")
    .eq("auth_provider_user_id", authUserId)
    .limit(10);

  if (directUserError) {
    console.error("getPlatformRoles public.users error", directUserError);
  } else {
    (directUsers ?? [])
      .filter((row) => row.is_active !== false)
      .forEach((row) => {
        directPlatformRoleToConsoleRoles(row.platform_role).forEach((role) => roleSet.add(role));
      });
  }

  return Array.from(roleSet);
}

export function rolesToPermissions(roles: string[]) {
  const permissions = new Set<ConsolePermission>();

  roles.forEach((role) => {
    (rolePermissions[role] ?? []).forEach((permission) => permissions.add(permission));
  });

  return permissions;
}

export async function requireConsoleAccess(permission?: ConsolePermission) {
  const { supabase, user } = await requireAuthUser();
  const roles = await getPlatformRoles(supabase, user.id);
  const permissions = rolesToPermissions(roles);

  if (roles.length === 0) {
    redirect("/no-console-access?reason=no_console_role");
  }

  if (permission && !permissions.has(permission)) {
    redirect("/no-console-access?reason=forbidden");
  }

  return { supabase, user, roles, permissions };
}

export function hasPermission(roles: string[], permission: ConsolePermission) {
  return rolesToPermissions(roles).has(permission);
}

export function getPrimaryRoleLabel(roles: string[]) {
  if (roles.includes("platform_owner") || roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("platform_admin") || roles.includes("admin")) return "Platform Admin";
  if (roles.includes("platform_approver")) return "Approver";
  if (roles.includes("platform_scholar") || roles.includes("scholar")) return "Scholar";
  if (roles.includes("platform_reviewer") || roles.includes("reviewer")) return "Reviewer";
  if (roles.includes("platform_auditor")) return "Platform Auditor";
  return "Console User";
}

export async function getAuthUserAndRoles() {
  const { supabase, user, roles } = await requireConsoleAccess();
  return { supabase, user, roles };
}
