import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityEvidenceVisibilityScope = "organisation_private" | "authority_reviewable" | "approved_public";
export type AuthorityEvidenceReviewStatus = "linked" | "under_review" | "accepted" | "changes_requested" | "rejected" | "revoked" | "expired";

export type AuthorityEvidenceLinkRow = {
  id: string;
  authority_id: string;
  authority_name: string | null;
  jurisdiction_id: string | null;
  jurisdiction_name: string | null;
  organization_id: string;
  organization_name: string | null;
  regulatory_submission_id: string | null;
  submission_ref: string | null;
  authority_obligation_id: string | null;
  authority_exception_id: string | null;
  governance_case_id: string | null;
  source_table: string;
  source_id: string | null;
  evidence_ref: string;
  title: string;
  description: string | null;
  evidence_kind: string;
  visibility_scope: AuthorityEvidenceVisibilityScope;
  review_status: AuthorityEvidenceReviewStatus;
  linked_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuthorityEvidenceSummary = {
  total: number;
  reviewable: number;
  approved_public: number;
  private_hidden: number;
  under_review: number;
  accepted: number;
  revoked_or_expired: number;
};

type EvidenceFilters = {
  authorityId?: string;
  jurisdictionId?: string;
  organizationId?: string;
  regulatorySubmissionId?: string;
  visibilityScope?: AuthorityEvidenceVisibilityScope;
  reviewStatus?: AuthorityEvidenceReviewStatus;
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

function mapAuthorityEvidenceLink(row: any): AuthorityEvidenceLinkRow {
  const authority = relationOne(row.authority) as { name?: string | null } | null;
  const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null } | null;
  const organization = relationOne(row.organization) as { name?: string | null } | null;
  const submission = relationOne(row.regulatory_submission) as { submission_ref?: string | null } | null;

  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    authority_name: authority?.name ? String(authority.name) : null,
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
    organization_id: String(row.organization_id),
    organization_name: organization?.name ? String(organization.name) : null,
    regulatory_submission_id: row.regulatory_submission_id ? String(row.regulatory_submission_id) : null,
    submission_ref: submission?.submission_ref ? String(submission.submission_ref) : null,
    authority_obligation_id: row.authority_obligation_id ? String(row.authority_obligation_id) : null,
    authority_exception_id: row.authority_exception_id ? String(row.authority_exception_id) : null,
    governance_case_id: row.governance_case_id ? String(row.governance_case_id) : null,
    source_table: String(row.source_table),
    source_id: row.source_id ? String(row.source_id) : null,
    evidence_ref: String(row.evidence_ref),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    evidence_kind: String(row.evidence_kind),
    visibility_scope: String(row.visibility_scope) as AuthorityEvidenceVisibilityScope,
    review_status: String(row.review_status) as AuthorityEvidenceReviewStatus,
    linked_at: String(row.linked_at),
    expires_at: row.expires_at ? String(row.expires_at) : null,
    revoked_at: row.revoked_at ? String(row.revoked_at) : null,
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listAuthorityEvidenceLinks(filters: EvidenceFilters = {}): Promise<AuthorityEvidenceLinkRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("authority_evidence_links")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      organization_id,
      regulatory_submission_id,
      authority_obligation_id,
      authority_exception_id,
      governance_case_id,
      source_table,
      source_id,
      evidence_ref,
      title,
      description,
      evidence_kind,
      visibility_scope,
      review_status,
      linked_at,
      expires_at,
      revoked_at,
      metadata,
      created_at,
      updated_at,
      authority:authorities!authority_evidence_links_authority_id_fkey (id, name),
      jurisdiction:jurisdictions!authority_evidence_links_jurisdiction_id_fkey (id, name),
      organization:organizations!authority_evidence_links_organization_id_fkey (id, name),
      regulatory_submission:regulatory_submissions!authority_evidence_links_regulatory_submission_id_fkey (id, submission_ref)
    `)
    .order("linked_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.regulatorySubmissionId) query = query.eq("regulatory_submission_id", filters.regulatorySubmissionId);
  if (filters.visibilityScope) query = query.eq("visibility_scope", filters.visibilityScope);
  if (filters.reviewStatus) query = query.eq("review_status", filters.reviewStatus);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapAuthorityEvidenceLink);
}

export async function getAuthorityEvidenceSummary(filters: Omit<EvidenceFilters, "visibilityScope" | "reviewStatus" | "limit"> = {}): Promise<AuthorityEvidenceSummary> {
  const rows = await listAuthorityEvidenceLinks({ ...filters, limit: 500 });

  return {
    total: rows.length,
    reviewable: rows.filter((row) => row.visibility_scope === "authority_reviewable").length,
    approved_public: rows.filter((row) => row.visibility_scope === "approved_public").length,
    private_hidden: rows.filter((row) => row.visibility_scope === "organisation_private").length,
    under_review: rows.filter((row) => row.review_status === "under_review").length,
    accepted: rows.filter((row) => row.review_status === "accepted").length,
    revoked_or_expired: rows.filter((row) => row.review_status === "revoked" || row.review_status === "expired").length,
  };
}
