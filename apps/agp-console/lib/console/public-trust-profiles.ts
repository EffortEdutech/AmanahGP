import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicTrustProfileRow = {
  organization_id: string;
  organization_name: string;
  workspace_name: string | null;
  legal_name: string | null;
  registration_no: string | null;
  org_type: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country: string | null;
  state: string | null;
  organization_summary: string | null;
  listing_status: string;
  workspace_status: string;
  snapshot_id: string;
  source_case_id: string | null;
  trust_level: string;
  verification_badge: string;
  governance_status: string;
  public_summary: string;
  public_highlights: string[];
  published_at: string | null;
  enabled_app_keys: string[];
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return [];
}

function mapRow(row: Record<string, unknown>): PublicTrustProfileRow {
  return {
    organization_id: String(row.organization_id),
    organization_name: String(row.organization_name),
    workspace_name: row.workspace_name ? String(row.workspace_name) : null,
    legal_name: row.legal_name ? String(row.legal_name) : null,
    registration_no: row.registration_no ? String(row.registration_no) : null,
    org_type: row.org_type ? String(row.org_type) : null,
    website_url: row.website_url ? String(row.website_url) : null,
    contact_email: row.contact_email ? String(row.contact_email) : null,
    contact_phone: row.contact_phone ? String(row.contact_phone) : null,
    country: row.country ? String(row.country) : null,
    state: row.state ? String(row.state) : null,
    organization_summary: row.organization_summary ? String(row.organization_summary) : null,
    listing_status: String(row.listing_status),
    workspace_status: String(row.workspace_status),
    snapshot_id: String(row.snapshot_id),
    source_case_id: row.source_case_id ? String(row.source_case_id) : null,
    trust_level: String(row.trust_level),
    verification_badge: String(row.verification_badge),
    governance_status: String(row.governance_status),
    public_summary: String(row.public_summary),
    public_highlights: asStringArray(row.public_highlights),
    published_at: row.published_at ? String(row.published_at) : null,
    enabled_app_keys: asStringArray(row.enabled_app_keys),
  };
}

export async function listPublicTrustProfiles(): Promise<PublicTrustProfileRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_public_organization_trust_profiles")
    .select("*")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getPublicTrustProfile(organizationId: string): Promise<PublicTrustProfileRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_public_organization_trust_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getPublicTrustProfileSummary() {
  const rows = await listPublicTrustProfiles();

  return {
    total_profiles: rows.length,
    exemplary: rows.filter((row) => row.trust_level === "exemplary").length,
    assured: rows.filter((row) => row.trust_level === "assured").length,
    developing: rows.filter((row) => row.trust_level === "developing").length,
    watchlist: rows.filter((row) => row.trust_level === "watchlist").length,
    approved_badges: rows.filter((row) => row.verification_badge === "approved").length,
  };
}
