"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/console/server";

export async function addComplianceNoteAction(formData: FormData) {
  const { user } = await requireConsoleAccess("organizations.write");
  const orgId = String(formData.get("org_id") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const returnTo = String(formData.get("return_to") || `/organisations/${orgId}`);

  if (!orgId) {
    redirect(`${returnTo}?error=${encodeURIComponent("Missing organisation id")}`);
  }

  if (!note) {
    redirect(`${returnTo}?error=${encodeURIComponent("Review note is required")}`);
  }

  const supabase = await createSupabaseServerClient();
  await writeAuditLog(supabase, user.id, {
    action: "compliance.note_added",
    entityTable: "organizations",
    entityId: orgId,
    organizationId: orgId,
    metadata: {
      note,
      category: "review_note",
    },
  });

  revalidatePath("/reviews");
  revalidatePath(`/organisations/${orgId}`);
  revalidatePath("/audit");
  redirect(`${returnTo}?noted=1`);
}
