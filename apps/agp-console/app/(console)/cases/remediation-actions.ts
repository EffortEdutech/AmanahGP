"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

const createActionItemSchema = z.object({
  case_id: z.string().uuid(),
  finding_id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).optional().default(""),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assigned_role_label: z.string().trim().max(120).optional().default(""),
  owner_name: z.string().trim().max(160).optional().default(""),
  due_at: z.string().trim().optional().default(""),
});

const updateStatusSchema = z.object({
  case_id: z.string().uuid(),
  action_item_id: z.string().uuid(),
  status: z.enum(["open", "in_progress", "submitted", "verified", "rejected", "cancelled"]),
  resolution_note: z.string().trim().max(4000).optional().default(""),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createGovernanceActionItemAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = createActionItemSchema.safeParse({
    case_id: String(formData.get("case_id") ?? "").trim(),
    finding_id: String(formData.get("finding_id") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priority: String(formData.get("priority") ?? "normal").trim(),
    assigned_role_label: String(formData.get("assigned_role_label") ?? "").trim(),
    owner_name: String(formData.get("owner_name") ?? "").trim(),
    due_at: String(formData.get("due_at") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/cases?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid action item input.")}`);
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

  const dueAtIso = input.due_at ? new Date(input.due_at).toISOString() : null;

  const { data: inserted, error: insertError } = await supabase
    .from("governance_case_action_items")
    .insert({
      case_id: input.case_id,
      finding_id: input.finding_id || null,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      assigned_role_label: input.assigned_role_label || null,
      owner_name: input.owner_name || null,
      due_at: dueAtIso,
      created_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(insertError?.message ?? "Failed to create action item.")}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.action_item_created",
    entityTable: "governance_case_action_items",
    entityId: inserted.id,
    organizationId: String(reviewCase.organization_id),
    metadata: {
      case_id: input.case_id,
      case_code: String(reviewCase.case_code),
      finding_id: input.finding_id || null,
      priority: input.priority,
      due_at: dueAtIso,
    },
  });

  revalidatePath(`/cases/${input.case_id}`);
  redirect(`/cases/${input.case_id}?message=${encodeMessage("Action item created.")}`);
}

export async function updateGovernanceActionItemStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = updateStatusSchema.safeParse({
    case_id: String(formData.get("case_id") ?? "").trim(),
    action_item_id: String(formData.get("action_item_id") ?? "").trim(),
    status: String(formData.get("status") ?? "open").trim(),
    resolution_note: String(formData.get("resolution_note") ?? "").trim(),
  });

  if (!parsed.success) {
    redirect(`/cases?error=${encodeMessage(parsed.error.issues[0]?.message ?? "Invalid action item update.")}`);
  }

  const input = parsed.data;

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: input.status,
    resolution_note: input.resolution_note || null,
    updated_at: now,
  };

  if (input.status === "verified") {
    updatePayload.verified_by_user_id = user.id;
    updatePayload.verified_at = now;
  }

  const { data: actionItem, error: itemError } = await supabase
    .from("governance_case_action_items")
    .update(updatePayload)
    .eq("id", input.action_item_id)
    .eq("case_id", input.case_id)
    .select("id, case_id")
    .single();

  if (itemError || !actionItem) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(itemError?.message ?? "Failed to update action item.")}`);
  }

  const { data: reviewCase } = await supabase
    .from("governance_review_cases")
    .select("organization_id, case_code")
    .eq("id", input.case_id)
    .single();

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.action_item_status_updated",
    entityTable: "governance_case_action_items",
    entityId: input.action_item_id,
    organizationId: reviewCase?.organization_id ? String(reviewCase.organization_id) : null,
    metadata: {
      case_id: input.case_id,
      case_code: reviewCase?.case_code ? String(reviewCase.case_code) : null,
      status: input.status,
    },
  });

  revalidatePath(`/cases/${input.case_id}`);
  redirect(`/cases/${input.case_id}?message=${encodeMessage("Action item updated.")}`);
}
