import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceUatRow = {
  trust_event_id: string;
  organization_id: string;
  organization_name: string;
  event_type: string;
  pillar: string | null;
  event_source: string;
  event_occurred_at: string;
  routing_mode: string | null;
  intake_status: string | null;
  suggested_case_type: string | null;
  suggested_priority: string | null;
  suggested_assignment_role: string | null;
  case_id: string | null;
  case_code: string | null;
  case_review_type: string | null;
  case_status: string | null;
  case_priority: string | null;
  case_outcome: string | null;
  case_due_at: string | null;
  reviewer_assignments: number;
  reviewer_recommendations: number;
  scholar_assignments: number;
  scholar_recommendations: number;
  approver_assignments: number;
  latest_decision_stage: string | null;
  latest_decision: string | null;
  latest_result_status: string | null;
  latest_result_outcome: string | null;
  latest_decision_at: string | null;
  snapshot_id: string | null;
  snapshot_status: string | null;
  snapshot_trust_level: string | null;
  snapshot_verification_badge: string | null;
  snapshot_governance_status: string | null;
  snapshot_published_at: string | null;
  intake_created: boolean;
  case_opened: boolean;
  reviewer_completed: boolean;
  scholar_completed: boolean;
  decision_recorded: boolean;
  snapshot_exists: boolean;
  donor_facing: boolean;
};

export type GovernanceUatSummary = {
  total_rows: number;
  intake_created: number;
  cases_opened: number;
  reviewer_completed: number;
  scholar_completed: number;
  decisions_recorded: number;
  snapshots_created: number;
  donor_facing: number;
  waiting_reviewer: number;
  waiting_scholar: number;
  waiting_decision: number;
  waiting_publication: number;
};

function asString(value: unknown) {
  return value == null ? null : String(value);
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function asBoolean(value: unknown) {
  return value === true;
}

export async function listGovernanceUatRows(limit = 100): Promise<GovernanceUatRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_governance_workflow_uat")
    .select("*")
    .order("event_occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    trust_event_id: String(row.trust_event_id),
    organization_id: String(row.organization_id),
    organization_name: String(row.organization_name ?? "Unknown organisation"),
    event_type: String(row.event_type),
    pillar: asString(row.pillar),
    event_source: String(row.event_source ?? "system"),
    event_occurred_at: String(row.event_occurred_at),
    routing_mode: asString(row.routing_mode),
    intake_status: asString(row.intake_status),
    suggested_case_type: asString(row.suggested_case_type),
    suggested_priority: asString(row.suggested_priority),
    suggested_assignment_role: asString(row.suggested_assignment_role),
    case_id: asString(row.case_id),
    case_code: asString(row.case_code),
    case_review_type: asString(row.case_review_type),
    case_status: asString(row.case_status),
    case_priority: asString(row.case_priority),
    case_outcome: asString(row.case_outcome),
    case_due_at: asString(row.case_due_at),
    reviewer_assignments: asNumber(row.reviewer_assignments),
    reviewer_recommendations: asNumber(row.reviewer_recommendations),
    scholar_assignments: asNumber(row.scholar_assignments),
    scholar_recommendations: asNumber(row.scholar_recommendations),
    approver_assignments: asNumber(row.approver_assignments),
    latest_decision_stage: asString(row.latest_decision_stage),
    latest_decision: asString(row.latest_decision),
    latest_result_status: asString(row.latest_result_status),
    latest_result_outcome: asString(row.latest_result_outcome),
    latest_decision_at: asString(row.latest_decision_at),
    snapshot_id: asString(row.snapshot_id),
    snapshot_status: asString(row.snapshot_status),
    snapshot_trust_level: asString(row.snapshot_trust_level),
    snapshot_verification_badge: asString(row.snapshot_verification_badge),
    snapshot_governance_status: asString(row.snapshot_governance_status),
    snapshot_published_at: asString(row.snapshot_published_at),
    intake_created: asBoolean(row.intake_created),
    case_opened: asBoolean(row.case_opened),
    reviewer_completed: asBoolean(row.reviewer_completed),
    scholar_completed: asBoolean(row.scholar_completed),
    decision_recorded: asBoolean(row.decision_recorded),
    snapshot_exists: asBoolean(row.snapshot_exists),
    donor_facing: asBoolean(row.donor_facing),
  }));
}

export async function getGovernanceUatSummary(): Promise<GovernanceUatSummary> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_governance_workflow_uat_summary")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    total_rows: asNumber(data?.total_rows),
    intake_created: asNumber(data?.intake_created),
    cases_opened: asNumber(data?.cases_opened),
    reviewer_completed: asNumber(data?.reviewer_completed),
    scholar_completed: asNumber(data?.scholar_completed),
    decisions_recorded: asNumber(data?.decisions_recorded),
    snapshots_created: asNumber(data?.snapshots_created),
    donor_facing: asNumber(data?.donor_facing),
    waiting_reviewer: asNumber(data?.waiting_reviewer),
    waiting_scholar: asNumber(data?.waiting_scholar),
    waiting_decision: asNumber(data?.waiting_decision),
    waiting_publication: asNumber(data?.waiting_publication),
  };
}
