import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CaseDecisionRow = {
  id: string;
  case_id: string;
  decision_stage: string;
  decision: string;
  result_status: string;
  result_outcome: string | null;
  decision_note: string | null;
  conditions_text: string | null;
  decided_by_user_id: string | null;
  decided_by_name: string;
  decided_at: string;
};

export type DecisionWorkspaceContext = {
  caseId: string;
  caseCode: string;
  organizationName: string;
  reviewType: string;
  caseStatus: string;
  priority: string;
  assignmentRole: string | null;
};

export async function getDecisionWorkspaceContext(caseId: string, userId: string): Promise<DecisionWorkspaceContext | null> {
  const supabase = await createSupabaseServerClient();

  const { data: caseRow, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, review_type, status, priority")
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) throw new Error(caseError.message);
  if (!caseRow) return null;

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, legal_name")
    .eq("id", caseRow.organization_id)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("governance_case_assignments")
    .select("assignment_role, status")
    .eq("case_id", caseId)
    .eq("assignee_user_id", userId)
    .in("status", ["assigned", "accepted", "completed"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  return {
    caseId: String(caseRow.id),
    caseCode: String(caseRow.case_code),
    organizationName: String(orgRow?.legal_name ?? orgRow?.name ?? caseRow.organization_id),
    reviewType: String(caseRow.review_type),
    caseStatus: String(caseRow.status),
    priority: String(caseRow.priority),
    assignmentRole: assignmentRow?.assignment_role ? String(assignmentRow.assignment_role) : null,
  };
}

export async function listCaseDecisions(caseId: string): Promise<CaseDecisionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("governance_case_decisions")
    .select("id, case_id, decision_stage, decision, result_status, result_outcome, decision_note, conditions_text, decided_by_user_id, decided_at")
    .eq("case_id", caseId)
    .order("decided_at", { ascending: false });

  if (error) throw new Error(error.message);

  const userIds = Array.from(new Set((rows ?? []).flatMap((row) => row.decided_by_user_id ? [String(row.decided_by_user_id)] : [])));
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  if (usersError) throw new Error(usersError.message);

  const userMap = new Map((users ?? []).map((row) => [String(row.id), row]));

  return (rows ?? []).map((row) => {
    const user = row.decided_by_user_id ? userMap.get(String(row.decided_by_user_id)) : null;
    return {
      id: String(row.id),
      case_id: String(row.case_id),
      decision_stage: String(row.decision_stage),
      decision: String(row.decision),
      result_status: String(row.result_status),
      result_outcome: row.result_outcome ? String(row.result_outcome) : null,
      decision_note: row.decision_note ? String(row.decision_note) : null,
      conditions_text: row.conditions_text ? String(row.conditions_text) : null,
      decided_by_user_id: row.decided_by_user_id ? String(row.decided_by_user_id) : null,
      decided_by_name: String(user?.display_name ?? user?.email ?? row.decided_by_user_id ?? "System"),
      decided_at: String(row.decided_at),
    };
  });
}
