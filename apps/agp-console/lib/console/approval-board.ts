import { listReviewWorkbenchRows, type ReviewWorkbenchRow } from "@/lib/console/review-workbench";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ApprovalBoardBucket =
  | "awaiting_scholar_assignment"
  | "awaiting_scholar_recommendation"
  | "scholar_recommendation_ready"
  | "awaiting_approver_assignment"
  | "awaiting_approver_decision"
  | "decision_recorded";

export type ApprovalBoardRow = {
  case_id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  review_type: string;
  case_status: string;
  current_stage: string;
  priority: string;
  due_at: string | null;
  is_overdue: boolean;
  readiness_bucket: ApprovalBoardBucket;
  scholar_assignees: string[];
  approver_assignees: string[];
  latest_reviewer_recommendation: string | null;
  latest_scholar_recommendation: string | null;
  latest_scholar_recommendation_at: string | null;
  latest_approver_decision: string | null;
  latest_approver_decision_at: string | null;
};

export type ApprovalBoardSummary = {
  total: number;
  scholar_stage: number;
  approver_stage: number;
  overdue: number;
  awaiting_scholar_assignment: number;
  awaiting_scholar_recommendation: number;
  ready_for_approver: number;
  awaiting_approver_assignment: number;
  awaiting_approver_decision: number;
};

type AssignmentLite = {
  id: string;
  case_id: string;
  assignment_role: string;
  assignee_user_id: string | null;
  status: string;
  assigned_at: string | null;
};

type RecommendationLite = {
  case_id: string;
  assignment_role: string | null;
  recommendation: string;
  status: string;
  submitted_at: string | null;
};

type DecisionLite = {
  case_id: string;
  decision_stage: string;
  decision: string;
  decided_at: string | null;
};

function latestBy<T extends { submitted_at?: string | null; decided_at?: string | null }>(rows: T[]): T | null {
  const sorted = [...rows].sort((a, b) => {
    const aTime = new Date(a.submitted_at ?? a.decided_at ?? 0).getTime();
    const bTime = new Date(b.submitted_at ?? b.decided_at ?? 0).getTime();
    return bTime - aTime;
  });

  return sorted[0] ?? null;
}

function dedupe(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value))));
}

function isPipelineCase(row: ReviewWorkbenchRow) {
  return ["scholar", "approver"].includes(row.current_stage) || ["scholar_review", "approval_pending"].includes(row.status);
}

function bucketRank(bucket: ApprovalBoardBucket) {
  switch (bucket) {
    case "awaiting_approver_decision":
      return 0;
    case "awaiting_approver_assignment":
      return 1;
    case "scholar_recommendation_ready":
      return 2;
    case "awaiting_scholar_recommendation":
      return 3;
    case "awaiting_scholar_assignment":
      return 4;
    case "decision_recorded":
      return 5;
    default:
      return 9;
  }
}

async function loadAssignments(caseIds: string[]) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_assignments")
    .select("id, case_id, assignment_role, assignee_user_id, status, assigned_at")
    .in("case_id", caseIds.length ? caseIds : ["00000000-0000-0000-0000-000000000000"])
    .in("status", ["assigned", "accepted", "completed"]);

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    case_id: String(row.case_id),
    assignment_role: String(row.assignment_role),
    assignee_user_id: row.assignee_user_id ? String(row.assignee_user_id) : null,
    status: String(row.status),
    assigned_at: row.assigned_at ? String(row.assigned_at) : null,
  })) as AssignmentLite[];

  const authUserIds = dedupe(rows.map((row) => row.assignee_user_id));
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("auth_provider_user_id, display_name, email")
    .in("auth_provider_user_id", authUserIds.length ? authUserIds : ["00000000-0000-0000-0000-000000000000"]);

  if (usersError) throw new Error(usersError.message);

  const userMap = new Map(
    (users ?? []).map((row) => [
      String(row.auth_provider_user_id),
      String(row.display_name ?? row.email ?? row.auth_provider_user_id),
    ]),
  );

  return {
    rows,
    userMap,
  };
}

async function loadRecommendations(caseIds: string[]) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_recommendations")
    .select("case_id, assignment_id, recommendation, status, submitted_at")
    .in("case_id", caseIds.length ? caseIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  const assignmentIds = dedupe((data ?? []).map((row) => row.assignment_id ? String(row.assignment_id) : null));

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("governance_case_assignments")
    .select("id, assignment_role")
    .in("id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  if (assignmentError) throw new Error(assignmentError.message);

  const assignmentRoleMap = new Map(
    (assignmentRows ?? []).map((row) => [String(row.id), String(row.assignment_role)]),
  );

  return (data ?? []).map((row) => ({
    case_id: String(row.case_id),
    assignment_role: row.assignment_id ? assignmentRoleMap.get(String(row.assignment_id)) ?? null : null,
    recommendation: String(row.recommendation),
    status: String(row.status),
    submitted_at: row.submitted_at ? String(row.submitted_at) : null,
  })) as RecommendationLite[];
}

async function loadDecisions(caseIds: string[]) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_decisions")
    .select("case_id, decision_stage, decision, decided_at")
    .in("case_id", caseIds.length ? caseIds : ["00000000-0000-0000-0000-000000000000"])
    .order("decided_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    case_id: String(row.case_id),
    decision_stage: String(row.decision_stage),
    decision: String(row.decision),
    decided_at: row.decided_at ? String(row.decided_at) : null,
  })) as DecisionLite[];
}

