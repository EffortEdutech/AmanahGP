import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceCaseActionItemRow = {
  id: string;
  case_id: string;
  finding_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_role_label: string | null;
  owner_name: string | null;
  due_at: string | null;
  resolution_note: string | null;
  created_by_user_id: string | null;
  verified_by_user_id: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  finding_title: string | null;
};

export async function listGovernanceCaseActionItems(caseId: string): Promise<GovernanceCaseActionItemRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_action_items")
    .select("id, case_id, finding_id, title, description, priority, status, assigned_role_label, owner_name, due_at, resolution_note, created_by_user_id, verified_by_user_id, verified_at, created_at, updated_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const findingIds = Array.from(new Set((data ?? []).map((row) => String(row.finding_id || "")).filter(Boolean)));
  const findingById = new Map<string, string>();

  if (findingIds.length > 0) {
    const { data: findings, error: findingsError } = await supabase
      .from("governance_case_findings")
      .select("id, title")
      .in("id", findingIds);

    if (findingsError) {
      throw new Error(findingsError.message);
    }

    (findings ?? []).forEach((row) => {
      findingById.set(String(row.id), String(row.title));
    });
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    case_id: String(row.case_id),
    finding_id: row.finding_id ? String(row.finding_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    priority: String(row.priority),
    status: String(row.status),
    assigned_role_label: row.assigned_role_label ? String(row.assigned_role_label) : null,
    owner_name: row.owner_name ? String(row.owner_name) : null,
    due_at: row.due_at ? String(row.due_at) : null,
    resolution_note: row.resolution_note ? String(row.resolution_note) : null,
    created_by_user_id: row.created_by_user_id ? String(row.created_by_user_id) : null,
    verified_by_user_id: row.verified_by_user_id ? String(row.verified_by_user_id) : null,
    verified_at: row.verified_at ? String(row.verified_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    finding_title: row.finding_id ? findingById.get(String(row.finding_id)) ?? null : null,
  }));
}

export async function getGovernanceCaseActionItemSummary(caseId: string) {
  const rows = await listGovernanceCaseActionItems(caseId);

  return {
    total_action_items: rows.length,
    open_action_items: rows.filter((row) => row.status === "open").length,
    in_progress_action_items: rows.filter((row) => row.status === "in_progress").length,
    submitted_action_items: rows.filter((row) => row.status === "submitted").length,
    verified_action_items: rows.filter((row) => row.status === "verified").length,
    overdue_action_items: rows.filter((row) => row.due_at && row.status !== "verified" && new Date(row.due_at).getTime() < Date.now()).length,
  };
}
