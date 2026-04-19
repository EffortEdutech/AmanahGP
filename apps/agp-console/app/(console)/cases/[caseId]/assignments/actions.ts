"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function assignCaseRoleAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.read");
  const supabase = await createSupabaseServerClient();

  const caseId = String(formData.get("case_id") ?? "");
  const assignmentRole = String(formData.get("assignment_role") ?? "") as
    | "reviewer"
    | "scholar"
    | "approver";
  const assigneeUserId = String(formData.get("assignee_user_id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!caseId || !assignmentRole || !assigneeUserId) {
    redirect(`/cases/${caseId}/assignments?error=missing_fields`);
  }

  const now = new Date().toISOString();

  const { error: deactivateError } = await supabase
    .from("governance_case_assignments")
    .update({
      status: "removed",
      completed_at: now,
      updated_at: now,
    })
    .eq("case_id", caseId)
    .eq("assignment_role", assignmentRole)
    .in("status", ["assigned", "accepted"])
    .neq("assignee_user_id", assigneeUserId);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: upsertError } = await supabase
    .from("governance_case_assignments")
    .upsert(
      {
        case_id: caseId,
        assignee_user_id: assigneeUserId,
        assignment_role: assignmentRole,
        status: "assigned",
        notes,
        assigned_by_user_id: user.id,
        assigned_at: now,
        completed_at: null,
        responded_at: null,
        updated_at: now,
      },
      {
        onConflict: "case_id,assignee_user_id,assignment_role",
      },
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/assignments`);
  revalidatePath("/review-workbench");
  redirect(`/cases/${caseId}/assignments?success=assigned`);
}

export async function removeCaseAssignmentAction(formData: FormData) {
  await requireConsoleAccess("cases.read");
  const supabase = await createSupabaseServerClient();

  const assignmentId = String(formData.get("assignment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const now = new Date().toISOString();

  if (!assignmentId || !caseId) {
    redirect(`/review-workbench?error=missing_assignment`);
  }

  const { error } = await supabase
    .from("governance_case_assignments")
    .update({
      status: "removed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/assignments`);
  revalidatePath("/review-workbench");
  redirect(`/cases/${caseId}/assignments?success=removed`);
}
