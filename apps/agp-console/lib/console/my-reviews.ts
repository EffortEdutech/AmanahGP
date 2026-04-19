import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MyReviewInboxRow = {
  assignment_id: string;
  case_id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  registration_no: string | null;
  assignment_role: "reviewer" | "scholar" | "approver";
  assignment_status: "assigned" | "accepted" | "completed" | "removed";
  case_status: string;
  review_type: string;
  priority: string;
  due_at: string | null;
  summary: string | null;
  notes: string | null;
  assigned_at: string;
};

export async function listMyReviewInbox(userId: string): Promise<MyReviewInboxRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: assignments, error: assignmentsError } = await supabase
    .from("governance_case_assignments")
    .select("id, case_id, assignment_role, status, notes, assigned_at")
    .eq("assignee_user_id", userId)
    .in("status", ["assigned", "accepted"])
    .order("assigned_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const caseIds = Array.from(new Set((assignments ?? []).map((row) => String(row.case_id))));
  if (caseIds.length === 0) return [];

  const { data: cases, error: casesError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, review_type, status, priority, due_at, summary")
    .in("id", caseIds);

  if (casesError) {
    throw new Error(casesError.message);
  }

  const orgIds = Array.from(new Set((cases ?? []).map((row) => String(row.organization_id))));
  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name, legal_name, registration_no")
    .in("id", orgIds);

  if (organizationsError) {
    throw new Error(organizationsError.message);
  }

  const caseMap = new Map((cases ?? []).map((row) => [String(row.id), row]));
  const orgMap = new Map((organizations ?? []).map((row) => [String(row.id), row]));

  return (assignments ?? []).flatMap((assignment) => {
    const caseRow = caseMap.get(String(assignment.case_id));
    if (!caseRow) return [];
    const org = orgMap.get(String(caseRow.organization_id));

    return [{
      assignment_id: String(assignment.id),
      case_id: String(caseRow.id),
      case_code: String(caseRow.case_code),
      organization_id: String(caseRow.organization_id),
      organization_name: String(org?.legal_name ?? org?.name ?? caseRow.organization_id),
      registration_no: org?.registration_no ? String(org.registration_no) : null,
      assignment_role: String(assignment.assignment_role) as MyReviewInboxRow["assignment_role"],
      assignment_status: String(assignment.status) as MyReviewInboxRow["assignment_status"],
      case_status: String(caseRow.status),
      review_type: String(caseRow.review_type),
      priority: String(caseRow.priority),
      due_at: caseRow.due_at ? String(caseRow.due_at) : null,
      summary: caseRow.summary ? String(caseRow.summary) : null,
      notes: assignment.notes ? String(assignment.notes) : null,
      assigned_at: String(assignment.assigned_at),
    }];
  });
}
