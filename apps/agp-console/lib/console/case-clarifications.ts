import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GovernanceClarificationRow = {
  id: string;
  case_id: string;
  organization_id: string;
  target_kind: "case" | "finding" | "evidence" | "action_item";
  finding_id: string | null;
  evidence_id: string | null;
  action_item_id: string | null;
  submitted_by_user_id: string | null;
  submitted_by_role: string | null;
  title: string;
  response_text: string;
  attachments: unknown[];
  status: "submitted" | "under_review" | "accepted" | "needs_more_info" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  case_code?: string | null;
  organization_name?: string | null;
  submitted_by_name?: string | null;
  reviewed_by_name?: string | null;
};

export type GovernanceClarificationSummary = {
  total: number;
  submitted: number;
  under_review: number;
  accepted: number;
  needs_more_info: number;
  rejected: number;
};

async function attachClarificationContext(rows: GovernanceClarificationRow[]) {
  const supabase = await createSupabaseServerClient();

  const caseIds = Array.from(new Set(rows.map((row) => row.case_id)));
  const orgIds = Array.from(new Set(rows.map((row) => row.organization_id)));
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.submitted_by_user_id, row.reviewed_by_user_id])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [casesResult, orgsResult, usersResult] = await Promise.all([
    caseIds.length
      ? supabase.from("governance_review_cases").select("id, case_code").in("id", caseIds)
      : Promise.resolve({ data: [], error: null }),
    orgIds.length
      ? supabase.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from("users").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (casesResult.error) throw new Error(casesResult.error.message);
  if (orgsResult.error) throw new Error(orgsResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const caseMap = new Map((casesResult.data ?? []).map((row) => [String(row.id), row.case_code as string | null]));
  const orgMap = new Map((orgsResult.data ?? []).map((row) => [String(row.id), row.name as string | null]));
  const userMap = new Map(
    (usersResult.data ?? []).map((row) => [String(row.id), (row.full_name as string | null) ?? (row.email as string | null)]),
  );

  return rows.map((row) => ({
    ...row,
    case_code: caseMap.get(row.case_id) ?? null,
    organization_name: orgMap.get(row.organization_id) ?? null,
    submitted_by_name: row.submitted_by_user_id ? userMap.get(row.submitted_by_user_id) ?? null : null,
    reviewed_by_name: row.reviewed_by_user_id ? userMap.get(row.reviewed_by_user_id) ?? null : null,
  }));
}

export async function listClarificationQueue(limit = 100): Promise<GovernanceClarificationRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_clarifications")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return attachClarificationContext((data ?? []) as GovernanceClarificationRow[]);
}

export async function listCaseClarifications(caseId: string): Promise<GovernanceClarificationRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("governance_case_clarifications")
    .select("*")
    .eq("case_id", caseId)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);

  return attachClarificationContext((data ?? []) as GovernanceClarificationRow[]);
}

export async function getClarificationSummary(): Promise<GovernanceClarificationSummary> {
  const rows = await listClarificationQueue(300);

  return {
    total: rows.length,
    submitted: rows.filter((row) => row.status === "submitted").length,
    under_review: rows.filter((row) => row.status === "under_review").length,
    accepted: rows.filter((row) => row.status === "accepted").length,
    needs_more_info: rows.filter((row) => row.status === "needs_more_info").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
  };
}
