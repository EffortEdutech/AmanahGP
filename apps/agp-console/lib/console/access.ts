import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsolePermission } from "@/lib/console/constants";

const rolePermissions: Record<string, ConsolePermission[]> = {
  platform_owner: [
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
  ],
  platform_admin: [
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
  ],
  platform_auditor: [
    "organizations.read",
    "members.read",
    "apps.read",
    "billing.read",
    "audit.read",
    "notifications.read",
  ],
};

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
  const { data, error } = await supabase
    .from("platform_user_roles")
    .select("role, is_active")
    .eq("user_id", authUserId)
    .eq("is_active", true);

  if (error) {
    console.error("getPlatformRoles error", error);
    return [];
  }

  return (data ?? []).map((row) => String(row.role));
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
    redirect("/login?error=no_console_role");
  }

  if (permission && !permissions.has(permission)) {
    redirect("/dashboard?error=forbidden");
  }

  return { supabase, user, roles, permissions };
}

export function hasPermission(roles: string[], permission: ConsolePermission) {
  return rolesToPermissions(roles).has(permission);
}

export function getPrimaryRoleLabel(roles: string[]) {
  if (roles.includes("platform_owner")) return "Platform Owner";
  if (roles.includes("platform_admin")) return "Platform Admin";
  if (roles.includes("platform_auditor")) return "Platform Auditor";
  return "Console User";
}

export async function getAuthUserAndRoles() {
  const { supabase, user, roles } = await requireConsoleAccess();
  return { supabase, user, roles };
}
