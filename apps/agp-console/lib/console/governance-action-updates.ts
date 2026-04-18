import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceCaseActionUpdateRow = {
  id: string;
  case_id: string;
  action_item_id: string;
  source: string;
  update_type: string;
  message: string;
  proposed_status: string | null;
  attachment_url: string | null;
  submitted_by_user_id: string | null;
  submitted_at: string;
  review_status: string;
  review_note: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  action_item_title: string | null;
};

export async function listGovernanceCaseActionUpdates(caseId: string): Promise<GovernanceCaseActionUpdateRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_action_updates")
    .select("id, case_id, action_item_id, source, update_type, message, proposed_status, attachment_url, submitted_by_user_id, submitted_at, review_status, review_note, reviewed_by_user_id, reviewed_at, created_at, updated_at")
    .eq("case_id", caseId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const actionItemIds = Array.from(new Set((data ?? []).map((row) => String(row.action_item_id)).filter(Boolean)));
  const titleByActionItemId = new Map<string, string>();

  if (actionItemIds.length > 0) {
    const { data: actionItems, error: actionItemsError } = await supabase
      .from("governance_case_action_items")
      .select("id, title")
      .in("id", actionItemIds);

    if (actionItemsError) {
      throw new Error(actionItemsError.message);
    }

    (actionItems ?? []).forEach((row) => {
      titleByActionItemId.set(String(row.id), String(row.title));
    });
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    case_id: String(row.case_id),
    action_item_id: String(row.action_item_id),
    source: String(row.source),
    update_type: String(row.update_type),
    message: String(row.message),
    proposed_status: row.proposed_status ? String(row.proposed_status) : null,
    attachment_url: row.attachment_url ? String(row.attachment_url) : null,
    submitted_by_user_id: row.submitted_by_user_id ? String(row.submitted_by_user_id) : null,
    submitted_at: String(row.submitted_at),
    review_status: String(row.review_status),
    review_note: row.review_note ? String(row.review_note) : null,
    reviewed_by_user_id: row.reviewed_by_user_id ? String(row.reviewed_by_user_id) : null,
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    action_item_title: titleByActionItemId.get(String(row.action_item_id)) ?? null,
  }));
}

export async function getGovernanceCaseActionUpdateSummary(caseId: string) {
  const rows = await listGovernanceCaseActionUpdates(caseId);

  return {
    total_updates: rows.length,
    pending_updates: rows.filter((row) => row.review_status === "pending").length,
    accepted_updates: rows.filter((row) => row.review_status === "accepted").length,
    rejected_updates: rows.filter((row) => row.review_status === "rejected").length,
    needs_more_info_updates: rows.filter((row) => row.review_status === "needs_more_info").length,
  };
}
