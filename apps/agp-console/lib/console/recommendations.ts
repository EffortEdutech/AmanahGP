import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CaseRecommendationRow = {
  id: string;
  case_id: string;
  assignment_id: string | null;
  assignment_role: string | null;
  submitted_by_user_id: string;
  submitted_by_name: string;
  recommendation: string;
  summary: string;
  detailed_notes: string | null;
  status: string;
  submitted_at: string | null;
};

export type RecommendationCaseSummary = {
  id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  review_type: string;
  status: string;
  priority: string;
};

export type RecommendationFormContext = {
  caseSummary: RecommendationCaseSummary | null;
  assignmentId: string | null;
  assignmentRole: string | null;
};

export async function getRecommendationFormContext(caseId: string, userId: string): Promise<RecommendationFormContext> {
  const supabase = await createSupabaseServerClient();

  const { data: caseRow, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, review_type, status, priority")
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) throw new Error(caseError.message);
  if (!caseRow) return { caseSummary: null, assignmentId: null, assignmentRole: null };

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, legal_name")
    .eq("id", caseRow.organization_id)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("governance_case_assignments")
    .select("id, assignment_role, status")
    .eq("case_id", caseId)
    .eq("assignee_user_id", userId)
    .in("status", ["assigned", "accepted", "completed"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  return {
    caseSummary: {
      id: String(caseRow.id),
      case_code: String(caseRow.case_code),
      organization_id: String(caseRow.organization_id),
      organization_name: String(orgRow?.legal_name ?? orgRow?.name ?? caseRow.organization_id),
      review_type: String(caseRow.review_type),
      status: String(caseRow.status),
      priority: String(caseRow.priority),
    },
    assignmentId: assignmentRow?.id ? String(assignmentRow.id) : null,
    assignmentRole: assignmentRow?.assignment_role ? String(assignmentRow.assignment_role) : null,
  };
}

export async function listCaseRecommendations(caseId: string): Promise<CaseRecommendationRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("governance_case_recommendations")
    .select("id, case_id, assignment_id, submitted_by_user_id, recommendation, summary, detailed_notes, status, submitted_at")
    .eq("case_id", caseId)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  const userIds = Array.from(new Set((rows ?? []).map((row) => String(row.submitted_by_user_id))));
  const assignmentIds = Array.from(new Set((rows ?? []).flatMap((row) => row.assignment_id ? [String(row.assignment_id)] : [])));

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  if (usersError) throw new Error(usersError.message);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("governance_case_assignments")
    .select("id, assignment_role")
    .in("id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  if (assignmentsError) throw new Error(assignmentsError.message);

  const userMap = new Map((users ?? []).map((row) => [String(row.id), row]));
  const assignmentMap = new Map((assignments ?? []).map((row) => [String(row.id), row]));

  return (rows ?? []).map((row) => {
    const user = userMap.get(String(row.submitted_by_user_id));
    const assignment = row.assignment_id ? assignmentMap.get(String(row.assignment_id)) : null;
    return {
      id: String(row.id),
      case_id: String(row.case_id),
      assignment_id: row.assignment_id ? String(row.assignment_id) : null,
      assignment_role: assignment?.assignment_role ? String(assignment.assignment_role) : null,
      submitted_by_user_id: String(row.submitted_by_user_id),
      submitted_by_name: String(user?.display_name ?? user?.email ?? row.submitted_by_user_id),
      recommendation: String(row.recommendation),
      summary: String(row.summary),
      detailed_notes: row.detailed_notes ? String(row.detailed_notes) : null,
      status: String(row.status),
      submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    };
  });
}
