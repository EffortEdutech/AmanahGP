import { createSupabaseServerClient } from "@/lib/supabase/server";

type GovernanceEventIntakeBaseRow = {
  id: string;
  trust_event_id: string;
  organization_id: string;
  event_type: string;
  pillar: string | null;
  source: string;
  event_ref_table: string | null;
  event_ref_id: string | null;
  occurred_at: string;
  payload: Record<string, unknown> | null;
  routing_mode: "open_case" | "update_case";
  suggested_case_type: "onboarding_review" | "periodic_review" | "corrective_review" | "renewal_review";
  suggested_priority: "low" | "medium" | "high" | "urgent";
  suggested_assignment_role: "reviewer" | "scholar" | "approver";
  intake_status: "pending" | "ignored" | "case_opened" | "case_updated" | "error";
  linked_case_id: string | null;
  handler_note: string | null;
  handled_by_user_id: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
};

type OrganizationLookup = {
  id: string;
  name: string;
  legal_name: string;
  registration_no: string | null;
};

type CaseLookup = {
  id: string;
  case_code: string;
  status: string;
  review_type: string;
  priority: string;
};

export type GovernanceEventIntakeRow = GovernanceEventIntakeBaseRow & {
  organization: OrganizationLookup | null;
  linked_case: CaseLookup | null;
};

export type GovernanceEventIntakeSummary = {
  total: number;
  pending: number;
  case_opened: number;
  ignored: number;
  urgent_high: number;
};

export async function listGovernanceEventIntake(options?: {
  organizationId?: string;
  status?: string;
  limit?: number;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("governance_event_intake")
    .select(
      [
        "id",
        "trust_event_id",
        "organization_id",
        "event_type",
        "pillar",
        "source",
        "event_ref_table",
        "event_ref_id",
        "occurred_at",
        "payload",
        "routing_mode",
        "suggested_case_type",
        "suggested_priority",
        "suggested_assignment_role",
        "intake_status",
        "linked_case_id",
        "handler_note",
        "handled_by_user_id",
        "handled_at",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("occurred_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  if (options?.status) {
    query = query.eq("intake_status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as GovernanceEventIntakeBaseRow[];
  const organizationIds = Array.from(new Set(rows.map((row) => row.organization_id)));
  const linkedCaseIds = Array.from(
    new Set(rows.map((row) => row.linked_case_id).filter((value): value is string => Boolean(value))),
  );

  const organizationMap = new Map<string, OrganizationLookup>();
  const caseMap = new Map<string, CaseLookup>();

  if (organizationIds.length > 0) {
    const { data: organizations, error: organizationsError } = await supabase
      .from("organizations")
      .select("id, name, legal_name, registration_no")
      .in("id", organizationIds);

    if (organizationsError) {
      throw new Error(organizationsError.message);
    }

    (organizations ?? []).forEach((row) => {
      organizationMap.set(String(row.id), {
        id: String(row.id),
        name: String(row.name),
        legal_name: row.legal_name ? String(row.legal_name) : String(row.name),
        registration_no: row.registration_no ? String(row.registration_no) : null,
      });
    });
  }

  if (linkedCaseIds.length > 0) {
    const { data: cases, error: casesError } = await supabase
      .from("governance_review_cases")
      .select("id, case_code, status, review_type, priority")
      .in("id", linkedCaseIds);

    if (casesError) {
      throw new Error(casesError.message);
    }

    (cases ?? []).forEach((row) => {
      caseMap.set(String(row.id), {
        id: String(row.id),
        case_code: String(row.case_code),
        status: String(row.status),
        review_type: String(row.review_type),
        priority: String(row.priority),
      });
    });
  }

  return rows.map((row) => ({
    ...row,
    organization: organizationMap.get(row.organization_id) ?? null,
    linked_case: row.linked_case_id ? caseMap.get(row.linked_case_id) ?? null : null,
  })) satisfies GovernanceEventIntakeRow[];
}

export async function getGovernanceEventIntakeSummary(options?: { organizationId?: string }) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("governance_event_intake")
    .select("id, intake_status, suggested_priority");

  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  return rows.reduce<GovernanceEventIntakeSummary>(
    (summary, row) => {
      summary.total += 1;
      const status = String(row.intake_status ?? "");
      const priority = String(row.suggested_priority ?? "");

      if (status === "pending") summary.pending += 1;
      if (status === "case_opened") summary.case_opened += 1;
      if (status === "ignored") summary.ignored += 1;
      if (priority === "urgent" || priority === "high") summary.urgent_high += 1;

      return summary;
    },
    {
      total: 0,
      pending: 0,
      case_opened: 0,
      ignored: 0,
      urgent_high: 0,
    },
  );
}

export async function getGovernanceEventIntakeById(intakeId: string) {
  const rows = await listGovernanceEventIntake({ limit: 200 });
  return rows.find((row) => row.id === intakeId) ?? null;
}
