"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptAssignmentAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.read");
  const supabase = await createSupabaseServerClient();

  const assignmentId = String(formData.get("assignment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("governance_case_assignments")
    .update({
      status: "accepted",
      responded_at: now,
      updated_at: now,
    })
    .eq("id", assignmentId)
    .eq("assignee_user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/my-reviews");
  revalidatePath("/review-workbench");
  revalidatePath(`/cases/${caseId}`);
  redirect("/my-reviews?success=accepted");
}

export async function completeAssignmentAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.read");
  const supabase = await createSupabaseServerClient();

  const assignmentId = String(formData.get("assignment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("governance_case_assignments")
    .update({
      status: "completed",
      completed_at: now,
      responded_at: now,
      updated_at: now,
    })
    .eq("id", assignmentId)
    .eq("assignee_user_id", user.id)
    .eq("status", "accepted");

  if (error) throw new Error(error.message);

  revalidatePath("/my-reviews");
  revalidatePath("/review-workbench");
  revalidatePath(`/cases/${caseId}`);
  redirect("/my-reviews?success=completed");
}