function buildBucket(input: {
  currentStage: string;
  scholarAssignments: AssignmentLite[];
  approverAssignments: AssignmentLite[];
  latestScholarRecommendation: RecommendationLite | null;
  latestApproverDecision: DecisionLite | null;
}): ApprovalBoardBucket {
  if (input.currentStage === "approver") {
    if (input.approverAssignments.length === 0) return "awaiting_approver_assignment";
    if (!input.latestApproverDecision) return "awaiting_approver_decision";
    return "decision_recorded";
  }

  if (input.scholarAssignments.length === 0) return "awaiting_scholar_assignment";
  if (!input.latestScholarRecommendation) return "awaiting_scholar_recommendation";
  return "scholar_recommendation_ready";
}

export async function listApprovalBoardRows(): Promise<ApprovalBoardRow[]> {
  const workbenchRows = (await listReviewWorkbenchRows()).filter(isPipelineCase);
  const caseIds = workbenchRows.map((row) => row.case_id);

  const [{ rows: assignments, userMap }, recommendations, decisions] = await Promise.all([
    loadAssignments(caseIds),
    loadRecommendations(caseIds),
    loadDecisions(caseIds),
  ]);

  const rows = workbenchRows.map((row) => {
    const caseAssignments = assignments.filter((assignment) => assignment.case_id === row.case_id);
    const scholarAssignments = caseAssignments.filter((assignment) => assignment.assignment_role === "scholar");
    const approverAssignments = caseAssignments.filter((assignment) => assignment.assignment_role === "approver");

    const latestReviewerRecommendation = latestBy(
      recommendations.filter(
        (recommendation) => recommendation.case_id === row.case_id && recommendation.assignment_role === "reviewer",
      ),
    );

    const latestScholarRecommendation = latestBy(
      recommendations.filter(
        (recommendation) => recommendation.case_id === row.case_id && recommendation.assignment_role === "scholar",
      ),
    );

    const latestApproverDecision = latestBy(
      decisions.filter((decision) => decision.case_id === row.case_id && decision.decision_stage === "approver"),
    );

    const readinessBucket = buildBucket({
      currentStage: row.current_stage,
      scholarAssignments,
      approverAssignments,
      latestScholarRecommendation,
      latestApproverDecision,
    });

    return {
      case_id: row.case_id,
      case_code: row.case_code,
      organization_id: row.organization_id,
      organization_name: row.organization_name,
      review_type: row.review_type,
      case_status: row.status,
      current_stage: row.current_stage,
      priority: row.priority,
      due_at: row.due_at,
      is_overdue: row.is_overdue,
      readiness_bucket: readinessBucket,
      scholar_assignees: dedupe(scholarAssignments.map((assignment) => userMap.get(String(assignment.assignee_user_id ?? "")) ?? null)),
      approver_assignees: dedupe(approverAssignments.map((assignment) => userMap.get(String(assignment.assignee_user_id ?? "")) ?? null)),
      latest_reviewer_recommendation: latestReviewerRecommendation?.recommendation ?? null,
      latest_scholar_recommendation: latestScholarRecommendation?.recommendation ?? null,
      latest_scholar_recommendation_at: latestScholarRecommendation?.submitted_at ?? null,
      latest_approver_decision: latestApproverDecision?.decision ?? null,
      latest_approver_decision_at: latestApproverDecision?.decided_at ?? null,
    } satisfies ApprovalBoardRow;
  });

  return rows.sort((a, b) => {
    if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;
    if (a.current_stage !== b.current_stage) return a.current_stage === "approver" ? -1 : 1;
    const bucketCompare = bucketRank(a.readiness_bucket) - bucketRank(b.readiness_bucket);
    if (bucketCompare !== 0) return bucketCompare;
    const aTime = new Date(a.due_at ?? a.latest_scholar_recommendation_at ?? 0).getTime();
    const bTime = new Date(b.due_at ?? b.latest_scholar_recommendation_at ?? 0).getTime();
    return aTime - bTime;
  });
}

export async function getApprovalBoardSummary(): Promise<ApprovalBoardSummary> {
  const rows = await listApprovalBoardRows();

  return {
    total: rows.length,
    scholar_stage: rows.filter((row) => row.current_stage === "scholar").length,
    approver_stage: rows.filter((row) => row.current_stage === "approver").length,
    overdue: rows.filter((row) => row.is_overdue).length,
    awaiting_scholar_assignment: rows.filter((row) => row.readiness_bucket === "awaiting_scholar_assignment").length,
    awaiting_scholar_recommendation: rows.filter((row) => row.readiness_bucket === "awaiting_scholar_recommendation").length,
    ready_for_approver: rows.filter((row) => row.readiness_bucket === "scholar_recommendation_ready").length,
    awaiting_approver_assignment: rows.filter((row) => row.readiness_bucket === "awaiting_approver_assignment").length,
    awaiting_approver_decision: rows.filter((row) => row.readiness_bucket === "awaiting_approver_decision").length,
  };
}
