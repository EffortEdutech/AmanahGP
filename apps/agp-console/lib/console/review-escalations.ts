import { listReviewWorkbenchRows, type ReviewWorkbenchRow } from "@/lib/console/review-workbench";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReviewEscalationType =
  | "case_overdue"
  | "case_due_today"
  | "missing_assignment"
  | "scholar_unassigned"
  | "approver_unassigned"
  | "assignment_unaccepted";

export type ReviewEscalationSeverity = "critical" | "warning";

export type ReviewEscalationRow = {
  escalation_key: string;
  escalation_type: ReviewEscalationType;
  severity: ReviewEscalationSeverity;
  case_id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  review_type: string;
  current_stage: string;
  case_status: string;
  priority: string;
  due_at: string | null;
  assignment_role: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assigned_at: string | null;
  age_hours: number | null;
  note: string;
};

export type ReviewEscalationSummary = {
  total: number;
  critical: number;
  warning: number;
  overdue_cases: number;
  due_today_cases: number;
  missing_assignments: number;
  pending_acceptance: number;
};

type ActiveAssignmentRow = {
  id: string;
  case_id: string;
  assignment_role: string;
  status: string;
  assigned_at: string;
  assignee_user_id: string;
};

function hoursBetween(startIso: string, end: Date) {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.floor((end.getTime() - start) / (1000 * 60 * 60)));
}

function isSameUtcDate(iso: string | null, now: Date) {
  if (!iso) return false;
  const value = new Date(iso);
  return (
    value.getUTCFullYear() === now.getUTCFullYear() &&
    value.getUTCMonth() === now.getUTCMonth() &&
    value.getUTCDate() === now.getUTCDate()
  );
}

function severityRank(value: ReviewEscalationSeverity) {
  return value === "critical" ? 0 : 1;
}

function typeLabel(type: ReviewEscalationType) {
  switch (type) {
    case "case_overdue":
      return "Case overdue";
    case "case_due_today":
      return "Case due today";
    case "missing_assignment":
      return "No active assignment";
    case "scholar_unassigned":
      return "Scholar missing";
    case "approver_unassigned":
      return "Approver missing";
    case "assignment_unaccepted":
      return "Assignment not accepted";
    default:
      return type;
  }
}

function buildCaseEscalations(rows: ReviewWorkbenchRow[], now: Date): ReviewEscalationRow[] {
  const escalations: ReviewEscalationRow[] = [];

  for (const row of rows) {
    if (row.is_overdue) {
      escalations.push({
        escalation_key: `${row.case_id}:case_overdue`,
        escalation_type: "case_overdue",
        severity: "critical",
        case_id: row.case_id,
        case_code: row.case_code,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        review_type: row.review_type,
        current_stage: row.current_stage,
        case_status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assignment_role: null,
        assignee_user_id: null,
        assignee_name: null,
        assignee_email: null,
        assigned_at: null,
        age_hours: row.due_at ? hoursBetween(row.due_at, now) : null,
        note: `The case due date has passed and requires immediate intervention at the ${row.current_stage} stage.`,
      });
    } else if (isSameUtcDate(row.due_at, now)) {
      escalations.push({
        escalation_key: `${row.case_id}:case_due_today`,
        escalation_type: "case_due_today",
        severity: "warning",
        case_id: row.case_id,
        case_code: row.case_code,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        review_type: row.review_type,
        current_stage: row.current_stage,
        case_status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assignment_role: null,
        assignee_user_id: null,
        assignee_name: null,
        assignee_email: null,
        assigned_at: null,
        age_hours: row.due_at ? hoursBetween(row.due_at, now) : null,
        note: `The case is due today and should be actively monitored before it becomes overdue.`,
      });
    }

    if (row.active_assignment_count === 0) {
      escalations.push({
        escalation_key: `${row.case_id}:missing_assignment`,
        escalation_type: "missing_assignment",
        severity: row.is_overdue ? "critical" : "warning",
        case_id: row.case_id,
        case_code: row.case_code,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        review_type: row.review_type,
        current_stage: row.current_stage,
        case_status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assignment_role: null,
        assignee_user_id: null,
        assignee_name: null,
        assignee_email: null,
        assigned_at: null,
        age_hours: null,
        note: `No active reviewer, scholar, or approver assignment exists for this active case.`,
      });
    }

    if (row.current_stage === "scholar" && row.scholar_assignment_count === 0) {
      escalations.push({
        escalation_key: `${row.case_id}:scholar_unassigned`,
        escalation_type: "scholar_unassigned",
        severity: "critical",
        case_id: row.case_id,
        case_code: row.case_code,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        review_type: row.review_type,
        current_stage: row.current_stage,
        case_status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assignment_role: "scholar",
        assignee_user_id: null,
        assignee_name: null,
        assignee_email: null,
        assigned_at: null,
        age_hours: null,
        note: `The case is waiting at scholar stage but no scholar assignment exists.`,
      });
    }

    if (row.current_stage === "approver" && row.approver_assignment_count === 0) {
      escalations.push({
        escalation_key: `${row.case_id}:approver_unassigned`,
        escalation_type: "approver_unassigned",
        severity: "critical",
        case_id: row.case_id,
        case_code: row.case_code,
        organization_id: row.organization_id,
        organization_name: row.organization_name,
        review_type: row.review_type,
        current_stage: row.current_stage,
        case_status: row.status,
        priority: row.priority,
        due_at: row.due_at,
        assignment_role: "approver",
        assignee_user_id: null,
        assignee_name: null,
        assignee_email: null,
        assigned_at: null,
        age_hours: null,
        note: `The case is waiting at approver stage but no approver assignment exists.`,
      });
    }
  }

  return escalations;
}

