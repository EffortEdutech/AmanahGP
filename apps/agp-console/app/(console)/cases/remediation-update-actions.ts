"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

const createUpdateSchema = z.object({
  case_id: z.string().uuid(),
  action_item_id: z.string().uuid(),
  source: z.enum(["console", "amanah_os"]),
  update_type: z.enum(["note", "evidence_submitted", "status_update", "resubmission"]),
  message: z.string().trim().min(3).max(4000),
  proposed_status: z.enum(["", "open", "in_progress", "submitted", "verified", "rejected", "cancelled"]),
  attachment_url: z.string().trim().url().optional().or(z.literal("")),
});

const reviewUpdateSchema = z.object({
  case_id: z.string().uuid(),
  action_update_id: z.string().uuid(),
  decision: z.enum(["accepted", "rejected", "needs_more_info"]),
  review_note: z.string().trim().max(4000).optional().default(""),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createGovernanceActionUpdateAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = createUpdateSchema.safeParse({
    case_id: String(formData.get("case_id") ?? "").trim(),
    action_item_id: String(formData.get("action_item_id") ?? "").trim(),
    source: String(formData.get("source") ?? "amanah_os").trim(),
    update_type: String(formData.get("update_type") ?? "resubmission").trim(),
    message: String(formData.get("message") ?? "").trim(),
    proposed_status: String(formData.get("proposed_status") ?? "").trim(),
    attachment_url: String(formData.get("attachment_url") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/cases?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid remediation update input.")}`);
  }

  const input = parsed.data;

  const { data: reviewCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id")
    .eq("id", input.case_id)
    .single();

  if (caseError || !reviewCase) {
    redirect(`/cases?error=${encodeMessage(caseError?.message ?? "Case not found.")}`);
  }

  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("governance_case_action_updates")
    .insert({
      case_id: input.case_id,
      action_item_id: input.action_item_id,
      source: input.source,
      update_type: input.update_type,
      message: input.message,
      proposed_status: input.proposed_status || null,
      attachment_url: input.attachment_url || null,
      submitted_by_user_id: user.id,
      submitted_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(insertError?.message ?? "Failed to create remediation update.")}`);
  }

  if (input.proposed_status === "submitted") {
    await supabase
      .from("governance_case_action_items")
      .update({ status: "submitted", updated_at: now })
      .eq("id", input.action_item_id);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.action_update_created",
    entityTable: "governance_case_action_updates",
    entityId: inserted.id,
    organizationId: String(reviewCase.organization_id),
    metadata: {
      case_id: input.case_id,
      case_code: String(reviewCase.case_code),
      action_item_id: input.action_item_id,
      source: input.source,
      update_type: input.update_type,
      proposed_status: input.proposed_status || null,
    },
  });

  revalidatePath(`/cases/${input.case_id}`);
  redirect(`/cases/${input.case_id}?message=${encodeMessage("Remediation update recorded.")}`);
}

export async function reviewGovernanceActionUpdateAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = reviewUpdateSchema.safeParse({
    case_id: String(formData.get("case_id") ?? "").trim(),
    action_update_id: String(formData.get("action_update_id") ?? "").trim(),
    decision: String(formData.get("decision") ?? "").trim(),
    review_note: String(formData.get("review_note") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/cases?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid remediation review input.")}`);
  }

  const input = parsed.data;
  const now = new Date().toISOString();

  const { data: updateRow, error: updateRowError } = await supabase
    .from("governance_case_action_updates")
    .select("id, case_id, action_item_id, proposed_status")
    .eq("id", input.action_update_id)
    .eq("case_id", input.case_id)
    .single();

  if (updateRowError || !updateRow) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(updateRowError?.message ?? "Update not found.")}`);
  }

  const { error: reviewError } = await supabase
    .from("governance_case_action_updates")
    .update({
      review_status: input.decision,
      review_note: input.review_note || null,
      reviewed_by_user_id: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", input.action_update_id);

  if (reviewError) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(reviewError.message)}`);
  }

  if (input.decision === "accepted") {
    const nextStatus = updateRow.proposed_status ? String(updateRow.proposed_status) : "submitted";
    const payload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: now,
    };
    if (nextStatus === "verified") {
      payload.verified_by_user_id = user.id;
      payload.verified_at = now;
    }
    await supabase
      .from("governance_case_action_items")
      .update(payload)
      .eq("id", updateRow.action_item_id);
  }

  if (input.decision === "rejected" || input.decision === "needs_more_info") {
    await supabase
      .from("governance_case_action_items")
      .update({ status: "in_progress", updated_at: now })
      .eq("id", updateRow.action_item_id);
  }

  const { data: reviewCase } = await supabase
    .from("governance_review_cases")
    .select("organization_id, case_code")
    .eq("id", input.case_id)
    .single();

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.action_update_reviewed",
    entityTable: "governance_case_action_updates",
    entityId: input.action_update_id,
    organizationId: reviewCase?.organization_id ? String(reviewCase.organization_id) : null,
    metadata: {
      case_id: input.case_id,
      case_code: reviewCase?.case_code ? String(reviewCase.case_code) : null,
      decision: input.decision,
    },
  });

  revalidatePath(`/cases/${input.case_id}`);
  redirect(`/cases/${input.case_id}?message=${encodeMessage("Remediation update reviewed.")}`);
}
