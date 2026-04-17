"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

export async function setAppInstallationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("apps.write");
  const orgId = String(formData.get("org_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");
  const nextStatus = String(formData.get("next_status") ?? "enabled");

  if (!orgId || !appId) {
    redirect("/organisations?error=Missing app installation reference");
  }

  const { data: existing } = await supabase
    .from("app_installations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("app_id", appId)
    .maybeSingle();

  let errorMessage: string | null = null;

  if (existing?.id) {
    const { error } = await supabase
      .from("app_installations")
      .update({
        status: nextStatus,
        disabled_at: nextStatus === "disabled" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    errorMessage = error?.message ?? null;
  } else {
    const { error } = await supabase.from("app_installations").insert({
      organization_id: orgId,
      app_id: appId,
      status: nextStatus,
      installed_by_user_id: user.id,
      installed_at: new Date().toISOString(),
    });

    errorMessage = error?.message ?? null;
  }

  if (errorMessage) {
    redirect(`/organisations/${orgId}/apps?error=${encodeURIComponent(errorMessage)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "app_installation.updated",
    entityTable: "app_installations",
    organizationId: orgId,
    metadata: { app_id: appId, status: nextStatus },
  });

  revalidatePath(`/organisations/${orgId}/apps`);
  redirect(`/organisations/${orgId}/apps`);
}
