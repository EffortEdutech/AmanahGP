import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReviewAlertRow = {
  alert_key: string;
  alert_type: string;
  severity: "critical" | "warning" | "info";
  severity_rank: number;
  organization_id: string;
  organization_name: string;
  case_id: string | null;
  case_code: string | null;
  review_type: string | null;
  case_status: string | null;
  case_priority: string | null;
  action_item_id: string | null;
  action_item_title: string | null;
  action_item_status: string | null;
  assignment_role: string | null;
  due_at: string | null;
  days_overdue: number | null;
  sort_at: string | null;
  alert_title: string;
  alert_message: string;
  target_href: string;
  target_label: string;
  source_table: string;
};

export type ReviewAlertSummary = {
  total: number;
  critical: number;
  warning: number;
  overdue_cases: number;
  blocked_assignments: number;
  remediation: number;
  publication: number;
};

export async function listReviewAlerts(limit = 100): Promise<ReviewAlertRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_governance_review_alerts")
    .select("*")
    .order("severity_rank", { ascending: false })
    .order("sort_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReviewAlertRow[];
}

export async function getReviewAlertSummary(): Promise<ReviewAlertSummary> {
  const rows = await listReviewAlerts(500);

  return {
    total: rows.length,
    critical: rows.filter((row) => row.severity === "critical").length,
    warning: rows.filter((row) => row.severity === "warning").length,
    overdue_cases: rows.filter((row) => row.alert_type === "case_overdue").length,
    blocked_assignments: rows.filter((row) =>
      ["reviewer_unassigned", "scholar_unassigned", "approver_unassigned"].includes(row.alert_type),
    ).length,
    remediation: rows.filter((row) => row.alert_type.startsWith("remediation_")).length,
    publication: rows.filter((row) => row.alert_type === "publication_pending").length,
  };
}
