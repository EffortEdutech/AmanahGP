"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedRecommendations = new Set([
  "approve",
  "approve_with_conditions",
  "remediate",
  "reject",
  "escalate",
  "info_required",
]);

export async function submitCaseRecommendationAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.read");
  const supabase = await createSupabaseServerClient();

  const caseId = String(formData.get("case_id") ?? "");
  const assignmentIdRaw = String(formData.get("assignment_id") ?? "").trim();
  const assignmentId = assignmentIdRaw || null;
  const recommendation = String(formData.get("recommendation") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const detailedNotes = String(formData.get("detailed_notes") ?? "").trim();

  if (!caseId) throw new Error("Case id is required.");
  if (!allowedRecommendations.has(recommendation)) throw new Error("Invalid recommendation value.");
  if (summary.length < 10) throw new Error("Summary must be at least 10 characters.");

  if (assignmentId) {
    const { error: supersedeError } = await supabase
      .from("governance_case_recommendations")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("case_id", caseId)
      .eq("assignment_id", assignmentId)
      .eq("submitted_by_user_id", user.id)
      .eq("status", "submitted");

    if (supersedeError) throw new Error(supersedeError.message);
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from("governance_case_recommendations").insert({
    case_id: caseId,
    assignment_id: assignmentId,
    submitted_by_user_id: user.id,
    recommendation,
    summary,
    detailed_notes: detailedNotes || null,
    status: "submitted",
    submitted_at: now,
    updated_at: now,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/cases/${caseId}/recommendations`);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/my-reviews");
  redirect(`/cases/${caseId}/recommendations?success=submitted`);
}
