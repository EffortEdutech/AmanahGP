import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicationReadinessRow = {
  organization_id: string;
  organization_name: string;
  registration_no: string | null;
  org_type: string | null;
  workspace_status: string;
  listing_status: string;
  snapshot_id: string | null;
  snapshot_status: string | null;
  trust_level: string | null;
  verification_badge: string | null;
  governance_status: string | null;
  published_at: string | null;
  open_case_count: number;
  has_amanah_hub: boolean;
  has_amanah_os: boolean;
  blocker_reasons: string[];
  is_publication_ready: boolean;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [];
}

function mapRow(row: Record<string, unknown>): PublicationReadinessRow {
  return {
    organization_id: String(row.organization_id),
    organization_name: String(row.organization_name),
    registration_no: row.registration_no ? String(row.registration_no) : null,
    org_type: row.org_type ? String(row.org_type) : null,
    workspace_status: String(row.workspace_status),
    listing_status: String(row.listing_status),
    snapshot_id: row.snapshot_id ? String(row.snapshot_id) : null,
    snapshot_status: row.snapshot_status ? String(row.snapshot_status) : null,
    trust_level: row.trust_level ? String(row.trust_level) : null,
    verification_badge: row.verification_badge ? String(row.verification_badge) : null,
    governance_status: row.governance_status ? String(row.governance_status) : null,
    published_at: row.published_at ? String(row.published_at) : null,
    open_case_count: Number(row.open_case_count ?? 0),
    has_amanah_hub: Boolean(row.has_amanah_hub),
    has_amanah_os: Boolean(row.has_amanah_os),
    blocker_reasons: asStringArray(row.blocker_reasons),
    is_publication_ready: Boolean(row.is_publication_ready),
  };
}

export async function listPublicationReadiness(): Promise<PublicationReadinessRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_organization_publication_readiness")
    .select("*")
    .order("organization_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getPublicationReadinessSummary() {
  const rows = await listPublicationReadiness();

  return {
    total_organizations: rows.length,
    ready: rows.filter((row) => row.is_publication_ready).length,
    blocked: rows.filter((row) => !row.is_publication_ready).length,
    no_snapshot: rows.filter((row) => !row.snapshot_id).length,
    with_open_cases: rows.filter((row) => row.open_case_count > 0).length,
    without_amanah_hub: rows.filter((row) => !row.has_amanah_hub).length,
  };
}
