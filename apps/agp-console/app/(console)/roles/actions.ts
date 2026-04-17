"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

function backToRoles(message?: string, error?: string): never {
  const params = new URLSearchParams();
  if (message) params.set("message", message);
  if (error) params.set("error", error);
  redirect(`/roles${params.toString() ? `?${params.toString()}` : ""}`);
}

export async function assignPlatformRoleAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("roles.write");

  const targetAuthUserId = String(formData.get("target_auth_user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!targetAuthUserId || !role) {
    backToRoles(undefined, "Missing target user or role.");
  }

  const { error } = await supabase
    .from("platform_user_roles")
    .upsert(
      {
        user_id: targetAuthUserId,
        role,
        is_active: true,
      },
      { onConflict: "user_id,role" },
    );

  if (error) {
    backToRoles(undefined, error.message);
  }

  await writeAuditLog(supabase, user.id, {
    action: "platform_role_assigned",
    entityTable: "platform_user_roles",
    entityId: `${targetAuthUserId}:${role}`,
    metadata: { target_auth_user_id: targetAuthUserId, role, is_active: true },
  });

  revalidatePath("/roles");
  revalidatePath("/dashboard");
  backToRoles("Platform role assigned.");
}

export async function updatePlatformRoleStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("roles.write");

  const targetAuthUserId = String(formData.get("target_auth_user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!targetAuthUserId || !role) {
    backToRoles(undefined, "Missing target user or role.");
  }

  const { error } = await supabase
    .from("platform_user_roles")
    .update({ is_active: isActive })
    .eq("user_id", targetAuthUserId)
    .eq("role", role);

  if (error) {
    backToRoles(undefined, error.message);
  }

  await writeAuditLog(supabase, user.id, {
    action: "platform_role_status_updated",
    entityTable: "platform_user_roles",
    entityId: `${targetAuthUserId}:${role}`,
    metadata: { target_auth_user_id: targetAuthUserId, role, is_active: isActive },
  });

  revalidatePath("/roles");
  revalidatePath("/dashboard");
  backToRoles("Platform role status updated.");
}

export async function removePlatformRoleAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("roles.write");

  const targetAuthUserId = String(formData.get("target_auth_user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!targetAuthUserId || !role) {
    backToRoles(undefined, "Missing target user or role.");
  }

  const { error } = await supabase
    .from("platform_user_roles")
    .delete()
    .eq("user_id", targetAuthUserId)
    .eq("role", role);

  if (error) {
    backToRoles(undefined, error.message);
  }

  await writeAuditLog(supabase, user.id, {
    action: "platform_role_removed",
    entityTable: "platform_user_roles",
    entityId: `${targetAuthUserId}:${role}`,
    metadata: { target_auth_user_id: targetAuthUserId, role },
  });

  revalidatePath("/roles");
  revalidatePath("/dashboard");
  backToRoles("Platform role removed.");
}
