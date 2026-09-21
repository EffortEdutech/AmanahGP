import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegulatorySubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "superseded";

export type RegulatorySubmissionRow = {
  id: string;
  authority_id: string;
  authority_name: string | null;
  jurisdiction_id: string | null;
  jurisdiction_name: string | null;
  organization_id: string;
  organization_name: string | null;
  organization_registration_no: string | null;
  pilot_cohort_id: string | null;
  pilot_cohort_name: string | null;
  policy_version_id: string | null;
  policy_version_label: string | null;
  source_table: string;
  source_id: string | null;
  submission_type: string;
  submission_ref: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  due_on: string | null;
  submitted_at: string | null;
  status: RegulatorySubmissionStatus;
  review_status: string;
  late_status: string;
  frozen_source: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RegulatorySubmissionSummary = {
  total: number;
  submitted: number;
  under_review: number;
  changes_requested: number;
  accepted: number;
  rejected: number;
  late_or_overdue: number;
};

type SubmissionFilters = {
  status?: string;
  authorityId?: string;
  jurisdictionId?: string;
  organizationId?: string;
  limit?: number;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function mapSubmission(row: any): RegulatorySubmissionRow {
  const authority = relationOne(row.authority) as { name?: string | null } | null;
  const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null } | null;
  const organization = relationOne(row.organization) as { name?: string | null; registration_no?: string | null } | null;
  const cohort = relationOne(row.pilot_cohort) as { name?: string | null } | null;
  const policyVersion = relationOne(row.policy_version) as { version_label?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    authority_name: authority?.name ? String(authority.name) : null,
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.name ? String(organization.name) : null,
    organization_registration_no: organization?.registration_no ? String(organization.registration_no) : null,
    pilot_cohort_id: row.pilot_cohort_id ? String(row.pilot_cohort_id) : null,
    pilot_cohort_name: cohort?.name ? String(cohort.name) : null,
    policy_version_id: row.policy_version_id ? String(row.policy_version_id) : null,
    policy_version_label: policyVersion?.version_label ? String(policyVersion.version_label) : null,
    source_table: String(row.source_table),
    source_id: row.source_id ? String(row.source_id) : null,
    submission_type: String(row.submission_type),
    submission_ref: String(row.submission_ref),
    title: String(row.title),
    period_start: row.period_start ? String(row.period_start) : null,
    period_end: row.period_end ? String(row.period_end) : null,
    due_on: row.due_on ? String(row.due_on) : null,
    submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    status: String(row.status) as RegulatorySubmissionStatus,
    review_status: String(row.review_status),
    late_status: String(row.late_status),
    frozen_source: asRecord(row.frozen_source),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listRegulatorySubmissions(filters: SubmissionFilters = {}): Promise<RegulatorySubmissionRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("regulatory_submissions")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      pilot_cohort_id,
      policy_version_id,
      source_table,
      source_id,
      submission_type,
      submission_ref,
      title,
      period_start,
      period_end,
      due_on,
      submitted_at,
      status,
      review_status,
      late_status,
      frozen_source,
      created_at,
      updated_at,
      authority:authorities!regulatory_submissions_authority_id_fkey (id, name),
      jurisdiction:jurisdictions!regulatory_submissions_jurisdiction_id_fkey (id, name),
      organization:organizations!regulatory_submissions_organization_id_fkey (id, name, registration_no),
      pilot_cohort:pilot_cohorts!regulatory_submissions_pilot_cohort_id_fkey (id, name),
      policy_version:policy_versions!regulatory_submissions_policy_version_id_fkey (id, version_label)
    `)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapSubmission);
}

export async function getRegulatorySubmissionSummary(filters: Omit<SubmissionFilters, "status" | "limit"> = {}): Promise<RegulatorySubmissionSummary> {
  const rows = await listRegulatorySubmissions({ ...filters, limit: 500 });

  return {
    total: rows.length,
    submitted: rows.filter((row) => row.status === "submitted").length,
    under_review: rows.filter((row) => row.status === "under_review").length,
    changes_requested: rows.filter((row) => row.status === "changes_requested").length,
    accepted: rows.filter((row) => row.status === "accepted").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
    late_or_overdue: rows.filter((row) => row.late_status === "late" || row.late_status === "overdue").length,
  };
}
