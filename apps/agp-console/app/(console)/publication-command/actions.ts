"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

const snapshotActionSchema = z.object({
  snapshot_id: z.string().uuid(),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

async function fetchSnapshotContext(supabase: any, snapshotId: string) {
  const { data: snapshot, error: snapshotError } = await supabase
    .from("organization_trust_snapshots")
    .select("id, organization_id, source_case_id, snapshot_status, trust_level, verification_badge, governance_status, public_summary, published_at, created_at, is_current")
    .eq("id", snapshotId)
    .single();

  if (snapshotError || !snapshot) {
    throw new Error(snapshotError?.message ?? "Trust snapshot not found.");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, legal_name, name, registration_no, workspace_status, listing_status")
    .eq("id", snapshot.organization_id)
    .single();

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found.");
  }

  return {
    snapshot,
    organization,
  };
}

export async function publishTrustSnapshotAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = snapshotActionSchema.safeParse({
    snapshot_id: String(formData.get("snapshot_id") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/publication-command?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid snapshot id.")}`);
  }

  try {
    const now = new Date().toISOString();
    const { snapshot, organization } = await fetchSnapshotContext(supabase, parsed.data.snapshot_id);

    const { count: openCaseCount, error: openCasesError } = await supabase
      .from("governance_review_cases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", snapshot.organization_id)
      .in("status", ["intake", "under_review", "scholar_review", "approval_pending", "improvement_required"]);

    if (openCasesError) {
      throw new Error(openCasesError.message);
    }

    const { data: installations, error: installationsError } = await supabase
      .from("app_installations")
      .select("id, status, disabled_at, app_catalog!inner(app_key)")
      .eq("organization_id", snapshot.organization_id)
      .eq("app_catalog.app_key", "amanah_hub");

    if (installationsError) {
      throw new Error(installationsError.message);
    }

    const hasAmanahHub = (installations ?? []).some((row: any) => row.status === "enabled" && !row.disabled_at);

    const blockers: string[] = [];
    if (snapshot.snapshot_status !== "draft" && !(snapshot.snapshot_status === "published" && !snapshot.is_current)) {
      blockers.push("Only draft or previously published non-current snapshots can be promoted.");
    }
    if (organization.workspace_status !== "active") blockers.push("Workspace is not active.");
    if (organization.listing_status !== "listed") blockers.push("Organisation is not listed.");
    if (!hasAmanahHub) blockers.push("AmanahHub is not enabled.");
    if ((openCaseCount ?? 0) > 0) blockers.push("There are open governance review cases.");
    if (!["reviewed", "scholar_reviewed", "approved"].includes(String(snapshot.verification_badge))) {
      blockers.push("Verification badge is not donor-safe.");
    }
    if (["rejected", "suspended"].includes(String(snapshot.governance_status))) {
      blockers.push("Governance status blocks public publication.");
    }

    if (blockers.length > 0) {
      redirect(`/publication-command?error=${encodeMessage(blockers[0])}`);
    }

    const { data: previousCurrent } = await supabase
      .from("organization_trust_snapshots")
      .select("id")
      .eq("organization_id", snapshot.organization_id)
      .eq("is_current", true)
      .maybeSingle();

    const { error: clearCurrentError } = await supabase
      .from("organization_trust_snapshots")
      .update({ is_current: false, updated_at: now })
      .eq("organization_id", snapshot.organization_id)
      .eq("is_current", true);

    if (clearCurrentError) {
      throw new Error(clearCurrentError.message);
    }

    const { error: publishError } = await supabase
      .from("organization_trust_snapshots")
      .update({
        snapshot_status: "published",
        is_current: true,
        published_at: now,
        published_by_user_id: user.id,
        effective_at: now,
        updated_at: now,
      })
      .eq("id", snapshot.id);

    if (publishError) {
      throw new Error(publishError.message);
    }

    const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? null);

    const { data: trustEvent, error: trustEventError } = await supabase
      .from("trust_events")
      .insert({
        organization_id: snapshot.organization_id,
        event_type: "trust_snapshot_published",
        event_ref_table: "organization_trust_snapshots",
        event_ref_id: snapshot.id,
        payload: {
          source_case_id: snapshot.source_case_id,
          trust_level: snapshot.trust_level,
          verification_badge: snapshot.verification_badge,
          governance_status: snapshot.governance_status,
          public_summary: snapshot.public_summary,
          organization_name: organization.legal_name || organization.name || null,
          registration_no: organization.registration_no || null,
          previous_current_snapshot_id: previousCurrent?.id ?? null,
          publication_mode: "publication_command_center",
        },
        occurred_at: now,
        actor_user_id: publicUser?.id ?? null,
        source: "approval",
        pillar: "transparency",
        idempotency_key: `publication-command:publish:${snapshot.id}:${now}`,
      })
      .select("id")
      .single();

    if (trustEventError) {
      throw new Error(trustEventError.message);
    }

    await writeAuditLog(supabase, user.id, {
      action: "organization_trust_snapshot.published",
      entityTable: "organization_trust_snapshots",
      entityId: snapshot.id,
      organizationId: snapshot.organization_id,
      metadata: {
        source_case_id: snapshot.source_case_id,
        previous_current_snapshot_id: previousCurrent?.id ?? null,
        emitted_trust_event_id: trustEvent?.id ?? null,
        emitted_trust_event_type: "trust_snapshot_published",
        publication_mode: "publication_command_center",
      },
    });

    revalidatePath("/publication-command");
    revalidatePath("/publication-readiness");
    revalidatePath("/public-trust-profiles");
    revalidatePath("/trust-snapshots");
    revalidatePath(`/public-trust-profiles/${snapshot.organization_id}`);
    if (snapshot.source_case_id) {
      revalidatePath(`/cases/${snapshot.source_case_id}`);
      revalidatePath(`/cases/${snapshot.source_case_id}/dossier`);
    }

    redirect(`/publication-command?message=${encodeMessage("Trust snapshot published to donor-facing profile.")}`);
  } catch (error) {
    redirect(`/publication-command?error=${encodeMessage(error instanceof Error ? error.message : "Failed to publish trust snapshot.")}`);
  }
}

export async function unpublishTrustSnapshotAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = snapshotActionSchema.safeParse({
    snapshot_id: String(formData.get("snapshot_id") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/publication-command?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid snapshot id.")}`);
  }

  try {
    const now = new Date().toISOString();
    const { snapshot, organization } = await fetchSnapshotContext(supabase, parsed.data.snapshot_id);

    if (!snapshot.is_current || snapshot.snapshot_status !== "published") {
      redirect(`/publication-command?error=${encodeMessage("Only the current published snapshot can be unpublished.")}`);
    }

    const { error: updateError } = await supabase
      .from("organization_trust_snapshots")
      .update({
        is_current: false,
        updated_at: now,
      })
      .eq("id", snapshot.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? null);

    const { data: trustEvent, error: trustEventError } = await supabase
      .from("trust_events")
      .insert({
        organization_id: snapshot.organization_id,
        event_type: "trust_snapshot_unpublished",
        event_ref_table: "organization_trust_snapshots",
        event_ref_id: snapshot.id,
        payload: {
          source_case_id: snapshot.source_case_id,
          trust_level: snapshot.trust_level,
          verification_badge: snapshot.verification_badge,
          governance_status: snapshot.governance_status,
          organization_name: organization.legal_name || organization.name || null,
          registration_no: organization.registration_no || null,
          publication_mode: "publication_command_center",
        },
        occurred_at: now,
        actor_user_id: publicUser?.id ?? null,
        source: "approval",
        pillar: "transparency",
        idempotency_key: `publication-command:unpublish:${snapshot.id}:${now}`,
      })
      .select("id")
      .single();

    if (trustEventError) {
      throw new Error(trustEventError.message);
    }

    await writeAuditLog(supabase, user.id, {
      action: "organization_trust_snapshot.unpublished",
      entityTable: "organization_trust_snapshots",
      entityId: snapshot.id,
      organizationId: snapshot.organization_id,
      metadata: {
        source_case_id: snapshot.source_case_id,
        emitted_trust_event_id: trustEvent?.id ?? null,
        emitted_trust_event_type: "trust_snapshot_unpublished",
        publication_mode: "publication_command_center",
      },
    });

    revalidatePath("/publication-command");
    revalidatePath("/publication-readiness");
    revalidatePath("/public-trust-profiles");
    revalidatePath("/trust-snapshots");
    revalidatePath(`/public-trust-profiles/${snapshot.organization_id}`);
    if (snapshot.source_case_id) {
      revalidatePath(`/cases/${snapshot.source_case_id}`);
      revalidatePath(`/cases/${snapshot.source_case_id}/dossier`);
    }

    redirect(`/publication-command?message=${encodeMessage("Current donor-facing profile unpublished.")}`);
  } catch (error) {
    redirect(`/publication-command?error=${encodeMessage(error instanceof Error ? error.message : "Failed to unpublish trust snapshot.")}`);
  }
}
