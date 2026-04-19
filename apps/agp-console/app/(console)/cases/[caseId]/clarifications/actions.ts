"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reviewClarificationSchema = z.object({
  clarification_id: z.string().uuid(),
  case_id: z.string().uuid(),
  status: z.enum(["under_review", "accepted", "needs_more_info", "rejected"]),
  review_note: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function reviewClarificationAction(formData: FormData) {
  const { user } = await requireConsoleAccess("cases.write");

  const parsed = reviewClarificationSchema.parse({
    clarification_id: formData.get("clarification_id"),
    case_id: formData.get("case_id"),
    status: formData.get("status"),
    review_note: formData.get("review_note"),
  });

  const supabase = await createSupabaseServerClient();

  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("governance_case_clarifications")
    .update({
      status: parsed.status,
      review_note: parsed.review_note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: publicUser?.id ?? null,
    })
    .eq("id", parsed.clarification_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/clarifications");
  revalidatePath(`/cases/${parsed.case_id}/clarifications`);
  revalidatePath(`/cases/${parsed.case_id}`);
}
