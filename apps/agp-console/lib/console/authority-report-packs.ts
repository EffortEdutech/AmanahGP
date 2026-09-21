import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityStateReportPackRow = {
  id: string;
  authority_id: string;
  authority_name: string | null;
  jurisdiction_id: string | null;
  jurisdiction_name: string | null;
  organization_id: string;
  organization_name: string | null;
  report_ref: string;
  report_type: string;
  period_year: number;
  period_month: number | null;
  status: string;
  currency: string;
  total_receipts: number;
  total_expenditure: number;
  net_movement: number;
  bank_accounts_total: number;
  bank_accounts_reconciled: number;
  bank_accounts_discrepancy: number;
  bank_difference_total: number;
  fund_balance_total: number;
  exception_total: number;
  exception_high_critical: number;
  evidence_link_total: number;
  evidence_reviewable_total: number;
  source_summary: Record<string, unknown>;
  generated_at: string;
  published_at: string | null;
};

export type AuthorityStateReportLineRow = {
  id: string;
  state_report_pack_id: string;
  line_category: string;
  line_label: string;
  line_key: string;
  amount: number | null;
  count_value: number | null;
  status: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
};

export type AuthorityStateReportSummary = {
  total_packs: number;
  total_receipts: number;
  total_expenditure: number;
  net_movement: number;
  discrepancy_packs: number;
  exception_high_critical: number;
  evidence_links: number;
};

type ReportFilters = {
  authorityId?: string;
  jurisdictionId?: string;
  organizationId?: string;
  periodYear?: number;
  periodMonth?: number;
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

function mapPack(row: any): AuthorityStateReportPackRow {
  const authority = relationOne(row.authority) as { name?: string | null } | null;
  const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null } | null;
  const organization = relationOne(row.organization) as { name?: string | null; legal_name?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    authority_name: authority?.name ? String(authority.name) : null,
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.legal_name || organization?.name ? String(organization.legal_name ?? organization.name) : null,
    report_ref: String(row.report_ref),
    report_type: String(row.report_type),
    period_year: Number(row.period_year),
    period_month: row.period_month === null || row.period_month === undefined ? null : Number(row.period_month),
    status: String(row.status),
    currency: String(row.currency),
    total_receipts: Number(row.total_receipts ?? 0),
    total_expenditure: Number(row.total_expenditure ?? 0),
    net_movement: Number(row.net_movement ?? 0),
    bank_accounts_total: Number(row.bank_accounts_total ?? 0),
    bank_accounts_reconciled: Number(row.bank_accounts_reconciled ?? 0),
    bank_accounts_discrepancy: Number(row.bank_accounts_discrepancy ?? 0),
    bank_difference_total: Number(row.bank_difference_total ?? 0),
    fund_balance_total: Number(row.fund_balance_total ?? 0),
    exception_total: Number(row.exception_total ?? 0),
    exception_high_critical: Number(row.exception_high_critical ?? 0),
    evidence_link_total: Number(row.evidence_link_total ?? 0),
    evidence_reviewable_total: Number(row.evidence_reviewable_total ?? 0),
    source_summary: asRecord(row.source_summary),
    generated_at: String(row.generated_at),
    published_at: row.published_at ? String(row.published_at) : null,
  };
}

export async function listAuthorityStateReportPacks(filters: ReportFilters = {}): Promise<AuthorityStateReportPackRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("authority_state_report_packs")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      report_ref,
      report_type,
      period_year,
      period_month,
      status,
      currency,
      total_receipts,
      total_expenditure,
      net_movement,
      bank_accounts_total,
      bank_accounts_reconciled,
      bank_accounts_discrepancy,
      bank_difference_total,
      fund_balance_total,
      exception_total,
      exception_high_critical,
      evidence_link_total,
      evidence_reviewable_total,
      source_summary,
      generated_at,
      published_at,
      authority:authorities!authority_state_report_packs_authority_id_fkey (id, name),
      jurisdiction:jurisdictions!authority_state_report_packs_jurisdiction_id_fkey (id, name),
      organization:organizations!authority_state_report_packs_organization_id_fkey (id, name, legal_name)
    `)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false, nullsFirst: false })
    .order("generated_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.periodYear) query = query.eq("period_year", filters.periodYear);
  if (filters.periodMonth) query = query.eq("period_month", filters.periodMonth);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapPack);
}

export async function listAuthorityStateReportLines(packId: string): Promise<AuthorityStateReportLineRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("authority_state_report_lines")
    .select("id, state_report_pack_id, line_category, line_label, line_key, amount, count_value, status, metadata, sort_order")
    .eq("state_report_pack_id", packId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    state_report_pack_id: String(row.state_report_pack_id),
    line_category: String(row.line_category),
    line_label: String(row.line_label),
    line_key: String(row.line_key),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    count_value: row.count_value === null || row.count_value === undefined ? null : Number(row.count_value),
    status: row.status ? String(row.status) : null,
    metadata: asRecord(row.metadata),
    sort_order: Number(row.sort_order ?? 100),
  }));
}

export async function getAuthorityStateReportSummary(filters: Omit<ReportFilters, "limit"> = {}): Promise<AuthorityStateReportSummary> {
  const rows = await listAuthorityStateReportPacks({ ...filters, limit: 500 });
  return {
    total_packs: rows.length,
    total_receipts: rows.reduce((sum, row) => sum + row.total_receipts, 0),
    total_expenditure: rows.reduce((sum, row) => sum + row.total_expenditure, 0),
    net_movement: rows.reduce((sum, row) => sum + row.net_movement, 0),
    discrepancy_packs: rows.filter((row) => row.bank_accounts_discrepancy > 0 || row.bank_difference_total !== 0).length,
    exception_high_critical: rows.reduce((sum, row) => sum + row.exception_high_critical, 0),
    evidence_links: rows.reduce((sum, row) => sum + row.evidence_link_total, 0),
  };
}