export async function listReviewEscalationRows(): Promise<ReviewEscalationRow[]> {
  const now = new Date();
  const workRows = await listReviewWorkbenchRows();
  const supabase = await createSupabaseServerClient();

  const { data: assignments, error: assignmentsError } = await supabase
    .from("governance_case_assignments")
    .select("id, case_id, assignment_role, status, assigned_at, assignee_user_id")
    .eq("status", "assigned")
    .order("assigned_at", { ascending: true });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const activeAssignments = (assignments ?? []).map((row) => ({
    id: String(row.id),
    case_id: String(row.case_id),
    assignment_role: String(row.assignment_role),
    status: String(row.status),
    assigned_at: String(row.assigned_at),
    assignee_user_id: String(row.assignee_user_id),
  })) as ActiveAssignmentRow[];

  const userIds = Array.from(new Set(activeAssignments.map((row) => row.assignee_user_id)));
  const { data: users, error: usersError } = userIds.length
    ? await supabase
        .from("users")
        .select("id, email, display_name")
        .in("id", userIds)
    : { data: [], error: null };

  if (usersError) {
    throw new Error(usersError.message);
  }

  const userMap = new Map(
    (users ?? []).map((row) => [String(row.id), { email: String(row.email), display_name: row.display_name ? String(row.display_name) : null }]),
  );
  const workMap = new Map(workRows.map((row) => [row.case_id, row]));

  const escalations = buildCaseEscalations(workRows, now);

  for (const assignment of activeAssignments) {
    const workRow = workMap.get(assignment.case_id);
    if (!workRow) continue;

    const ageHours = hoursBetween(assignment.assigned_at, now);
    if (ageHours < 24) continue;

    const assignee = userMap.get(assignment.assignee_user_id);
    escalations.push({
      escalation_key: `${assignment.id}:assignment_unaccepted`,
      escalation_type: "assignment_unaccepted",
      severity: ageHours >= 72 ? "critical" : "warning",
      case_id: workRow.case_id,
      case_code: workRow.case_code,
      organization_id: workRow.organization_id,
      organization_name: workRow.organization_name,
      review_type: workRow.review_type,
      current_stage: workRow.current_stage,
      case_status: workRow.status,
      priority: workRow.priority,
      due_at: workRow.due_at,
      assignment_role: assignment.assignment_role,
      assignee_user_id: assignment.assignee_user_id,
      assignee_name: assignee?.display_name ?? null,
      assignee_email: assignee?.email ?? null,
      assigned_at: assignment.assigned_at,
      age_hours: ageHours,
      note: `${typeLabel("assignment_unaccepted")}: ${assignment.assignment_role} assignment is still not accepted after ${ageHours} hours.`,
    });
  }

  return escalations.sort((a, b) => {
    const severityCompare = severityRank(a.severity) - severityRank(b.severity);
    if (severityCompare !== 0) return severityCompare;

    const dueA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;

    return a.case_code.localeCompare(b.case_code);
  });
}

export async function getReviewEscalationSummary(): Promise<ReviewEscalationSummary> {
  const rows = await listReviewEscalationRows();

  return {
    total: rows.length,
    critical: rows.filter((row) => row.severity === "critical").length,
    warning: rows.filter((row) => row.severity === "warning").length,
    overdue_cases: rows.filter((row) => row.escalation_type === "case_overdue").length,
    due_today_cases: rows.filter((row) => row.escalation_type === "case_due_today").length,
    missing_assignments: rows.filter((row) => ["missing_assignment", "scholar_unassigned", "approver_unassigned"].includes(row.escalation_type)).length,
    pending_acceptance: rows.filter((row) => row.escalation_type === "assignment_unaccepted").length,
  };
}
