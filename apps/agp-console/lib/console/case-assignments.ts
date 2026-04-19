import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceCaseAssignmentRow = {
  id: string;
  case_id: string;
  assignee_user_id: string;
  assignment_role: "reviewer" | "scholar" | "approver";
  status: "assigned" | "accepted" | "completed" | "removed";
  notes: string | null;
  assigned_by_user_id: string | null;
  assigned_at: string;
  responded_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignableUser = {
  id: string;
  email: string;
  display_name: string | null;
  platform_role: string;
};

export type GovernanceCaseSummary = {
  id: string;
  case_code: string;
  organization_id: string;
  organization_name: string;
  review_type: string;
  status: string;
  priority: string;
  due_at: string | null;
  summary: string | null;
};

function mapAssignment(row: Record<string, unknown>): GovernanceCaseAssignmentRow {
  return {
    id: String(row.id),
    case_id: String(row.case_id),
    assignee_user_id: String(row.assignee_user_id),
    assignment_role: String(row.assignment_role) as GovernanceCaseAssignmentRow["assignment_role"],
    status: String(row.status) as GovernanceCaseAssignmentRow["status"],
    notes: row.notes ? String(row.notes) : null,
    assigned_by_user_id: row.assigned_by_user_id ? String(row.assigned_by_user_id) : null,
    assigned_at: String(row.assigned_at),
    responded_at: row.responded_at ? String(row.responded_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getGovernanceCaseSummary(caseId: string): Promise<GovernanceCaseSummary | null> {
  const supabase = await createSupabaseServerClient();

  const { data: caseRow, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, review_type, status, priority, due_at, summary")
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) {
    throw new Error(caseError.message);
  }

  if (!caseRow) {
    return null;
  }

  const { data: organizationRow, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, legal_name")
    .eq("id", caseRow.organization_id)
    .maybeSingle();

  if (organizationError) {
    throw new Error(organizationError.message);
  }

  return {
    id: String(caseRow.id),
    case_code: String(caseRow.case_code),
    organization_id: String(caseRow.organization_id),
    organization_name: String(organizationRow?.legal_name ?? organizationRow?.name ?? caseRow.organization_id),
    review_type: String(caseRow.review_type),
    status: String(caseRow.status),
    priority: String(caseRow.priority),
    due_at: caseRow.due_at ? String(caseRow.due_at) : null,
    summary: caseRow.summary ? String(caseRow.summary) : null,
  };
}

export async function listCaseAssignments(caseId: string): Promise<GovernanceCaseAssignmentRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_assignments")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapAssignment(row as Record<string, unknown>));
}

export async function listAssignableUsers(role: "reviewer" | "scholar" | "approver"): Promise<AssignableUser[]> {
  const supabase = await createSupabaseServerClient();

  const roles =
    role === "reviewer"
      ? ["reviewer", "super_admin"]
      : role === "scholar"
        ? ["scholar", "super_admin"]
        : ["super_admin"];

  const { data, error } = await supabase
    .from("users")
    .select("id, email, display_name, platform_role")
    .eq("is_active", true)
    .in("platform_role", roles)
    .order("display_name", { ascending: true })
    .order("email", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    display_name: row.display_name ? String(row.display_name) : null,
    platform_role: String(row.platform_role),
  }));
}
