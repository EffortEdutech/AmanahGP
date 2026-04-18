import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReviewWorkbenchRow = {
  case_id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  registration_no: string | null;
  review_type: string;
  status: string;
  priority: string;
  intake_source: string;
  summary: string | null;
  due_at: string | null;
  opened_at: string;
  submitted_at: string | null;
  review_started_at: string | null;
  scholar_started_at: string | null;
  approval_started_at: string | null;
  closed_at: string | null;
  outcome: string | null;
  current_stage: string;
  active_assignment_count: number;
  reviewer_assignment_count: number;
  scholar_assignment_count: number;
  approver_assignment_count: number;
  active_assignee_user_ids: string[];
  is_overdue: boolean;
  sla_bucket: string;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [];
}

function mapRow(row: Record<string, unknown>): ReviewWorkbenchRow {
  return {
    case_id: String(row.case_id),
    case_code: String(row.case_code),
    organization_id: String(row.organization_id),
    organization_name: String(row.organization_name),
    registration_no: row.registration_no ? String(row.registration_no) : null,
    review_type: String(row.review_type),
    status: String(row.status),
    priority: String(row.priority),
    intake_source: String(row.intake_source),
    summary: row.summary ? String(row.summary) : null,
    due_at: row.due_at ? String(row.due_at) : null,
    opened_at: String(row.opened_at),
    submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    review_started_at: row.review_started_at ? String(row.review_started_at) : null,
    scholar_started_at: row.scholar_started_at ? String(row.scholar_started_at) : null,
    approval_started_at: row.approval_started_at ? String(row.approval_started_at) : null,
    closed_at: row.closed_at ? String(row.closed_at) : null,
    outcome: row.outcome ? String(row.outcome) : null,
    current_stage: String(row.current_stage),
    active_assignment_count: Number(row.active_assignment_count ?? 0),
    reviewer_assignment_count: Number(row.reviewer_assignment_count ?? 0),
    scholar_assignment_count: Number(row.scholar_assignment_count ?? 0),
    approver_assignment_count: Number(row.approver_assignment_count ?? 0),
    active_assignee_user_ids: asStringArray(row.active_assignee_user_ids),
    is_overdue: Boolean(row.is_overdue),
    sla_bucket: String(row.sla_bucket),
  };
}

function isActiveStatus(status: string) {
  return !["approved", "rejected", "expired"].includes(status);
}

export async function listReviewWorkbenchRows(): Promise<ReviewWorkbenchRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_governance_case_work_queue")
    .select("*")
    .order("is_overdue", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((row) => isActiveStatus(row.status));
}

export async function listMyReviewWorkbenchRows(authUserId: string): Promise<ReviewWorkbenchRow[]> {
  const rows = await listReviewWorkbenchRows();
  return rows.filter((row) => row.active_assignee_user_ids.includes(authUserId));
}

export async function getReviewWorkbenchSummary(authUserId: string) {
  const rows = await listReviewWorkbenchRows();
  const mine = rows.filter((row) => row.active_assignee_user_ids.includes(authUserId));

  return {
    total_active: rows.length,
    total_mine: mine.length,
    overdue_mine: mine.filter((row) => row.is_overdue).length,
    reviewer_stage: rows.filter((row) => row.current_stage === "reviewer").length,
    scholar_stage: rows.filter((row) => row.current_stage === "scholar").length,
    approver_stage: rows.filter((row) => row.current_stage === "approver").length,
  };
}
