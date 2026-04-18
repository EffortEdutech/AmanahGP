"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

const decisionSchema = z.object({
  case_id: z.string().uuid(),
  decision_stage: z.enum(["reviewer", "scholar", "approver"]),
  decision: z.enum([
    "advance_to_scholar",
    "advance_to_approval",
    "approve",
    "approve_conditional",
    "improvement_required",
    "reject",
    "expire",
  ]),
  decision_note: z.string().trim().max(4000).optional().default(""),
  conditions_text: z.string().trim().max(4000).optional().default(""),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function mapDecision(decisionStage: string, decision: string) {
  if (decisionStage === "reviewer" && decision === "advance_to_scholar") {
    return { result_status: "scholar_review", result_outcome: null as string | null, close_case: false };
  }

  if (decisionStage === "scholar" && decision === "advance_to_approval") {
    return { result_status: "approval_pending", result_outcome: null as string | null, close_case: false };
  }

  if (decision === "approve") {
    return { result_status: "approved", result_outcome: "approved", close_case: true };
  }

  if (decision === "approve_conditional") {
    return { result_status: "approved", result_outcome: "conditional", close_case: true };
  }

  if (decision === "improvement_required") {
    return { result_status: "improvement_required", result_outcome: "improvement_required", close_case: true };
  }

  if (decision === "reject") {
    return { result_status: "rejected", result_outcome: "rejected", close_case: true };
  }

  if (decision === "expire") {
    return { result_status: "expired", result_outcome: "expired", close_case: true };
  }

  throw new Error("Unsupported decision mapping.");
}

function isDecisionAllowed(decisionStage: string, decision: string) {
  const allowed: Record<string, string[]> = {
    reviewer: ["advance_to_scholar", "improvement_required", "reject"],
    scholar: ["advance_to_approval", "improvement_required", "reject"],
    approver: ["approve", "approve_conditional", "improvement_required", "reject", "expire"],
  };

  return (allowed[decisionStage] ?? []).includes(decision);
}

function trustEventTypeForDecision(decision: string) {
  if (decision === "approve") return "gov_case_approved";
  if (decision === "approve_conditional") return "gov_case_approved_conditional";
  if (decision === "improvement_required") return "gov_case_improvement_required";
  if (decision === "reject") return "gov_case_rejected";
  if (decision === "expire") return "gov_case_expired";
  return null;
}

export async function recordGovernanceCaseDecisionAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const parsed = decisionSchema.safeParse({
    case_id: String(formData.get("case_id") ?? "").trim(),
    decision_stage: String(formData.get("decision_stage") ?? "").trim(),
    decision: String(formData.get("decision") ?? "").trim(),
    decision_note: String(formData.get("decision_note") ?? "").trim(),
    conditions_text: String(formData.get("conditions_text") ?? "").trim(),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid decision input.";
    redirect(`/cases?error=${encodeMessage(message)}`);
  }

  const input = parsed.data;

  if (!isDecisionAllowed(input.decision_stage, input.decision)) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage("Decision is not allowed for this stage.")}`);
  }

  const { data: reviewCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, status, outcome, summary, review_started_at, scholar_started_at, approval_started_at")
    .eq("id", input.case_id)
    .single();

  if (caseError || !reviewCase) {
    redirect(`/cases?error=${encodeMessage(caseError?.message ?? "Case not found.")}`);
  }

  const mapped = mapDecision(input.decision_stage, input.decision);
  const now = new Date().toISOString();

  const caseUpdate: Record<string, unknown> = {
    status: mapped.result_status,
    outcome: mapped.result_outcome,
    updated_at: now,
  };

  if (input.decision_stage === "reviewer" && !reviewCase.review_started_at) {
    caseUpdate.review_started_at = now;
  }
  if (mapped.result_status === "scholar_review" && !reviewCase.scholar_started_at) {
    caseUpdate.scholar_started_at = now;
  }
  if (mapped.result_status === "approval_pending" && !reviewCase.approval_started_at) {
    caseUpdate.approval_started_at = now;
  }
  if (mapped.close_case) {
    caseUpdate.closed_at = now;
  }

  const { data: insertedDecision, error: insertError } = await supabase
    .from("governance_case_decisions")
    .insert({
      case_id: input.case_id,
      decision_stage: input.decision_stage,
      decision: input.decision,
      result_status: mapped.result_status,
      result_outcome: mapped.result_outcome,
      decision_note: input.decision_note || null,
      conditions_text: input.conditions_text || null,
      decided_by_user_id: user.id,
      decided_at: now,
    })
    .select("id")
    .single();

  if (insertError || !insertedDecision) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(insertError?.message ?? "Failed to record decision.")}`);
  }

  const { error: updateError } = await supabase
    .from("governance_review_cases")
    .update(caseUpdate)
    .eq("id", input.case_id);

  if (updateError) {
    redirect(`/cases/${input.case_id}?error=${encodeMessage(updateError.message)}`);
  }

  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email ?? null);
  const trustEventType = trustEventTypeForDecision(input.decision);
  let trustEventId: string | null = null;

  if (trustEventType) {
    const { data: trustEvent, error: trustEventError } = await supabase
      .from("trust_events")
      .insert({
        organization_id: String(reviewCase.organization_id),
        event_type: trustEventType,
        event_ref_table: "governance_review_cases",
        event_ref_id: input.case_id,
        payload: {
          case_code: String(reviewCase.case_code),
          decision_stage: input.decision_stage,
          decision: input.decision,
          result_status: mapped.result_status,
          result_outcome: mapped.result_outcome,
          decision_note: input.decision_note || null,
          conditions_text: input.conditions_text || null,
        },
        occurred_at: now,
        actor_user_id: publicUser?.id ?? null,
        source: "reviewer",
        pillar: "governance",
        idempotency_key: `governance-case-decision:${insertedDecision.id}`,
      })
      .select("id")
      .single();

    if (trustEventError) {
      redirect(`/cases/${input.case_id}?error=${encodeMessage(trustEventError.message)}`);
    }

    trustEventId = trustEvent?.id ? String(trustEvent.id) : null;

    await supabase
      .from("governance_case_decisions")
      .update({
        emitted_trust_event_type: trustEventType,
        emitted_trust_event_id: trustEventId,
        updated_at: now,
      })
      .eq("id", insertedDecision.id);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.decision_recorded",
    entityTable: "governance_case_decisions",
    entityId: insertedDecision.id,
    organizationId: String(reviewCase.organization_id),
    metadata: {
      case_id: input.case_id,
      case_code: String(reviewCase.case_code),
      decision_stage: input.decision_stage,
      decision: input.decision,
      result_status: mapped.result_status,
      result_outcome: mapped.result_outcome,
      emitted_trust_event_type: trustEventType,
      emitted_trust_event_id: trustEventId,
    },
  });

  revalidatePath("/cases");
  revalidatePath(`/cases/${input.case_id}`);
  revalidatePath(`/organisations/${reviewCase.organization_id}`);
  revalidatePath("/events");
  revalidatePath("/trust-events");

  redirect(`/cases/${input.case_id}?message=${encodeMessage("Case decision recorded.")}`);
}
