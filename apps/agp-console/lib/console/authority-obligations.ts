import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityObligationRow = {
  id: string;
  authority_id: string;
  jurisdiction_id: string | null;
  organization_id: string;
  organization_name: string | null;
  organization_registration_no: string | null;
  pilot_cohort_id: string | null;
  obligation_type: string;
  obligation_ref: string;
  title: string;
  description: string | null;
  due_on: string | null;
  status: string;
  priority: string;
  source_table: string | null;
  source_id: string | null;
  regulatory_submission_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuthorityObligationSummary = {
  total: number;
  open: number;
  pending_review: number;
  overdue: number;
  satisfied: number;
  urgent_high: number;
};

type ObligationFilters = {
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

function mapObligation(row: any): AuthorityObligationRow {
  const organization = relationOne(row.organization) as { name?: string | null; registration_no?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.name ? String(organization.name) : null,
    organization_registration_no: organization?.registration_no ? String(organization.registration_no) : null,
    pilot_cohort_id: row.pilot_cohort_id ? String(row.pilot_cohort_id) : null,
    obligation_type: String(row.obligation_type),
    obligation_ref: String(row.obligation_ref),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    due_on: row.due_on ? String(row.due_on) : null,
    status: String(row.status),
    priority: String(row.priority),
    source_table: row.source_table ? String(row.source_table) : null,
    source_id: row.source_id ? String(row.source_id) : null,
    regulatory_submission_id: row.regulatory_submission_id ? String(row.regulatory_submission_id) : null,
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listAuthorityObligations(filters: ObligationFilters = {}): Promise<AuthorityObligationRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("authority_obligations")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      pilot_cohort_id,
      regulatory_submission_id,
      obligation_type,
      obligation_ref,
      title,
      description,
      due_on,
      status,
      priority,
      source_table,
      source_id,
      metadata,
      created_at,
      updated_at,
      organization:organizations!authority_obligations_organization_id_fkey (id, name, registration_no)
    `)
    .order("due_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapObligation);
}

export async function getAuthorityObligationSummary(filters: Omit<ObligationFilters, "status" | "limit"> = {}): Promise<AuthorityObligationSummary> {
  const rows = await listAuthorityObligations({ ...filters, limit: 500 });

  return {
    total: rows.length,
    open: rows.filter((row) => row.status === "open").length,
    pending_review: rows.filter((row) => row.status === "pending_review").length,
    overdue: rows.filter((row) => row.status === "overdue").length,
    satisfied: rows.filter((row) => row.status === "satisfied").length,
    urgent_high: rows.filter((row) => row.priority === "urgent" || row.priority === "high").length,
  };
}
