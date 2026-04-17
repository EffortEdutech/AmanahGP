"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Display name is required"),
  legal_name: z.string().trim().min(2, "Legal name is required"),
  registration_no: z.string().trim().optional().transform((value) => value || null),
  org_type: z.string().trim().optional().transform((value) => value || null),
  website_url: z.string().trim().optional().transform((value) => value || null),
  contact_email: z.string().trim().optional().transform((value) => value || null),
  contact_phone: z.string().trim().optional().transform((value) => value || null),
  address_text: z.string().trim().optional().transform((value) => value || null),
  country: z.string().trim().min(2).max(2).default("MY"),
  state: z.string().trim().optional().transform((value) => value || null),
  oversight_authority: z.string().trim().optional().transform((value) => value || null),
  summary: z.string().trim().optional().transform((value) => value || null),
  onboarding_status: z.string().trim().min(1),
  listing_status: z.string().trim().min(1),
  workspace_status: z.string().trim().min(1),
  owner_user_id: z.string().trim().optional().transform((value) => value || null),
});

export async function createOrganizationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    legal_name: formData.get("legal_name"),
    registration_no: formData.get("registration_no"),
    org_type: formData.get("org_type"),
    website_url: formData.get("website_url"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    address_text: formData.get("address_text"),
    country: formData.get("country") || "MY",
    state: formData.get("state"),
    oversight_authority: formData.get("oversight_authority"),
    summary: formData.get("summary"),
    onboarding_status: formData.get("onboarding_status") || "draft",
    listing_status: formData.get("listing_status") || "private",
    workspace_status: formData.get("workspace_status") || "draft",
    owner_user_id: formData.get("owner_user_id"),
  });

  if (!parsed.success) {
    redirect(`/organisations/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const payload = parsed.data;

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/organisations/new?error=${encodeURIComponent(error?.message ?? "Unable to create organization")}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization.created",
    entityTable: "organizations",
    entityId: data.id,
    organizationId: data.id,
    metadata: { legal_name: payload.legal_name, workspace_status: payload.workspace_status },
  });

  revalidatePath("/organisations");
  redirect(`/organisations/${data.id}`);
}

export async function updateOrganizationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");
  const orgId = String(formData.get("org_id") ?? "");

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    legal_name: formData.get("legal_name"),
    registration_no: formData.get("registration_no"),
    org_type: formData.get("org_type"),
    website_url: formData.get("website_url"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    address_text: formData.get("address_text"),
    country: formData.get("country") || "MY",
    state: formData.get("state"),
    oversight_authority: formData.get("oversight_authority"),
    summary: formData.get("summary"),
    onboarding_status: formData.get("onboarding_status") || "draft",
    listing_status: formData.get("listing_status") || "private",
    workspace_status: formData.get("workspace_status") || "draft",
    owner_user_id: formData.get("owner_user_id"),
  });

  if (!orgId) {
    redirect("/organisations?error=Missing organization id");
  }

  if (!parsed.success) {
    redirect(`/organisations/${orgId}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const payload = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) {
    redirect(`/organisations/${orgId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization.updated",
    entityTable: "organizations",
    entityId: orgId,
    organizationId: orgId,
    metadata: { legal_name: payload.legal_name, workspace_status: payload.workspace_status },
  });

  revalidatePath("/organisations");
  revalidatePath(`/organisations/${orgId}`);
  redirect(`/organisations/${orgId}`);
}

export async function updateOrganizationStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");
  const orgId = String(formData.get("org_id") ?? "");
  const workspaceStatus = String(formData.get("workspace_status") ?? "draft");
  const onboardingStatus = String(formData.get("onboarding_status") ?? "draft");
  const listingStatus = String(formData.get("listing_status") ?? "private");

  if (!orgId) {
    redirect("/organisations?error=Missing organization id");
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      workspace_status: workspaceStatus,
      onboarding_status: onboardingStatus,
      listing_status: listingStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization.status_updated",
    entityTable: "organizations",
    entityId: orgId,
    organizationId: orgId,
    metadata: { workspace_status: workspaceStatus, onboarding_status: onboardingStatus, listing_status: listingStatus },
  });

  revalidatePath(`/organisations/${orgId}`);
  redirect(`/organisations/${orgId}`);
}
