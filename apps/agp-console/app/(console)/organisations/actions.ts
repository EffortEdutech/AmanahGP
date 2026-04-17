"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

const ONBOARDING_STATUSES = ["draft", "submitted", "changes_requested", "approved", "rejected"] as const;
const LISTING_STATUSES = ["private", "listed", "unlisted", "suspended"] as const;

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
  onboarding_status: z.enum(ONBOARDING_STATUSES).default("draft"),
  listing_status: z.enum(LISTING_STATUSES).default("private"),
});

function resolveLifecycleFields(input: {
  onboarding_status: (typeof ONBOARDING_STATUSES)[number];
  listing_status: (typeof LISTING_STATUSES)[number];
  existingSubmittedAt?: string | null;
  existingApprovedAt?: string | null;
  publicUserId?: string | null;
}) {
  if (input.listing_status === "listed" && input.onboarding_status !== "approved") {
    throw new Error("Only approved organisations can be listed.");
  }

  const now = new Date().toISOString();

  return {
    onboarding_submitted_at:
      input.onboarding_status === "submitted"
        ? input.existingSubmittedAt ?? now
        : input.onboarding_status === "draft"
          ? null
          : input.existingSubmittedAt ?? null,
    approved_at: input.onboarding_status === "approved" ? input.existingApprovedAt ?? now : null,
    approved_by_user_id: input.onboarding_status === "approved" ? input.publicUserId ?? null : null,
  };
}

export async function createOrganizationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");
  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? undefined);

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
  });

  if (!parsed.success) {
    redirect(`/organisations/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const payload = parsed.data;

  let lifecycle;
  try {
    lifecycle = resolveLifecycleFields({
      onboarding_status: payload.onboarding_status,
      listing_status: payload.listing_status,
      publicUserId: publicUser?.id ?? null,
    });
  } catch (error) {
    redirect(`/organisations/new?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid lifecycle")}`);
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      ...payload,
      ...lifecycle,
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
    metadata: {
      legal_name: payload.legal_name,
      onboarding_status: payload.onboarding_status,
      listing_status: payload.listing_status,
    },
  });

  revalidatePath("/organisations");
  redirect(`/organisations/${data.id}?created=1`);
}

export async function updateOrganizationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");
  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? undefined);
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
  });

  if (!orgId) {
    redirect("/organisations?error=Missing organization id");
  }

  if (!parsed.success) {
    redirect(`/organisations/${orgId}/edit?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("organizations")
    .select("id, onboarding_submitted_at, approved_at")
    .eq("id", orgId)
    .single();

  if (existingError || !existing) {
    redirect(`/organisations/${orgId}/edit?error=${encodeURIComponent(existingError?.message ?? "Organization not found")}`);
  }

  const payload = parsed.data;

  let lifecycle;
  try {
    lifecycle = resolveLifecycleFields({
      onboarding_status: payload.onboarding_status,
      listing_status: payload.listing_status,
      existingSubmittedAt: existing.onboarding_submitted_at,
      existingApprovedAt: existing.approved_at,
      publicUserId: publicUser?.id ?? null,
    });
  } catch (error) {
    redirect(`/organisations/${orgId}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid lifecycle")}`);
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      ...payload,
      ...lifecycle,
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
    metadata: {
      legal_name: payload.legal_name,
      onboarding_status: payload.onboarding_status,
      listing_status: payload.listing_status,
    },
  });

  revalidatePath("/organisations");
  revalidatePath(`/organisations/${orgId}`);
  redirect(`/organisations/${orgId}?updated=1`);
}

export async function updateOrganizationStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("organizations.write");
  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? undefined);
  const orgId = String(formData.get("org_id") ?? "");
  const onboardingStatus = String(formData.get("onboarding_status") ?? "draft");
  const listingStatus = String(formData.get("listing_status") ?? "private");

  if (!orgId) {
    redirect("/organisations?error=Missing organization id");
  }

  if (!ONBOARDING_STATUSES.includes(onboardingStatus as (typeof ONBOARDING_STATUSES)[number])) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent("Invalid onboarding status")}`);
  }

  if (!LISTING_STATUSES.includes(listingStatus as (typeof LISTING_STATUSES)[number])) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent("Invalid listing status")}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("organizations")
    .select("id, onboarding_submitted_at, approved_at")
    .eq("id", orgId)
    .single();

  if (existingError || !existing) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent(existingError?.message ?? "Organization not found")}`);
  }

  let lifecycle;
  try {
    lifecycle = resolveLifecycleFields({
      onboarding_status: onboardingStatus as (typeof ONBOARDING_STATUSES)[number],
      listing_status: listingStatus as (typeof LISTING_STATUSES)[number],
      existingSubmittedAt: existing.onboarding_submitted_at,
      existingApprovedAt: existing.approved_at,
      publicUserId: publicUser?.id ?? null,
    });
  } catch (error) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid lifecycle")}`);
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      onboarding_status: onboardingStatus,
      listing_status: listingStatus,
      ...lifecycle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) {
    redirect(`/organisations/${orgId}?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization.lifecycle_updated",
    entityTable: "organizations",
    entityId: orgId,
    organizationId: orgId,
    metadata: { onboarding_status: onboardingStatus, listing_status: listingStatus },
  });

  revalidatePath("/organisations");
  revalidatePath(`/organisations/${orgId}`);
  redirect(`/organisations/${orgId}?updated=1`);
}

export async function runOrganizationLifecycleAction(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "");
  const transition = String(formData.get("transition") ?? "");

  const mapping: Record<string, { onboarding_status: (typeof ONBOARDING_STATUSES)[number]; listing_status: (typeof LISTING_STATUSES)[number] }> = {
    submit: { onboarding_status: "submitted", listing_status: "private" },
    request_changes: { onboarding_status: "changes_requested", listing_status: "private" },
    approve: { onboarding_status: "approved", listing_status: "private" },
    reject: { onboarding_status: "rejected", listing_status: "private" },
    list: { onboarding_status: "approved", listing_status: "listed" },
    unlist: { onboarding_status: "approved", listing_status: "unlisted" },
    suspend_listing: { onboarding_status: "approved", listing_status: "suspended" },
    reset_to_draft: { onboarding_status: "draft", listing_status: "private" },
  };

  const next = mapping[transition];

  if (!orgId || !next) {
    redirect(`/organisations/${orgId || ""}?error=${encodeURIComponent("Invalid lifecycle transition")}`);
  }

  const nextFormData = new FormData();
  nextFormData.set("org_id", orgId);
  nextFormData.set("onboarding_status", next.onboarding_status);
  nextFormData.set("listing_status", next.listing_status);

  await updateOrganizationStatusAction(nextFormData);
}
