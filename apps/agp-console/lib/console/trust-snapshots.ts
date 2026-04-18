import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrganizationTrustSnapshotRow = {
  id: string;
  organization_id: string;
  source_case_id: string | null;
  snapshot_status: string;
  trust_level: string;
  verification_badge: string;
  governance_status: string;
  public_summary: string;
  public_highlights: string[];
  internal_note: string | null;
  effective_at: string;
  published_at: string | null;
  published_by_user_id: string | null;
  created_by_user_id: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  organization_name: string | null;
  registration_no: string | null;
};

function parseHighlights(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  return [];
}

export async function listOrganizationTrustSnapshots(organizationId?: string): Promise<OrganizationTrustSnapshotRow[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("organization_trust_snapshots")
    .select("id, organization_id, source_case_id, snapshot_status, trust_level, verification_badge, governance_status, public_summary, public_highlights, internal_note, effective_at, published_at, published_by_user_id, created_by_user_id, is_current, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const organizationIds = Array.from(new Set((data ?? []).map((row) => String(row.organization_id)).filter(Boolean)));
  const organizationById = new Map<string, { name: string | null; registration_no: string | null }>();

  if (organizationIds.length > 0) {
    const { data: organizations, error: organizationsError } = await supabase
      .from("organizations")
      .select("id, legal_name, name, registration_no")
      .in("id", organizationIds);

    if (organizationsError) {
      throw new Error(organizationsError.message);
    }

    (organizations ?? []).forEach((row) => {
      organizationById.set(String(row.id), {
        name: row.legal_name ? String(row.legal_name) : row.name ? String(row.name) : null,
        registration_no: row.registration_no ? String(row.registration_no) : null,
      });
    });
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    organization_id: String(row.organization_id),
    source_case_id: row.source_case_id ? String(row.source_case_id) : null,
    snapshot_status: String(row.snapshot_status),
    trust_level: String(row.trust_level),
    verification_badge: String(row.verification_badge),
    governance_status: String(row.governance_status),
    public_summary: String(row.public_summary),
    public_highlights: parseHighlights(row.public_highlights),
    internal_note: row.internal_note ? String(row.internal_note) : null,
    effective_at: String(row.effective_at),
    published_at: row.published_at ? String(row.published_at) : null,
    published_by_user_id: row.published_by_user_id ? String(row.published_by_user_id) : null,
    created_by_user_id: row.created_by_user_id ? String(row.created_by_user_id) : null,
    is_current: Boolean(row.is_current),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    organization_name: organizationById.get(String(row.organization_id))?.name ?? null,
    registration_no: organizationById.get(String(row.organization_id))?.registration_no ?? null,
  }));
}

export async function getOrganizationTrustSnapshotSummary() {
  const rows = await listOrganizationTrustSnapshots();

  return {
    total_snapshots: rows.length,
    current_published: rows.filter((row) => row.is_current && row.snapshot_status === "published").length,
    drafts: rows.filter((row) => row.snapshot_status === "draft").length,
    assured_or_better: rows.filter((row) => row.is_current && ["assured", "exemplary"].includes(row.trust_level)).length,
    watchlist: rows.filter((row) => row.is_current && row.trust_level === "watchlist").length,
  };
}
