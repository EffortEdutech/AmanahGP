import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceCaseDecisionRow = {
  id: string;
  case_id: string;
  decision_stage: string;
  decision: string;
  result_status: string;
  result_outcome: string | null;
  decision_note: string | null;
  conditions_text: string | null;
  decided_by_user_id: string | null;
  decided_at: string;
  emitted_trust_event_type: string | null;
  emitted_trust_event_id: string | null;
  created_at: string;
  updated_at: string;
  actor: {
    display_name: string | null;
    email: string | null;
  } | null;
};

export async function listGovernanceCaseDecisions(caseId: string): Promise<GovernanceCaseDecisionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_decisions")
    .select(
      "id, case_id, decision_stage, decision, result_status, result_outcome, decision_note, conditions_text, decided_by_user_id, decided_at, emitted_trust_event_type, emitted_trust_event_id, created_at, updated_at",
    )
    .eq("case_id", caseId)
    .order("decided_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authUserIds = Array.from(new Set((data ?? []).map((row) => String(row.decided_by_user_id || "")).filter(Boolean)));
  const actorByAuthUserId = new Map<string, { display_name: string | null; email: string | null }>();

  if (authUserIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("auth_provider_user_id, display_name, email")
      .in("auth_provider_user_id", authUserIds);

    if (usersError) {
      throw new Error(usersError.message);
    }

    (users ?? []).forEach((row) => {
      actorByAuthUserId.set(String(row.auth_provider_user_id), {
        display_name: row.display_name ? String(row.display_name) : null,
        email: row.email ? String(row.email) : null,
      });
    });
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    case_id: String(row.case_id),
    decision_stage: String(row.decision_stage),
    decision: String(row.decision),
    result_status: String(row.result_status),
    result_outcome: row.result_outcome ? String(row.result_outcome) : null,
    decision_note: row.decision_note ? String(row.decision_note) : null,
    conditions_text: row.conditions_text ? String(row.conditions_text) : null,
    decided_by_user_id: row.decided_by_user_id ? String(row.decided_by_user_id) : null,
    decided_at: String(row.decided_at),
    emitted_trust_event_type: row.emitted_trust_event_type ? String(row.emitted_trust_event_type) : null,
    emitted_trust_event_id: row.emitted_trust_event_id ? String(row.emitted_trust_event_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    actor: row.decided_by_user_id ? actorByAuthUserId.get(String(row.decided_by_user_id)) ?? null : null,
  }));
}

export async function getGovernanceCaseDecisionSummary(caseId: string) {
  const rows = await listGovernanceCaseDecisions(caseId);
  const latest = rows[0] ?? null;

  return {
    total_decisions: rows.length,
    reviewer_decisions: rows.filter((row) => row.decision_stage === "reviewer").length,
    scholar_decisions: rows.filter((row) => row.decision_stage === "scholar").length,
    approver_decisions: rows.filter((row) => row.decision_stage === "approver").length,
    latest_stage: latest?.decision_stage ?? null,
    latest_decision: latest?.decision ?? null,
    latest_status: latest?.result_status ?? null,
    latest_outcome: latest?.result_outcome ?? null,
    latest_decided_at: latest?.decided_at ?? null,
  };
}
