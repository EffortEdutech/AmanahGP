"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DecisionMap = {
  resultStatus: string;
  resultOutcome: string | null;
  setScholarStarted?: boolean;
  setApprovalStarted?: boolean;
  setClosed?: boolean;
};

const DECISION_RULES: Record<string, Record<string, DecisionMap>> = {
  reviewer: {
    advance_to_scholar: { resultStatus: "scholar_review", resultOutcome: null, setScholarStarted: true },
    advance_to_approval: { resultStatus: "approval_pending", resultOutcome: null, setApprovalStarted: true },
    improvement_required: { resultStatus: "improvement_required", resultOutcome: "improvement_required" },
    reject: { resultStatus: "rejected", resultOutcome: "rejected", setClosed: true },
  },
  scholar: {
    advance_to_approval: { resultStatus: "approval_pending", resultOutcome: null, setApprovalStarted: true },
    improvement_required: { resultStatus: "improvement_required", resultOutcome: "improvement_required" },
    reject: { resultStatus: "rejected", resultOutcome: "rejected", setClosed: true },
  },
  approver: {
    approve: { resultStatus: "approved", resultOutcome: "approved", setClosed: true },
    approve_conditional: { resultStatus: "approved", resultOutcome: "conditional", setClosed: true },
    improvement_required: { resultStatus: "improvement_required", resultOutcome: "improvement_required" },
    reject: { resultStatus: "rejected", resultOutcome: "rejected", setClosed: true },
    expire: { resultStatus: "expired", resultOutcome: "expired", setClosed: true },
  },
};

export async function submitCaseDecisionAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.write");
  const supabase = await createSupabaseServerClient();

  const caseId = String(formData.get("case_id") ?? "");
  const decisionStage = String(formData.get("decision_stage") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const decisionNote = String(formData.get("decision_note") ?? "").trim();
  const conditionsText = String(formData.get("conditions_text") ?? "").trim();

  if (!caseId) throw new Error("Case id is required.");
  const stageRules = DECISION_RULES[decisionStage];
  if (!stageRules) throw new Error("Invalid decision stage.");
  const rule = stageRules[decision];
  if (!rule) throw new Error("Decision not allowed for this stage.");

  const now = new Date().toISOString();

  const { error: decisionError } = await supabase.from("governance_case_decisions").insert({
    case_id: caseId,
    decision_stage: decisionStage,
    decision,
    result_status: rule.resultStatus,
    result_outcome: rule.resultOutcome,
    decision_note: decisionNote || null,
    conditions_text: conditionsText || null,
    decided_by_user_id: user.id,
    decided_at: now,
    updated_at: now,
  });

  if (decisionError) throw new Error(decisionError.message);

  const caseUpdate: Record<string, string | null> = {
    status: rule.resultStatus,
    outcome: rule.resultOutcome,
    updated_at: now,
  };
  if (rule.setScholarStarted) caseUpdate.scholar_started_at = now;
  if (rule.setApprovalStarted) caseUpdate.approval_started_at = now;
  if (rule.setClosed) caseUpdate.closed_at = now;

  const { error: caseError } = await supabase
    .from("governance_review_cases")
    .update(caseUpdate)
    .eq("id", caseId);

  if (caseError) throw new Error(caseError.message);

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/decision`);
  revalidatePath(`/cases/${caseId}/recommendations`);
  revalidatePath(`/review-workbench`);
  redirect(`/cases/${caseId}/decision?success=submitted`);
}
