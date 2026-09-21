import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityApprovalRow = {
  id: string;
  authority_id: string | null;
  jurisdiction_id: string | null;
  organization_id: string;
  organization_name: string | null;
  source_table: string;
  source_id: string | null;
  instance_ref: string;
  title: string;
  amount: number | null;
  currency: string;
  status: string;
  current_step_key: string | null;
  block_self_approval: boolean;
  require_distinct_reviewer_approver: boolean;
  policy_version_id: string | null;
  snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuthorityApprovalSummary = {
  total: number;
  pending_review: number;
  pending_approval: number;
  approved: number;
  rejected: number;
  paid: number;
};

type ApprovalFilters = {
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

function mapApproval(row: any): AuthorityApprovalRow {
  const organization = relationOne(row.organization) as { name?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: row.authority_id ? String(row.authority_id) : null,
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.name ? String(organization.name) : null,
    source_table: String(row.source_table),
    source_id: row.source_id ? String(row.source_id) : null,
    instance_ref: String(row.instance_ref),
    title: String(row.title),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    currency: String(row.currency),
    status: String(row.status),
    current_step_key: row.current_step_key ? String(row.current_step_key) : null,
    block_self_approval: Boolean(row.block_self_approval),
    require_distinct_reviewer_approver: Boolean(row.require_distinct_reviewer_approver),
    policy_version_id: row.policy_version_id ? String(row.policy_version_id) : null,
    snapshot: asRecord(row.snapshot),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listAuthorityApprovals(filters: ApprovalFilters = {}): Promise<AuthorityApprovalRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("approval_instances")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      source_table,
      source_id,
      instance_ref,
      title,
      amount,
      currency,
      status,
      current_step_key,
      block_self_approval,
      require_distinct_reviewer_approver,
      policy_version_id,
      snapshot,
      created_at,
      updated_at,
      organization:organizations!approval_instances_organization_id_fkey (id, name)
    `)
    .order("updated_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapApproval);
}

export async function getAuthorityApprovalSummary(filters: Omit<ApprovalFilters, "status" | "limit"> = {}): Promise<AuthorityApprovalSummary> {
  const rows = await listAuthorityApprovals({ ...filters, limit: 500 });

  return {
    total: rows.length,
    pending_review: rows.filter((row) => row.status === "pending_review").length,
    pending_approval: rows.filter((row) => row.status === "pending_approval").length,
    approved: rows.filter((row) => row.status === "approved").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
    paid: rows.filter((row) => row.status === "paid").length,
  };
}
