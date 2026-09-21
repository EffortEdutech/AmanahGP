import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityExceptionRow = {
  id: string;
  authority_id: string;
  jurisdiction_id: string | null;
  organization_id: string;
  organization_name: string | null;
  organization_registration_no: string | null;
  pilot_cohort_id: string | null;
  obligation_id: string | null;
  regulatory_submission_id: string | null;
  governance_case_id: string | null;
  trust_event_id: string | null;
  exception_type: string;
  exception_ref: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  source_table: string | null;
  source_id: string | null;
  detected_at: string;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuthorityExceptionSummary = {
  total: number;
  open: number;
  action_required: number;
  in_review: number;
  resolved: number;
  high_critical: number;
};

type ExceptionFilters = {
  status?: string;
  authorityId?: string;
  jurisdictionId?: string;
  organizationId?: string;
  severity?: string;
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

function mapException(row: any): AuthorityExceptionRow {
  const organization = relationOne(row.organization) as { name?: string | null; registration_no?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.name ? String(organization.name) : null,
    organization_registration_no: organization?.registration_no ? String(organization.registration_no) : null,
    pilot_cohort_id: row.pilot_cohort_id ? String(row.pilot_cohort_id) : null,
    obligation_id: row.obligation_id ? String(row.obligation_id) : null,
    regulatory_submission_id: row.regulatory_submission_id ? String(row.regulatory_submission_id) : null,
    governance_case_id: row.governance_case_id ? String(row.governance_case_id) : null,
    trust_event_id: row.trust_event_id ? String(row.trust_event_id) : null,
    exception_type: String(row.exception_type),
    exception_ref: String(row.exception_ref),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    severity: String(row.severity),
    status: String(row.status),
    source_table: row.source_table ? String(row.source_table) : null,
    source_id: row.source_id ? String(row.source_id) : null,
    detected_at: String(row.detected_at),
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listAuthorityExceptions(filters: ExceptionFilters = {}): Promise<AuthorityExceptionRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("authority_exceptions")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      pilot_cohort_id,
      obligation_id,
      regulatory_submission_id,
      governance_case_id,
      trust_event_id,
      exception_type,
      exception_ref,
      title,
      description,
      severity,
      status,
      source_table,
      source_id,
      detected_at,
      resolved_at,
      metadata,
      created_at,
      updated_at,
      organization:organizations!authority_exceptions_organization_id_fkey (id, name, registration_no)
    `)
    .order("detected_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.severity) query = query.eq("severity", filters.severity);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapException);
}

export async function getAuthorityExceptionSummary(filters: Omit<ExceptionFilters, "status" | "severity" | "limit"> = {}): Promise<AuthorityExceptionSummary> {
  const rows = await listAuthorityExceptions({ ...filters, limit: 500 });

  return {
    total: rows.length,
    open: rows.filter((row) => row.status === "open").length,
    action_required: rows.filter((row) => row.status === "action_required").length,
    in_review: rows.filter((row) => row.status === "in_review" || row.status === "triaged").length,
    resolved: rows.filter((row) => row.status === "resolved").length,
    high_critical: rows.filter((row) => row.severity === "high" || row.severity === "critical").length,
  };
}
