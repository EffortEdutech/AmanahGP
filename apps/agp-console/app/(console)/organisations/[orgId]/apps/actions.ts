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
    .select("id, config")
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
      config: {
        provisioned_from: "agp_console",
        provisioned_at: new Date().toISOString(),
      },
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
  revalidatePath(`/organisations/${orgId}`);
  redirect(`/organisations/${orgId}/apps`);
}

export async function updateAppInstallationConfigAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("apps.write");
  const orgId = String(formData.get("org_id") ?? "");
  const appId = String(formData.get("app_id") ?? "");

  if (!orgId || !appId) {
    redirect("/organisations?error=Missing app provisioning reference");
  }

  const workspaceSlug = String(formData.get("workspace_slug") ?? "").trim();
  const workspaceUrl = String(formData.get("workspace_url") ?? "").trim();
  const seatsAllocatedRaw = String(formData.get("seats_allocated") ?? "").trim();
  const featureFlagsRaw = String(formData.get("feature_flags") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const seatsAllocated = seatsAllocatedRaw ? Number(seatsAllocatedRaw) : null;
  if (seatsAllocatedRaw && Number.isNaN(seatsAllocated)) {
    redirect(`/organisations/${orgId}/apps?error=${encodeURIComponent("Seats allocated must be a valid number")}`);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("app_installations")
    .select("id, config")
    .eq("organization_id", orgId)
    .eq("app_id", appId)
    .maybeSingle();

  if (fetchError) {
    redirect(`/organisations/${orgId}/apps?error=${encodeURIComponent(fetchError.message)}`);
  }

  if (!existing?.id) {
    redirect(`/organisations/${orgId}/apps?error=${encodeURIComponent("Install the app before saving provisioning config")}`);
  }

  const mergedConfig = {
    ...(existing.config ?? {}),
    workspace_slug: workspaceSlug || null,
    workspace_url: workspaceUrl || null,
    seats_allocated: typeof seatsAllocated === "number" ? seatsAllocated : null,
    feature_flags: featureFlagsRaw
      ? featureFlagsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    notes: notes || null,
    updated_from_console_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("app_installations")
    .update({
      config: mergedConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    redirect(`/organisations/${orgId}/apps?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "app_installation.config_updated",
    entityTable: "app_installations",
    organizationId: orgId,
    metadata: {
      app_id: appId,
      workspace_slug: mergedConfig.workspace_slug,
      workspace_url: mergedConfig.workspace_url,
      seats_allocated: mergedConfig.seats_allocated,
      feature_flags: mergedConfig.feature_flags,
    },
  });

  revalidatePath(`/organisations/${orgId}/apps`);
  revalidatePath(`/organisations/${orgId}`);
  revalidatePath(`/audit`);
  redirect(`/organisations/${orgId}/apps`);
}
