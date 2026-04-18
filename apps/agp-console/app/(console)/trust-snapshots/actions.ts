"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

const createTrustSnapshotSchema = z.object({
  organization_id: z.string().uuid(),
  source_case_id: z.string().uuid().optional().or(z.literal("")),
  snapshot_status: z.enum(["draft", "published"]),
  trust_level: z.enum(["unrated", "watchlist", "developing", "assured", "exemplary"]),
  verification_badge: z.enum(["none", "reviewed", "scholar_reviewed", "approved"]),
  governance_status: z.enum(["under_review", "improvement_required", "approved", "approved_conditional", "rejected", "suspended"]),
  public_summary: z.string().trim().min(10).max(4000),
  public_highlights: z.string().trim().max(4000).optional().default(""),
  internal_note: z.string().trim().max(4000).optional().default(""),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createTrustSnapshotAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = createTrustSnapshotSchema.safeParse({
    organization_id: String(formData.get("organization_id") ?? "").trim(),
    source_case_id: String(formData.get("source_case_id") ?? "").trim(),
    snapshot_status: String(formData.get("snapshot_status") ?? "draft").trim(),
    trust_level: String(formData.get("trust_level") ?? "developing").trim(),
    verification_badge: String(formData.get("verification_badge") ?? "reviewed").trim(),
    governance_status: String(formData.get("governance_status") ?? "under_review").trim(),
    public_summary: String(formData.get("public_summary") ?? "").trim(),
    public_highlights: String(formData.get("public_highlights") ?? "").trim(),
    internal_note: String(formData.get("internal_note") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/trust-snapshots?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid trust snapshot input.")}`);
  }

  const input = parsed.data;
  const now = new Date().toISOString();
  const highlights = input.public_highlights
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, legal_name, name, registration_no")
    .eq("id", input.organization_id)
    .single();

  if (organizationError || !organization) {
    redirect(`/trust-snapshots?error=${encodeMessage(organizationError?.message ?? "Organization not found.")}`);
  }

  if (input.snapshot_status === "published") {
    await supabase
      .from("organization_trust_snapshots")
      .update({ is_current: false, updated_at: now })
      .eq("organization_id", input.organization_id)
      .eq("is_current", true);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("organization_trust_snapshots")
    .insert({
      organization_id: input.organization_id,
      source_case_id: input.source_case_id || null,
      snapshot_status: input.snapshot_status,
      trust_level: input.trust_level,
      verification_badge: input.verification_badge,
      governance_status: input.governance_status,
      public_summary: input.public_summary,
      public_highlights: highlights,
      internal_note: input.internal_note || null,
      effective_at: now,
      published_at: input.snapshot_status === "published" ? now : null,
      published_by_user_id: input.snapshot_status === "published" ? user.id : null,
      created_by_user_id: user.id,
      is_current: input.snapshot_status === "published",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(`/trust-snapshots?error=${encodeMessage(insertError?.message ?? "Failed to create trust snapshot.")}`);
  }

  let trustEventId: string | null = null;

  if (input.snapshot_status === "published") {
    const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? null);

    const { data: trustEvent, error: trustEventError } = await supabase
      .from("trust_events")
      .insert({
        organization_id: input.organization_id,
        event_type: "trust_snapshot_published",
        event_ref_table: "organization_trust_snapshots",
        event_ref_id: inserted.id,
        payload: {
          source_case_id: input.source_case_id || null,
          trust_level: input.trust_level,
          verification_badge: input.verification_badge,
          governance_status: input.governance_status,
          public_summary: input.public_summary,
          public_highlights: highlights,
          organization_name: organization.legal_name || organization.name || null,
          registration_no: organization.registration_no || null,
        },
        occurred_at: now,
        actor_user_id: publicUser?.id ?? null,
        source: "reviewer",
        pillar: "transparency",
        idempotency_key: `trust-snapshot-published:${inserted.id}`,
      })
      .select("id")
      .single();

    if (trustEventError) {
      redirect(`/trust-snapshots?error=${encodeMessage(trustEventError.message)}`);
    }

    trustEventId = trustEvent?.id ? String(trustEvent.id) : null;
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization_trust_snapshot.created",
    entityTable: "organization_trust_snapshots",
    entityId: inserted.id,
    organizationId: input.organization_id,
    metadata: {
      source_case_id: input.source_case_id || null,
      snapshot_status: input.snapshot_status,
      trust_level: input.trust_level,
      governance_status: input.governance_status,
      emitted_trust_event_type: input.snapshot_status === "published" ? "trust_snapshot_published" : null,
      emitted_trust_event_id: trustEventId,
    },
  });

  revalidatePath("/trust-snapshots");
  revalidatePath("/trust-events");
  if (input.source_case_id) {
    revalidatePath(`/cases/${input.source_case_id}`);
  }
  redirect(`/trust-snapshots?message=${encodeMessage("Trust snapshot saved.")}`);
}
