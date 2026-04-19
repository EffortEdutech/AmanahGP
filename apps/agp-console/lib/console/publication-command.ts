import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicationCommandSnapshot = {
  id: string;
  source_case_id: string | null;
  snapshot_status: string;
  trust_level: string;
  verification_badge: string;
  governance_status: string;
  public_summary: string;
  published_at: string | null;
  created_at: string;
  is_current: boolean;
};

export type PublicationCommandRow = {
  organization_id: string;
  organization_name: string;
  registration_no: string | null;
  org_type: string | null;
  workspace_status: string | null;
  listing_status: string | null;
  open_case_count: number;
  has_amanah_hub: boolean;
  blocker_reasons: string[];
  publication_ready: boolean;
  latest_draft_snapshot: PublicationCommandSnapshot | null;
  current_published_snapshot: PublicationCommandSnapshot | null;
  last_published_snapshot: PublicationCommandSnapshot | null;
  can_publish_latest_draft: boolean;
};

type OrganizationRow = {
  id: string;
  organization_name: string;
  registration_no: string | null;
  org_type: string | null;
  workspace_status: string | null;
  listing_status: string | null;
  created_at: string;
};

type SnapshotRow = {
  id: string;
  organization_id: string;
  source_case_id: string | null;
  snapshot_status: string;
  trust_level: string;
  verification_badge: string;
  governance_status: string;
  public_summary: string;
  published_at: string | null;
  created_at: string;
  is_current: boolean;
};

type ReadinessRow = {
  organization_id: string;
  open_case_count: number;
  has_amanah_hub: boolean;
  blocker_reasons: string[] | null;
  is_publication_ready: boolean;
};

function normalizeSnapshot(row: SnapshotRow): PublicationCommandSnapshot {
  return {
    id: String(row.id),
    source_case_id: row.source_case_id ? String(row.source_case_id) : null,
    snapshot_status: String(row.snapshot_status),
    trust_level: String(row.trust_level),
    verification_badge: String(row.verification_badge),
    governance_status: String(row.governance_status),
    public_summary: String(row.public_summary),
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at),
    is_current: Boolean(row.is_current),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function computeDraftGateBlockers(args: {
  organization: OrganizationRow;
  readiness: ReadinessRow | undefined;
  draft: PublicationCommandSnapshot | null;
}) {
  const blockers: string[] = [];
  const { organization, readiness, draft } = args;

  if (!draft) {
    blockers.push("No draft trust snapshot ready for publication");
    return blockers;
  }

  if (organization.workspace_status !== "active") {
    blockers.push("Workspace is not active");
  }
  if (organization.listing_status !== "listed") {
    blockers.push("Organisation is not listed for public discovery");
  }
  if (!readiness?.has_amanah_hub) {
    blockers.push("AmanahHub is not enabled for this organisation");
  }
  if ((readiness?.open_case_count ?? 0) > 0) {
    blockers.push("There are open governance review cases");
  }
  if (!["reviewed", "scholar_reviewed", "approved"].includes(draft.verification_badge)) {
    blockers.push("Draft verification badge is not donor-safe");
  }
  if (["rejected", "suspended"].includes(draft.governance_status)) {
    blockers.push("Draft governance status blocks public publication");
  }

  return blockers;
}

export async function listPublicationCommandRows(): Promise<PublicationCommandRow[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: organizations, error: organizationsError }, { data: readinessRows, error: readinessError }, { data: snapshots, error: snapshotsError }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, legal_name, name, registration_no, org_type, workspace_status, listing_status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("v_organization_publication_readiness")
      .select("organization_id, open_case_count, has_amanah_hub, blocker_reasons, is_publication_ready"),
    supabase
      .from("organization_trust_snapshots")
      .select("id, organization_id, source_case_id, snapshot_status, trust_level, verification_badge, governance_status, public_summary, published_at, created_at, is_current")
      .order("created_at", { ascending: false }),
  ]);

  if (organizationsError) throw new Error(organizationsError.message);
  if (readinessError) throw new Error(readinessError.message);
  if (snapshotsError) throw new Error(snapshotsError.message);

  const readinessByOrg = new Map<string, ReadinessRow>();
  (readinessRows ?? []).forEach((row: any) => {
    readinessByOrg.set(String(row.organization_id), {
      organization_id: String(row.organization_id),
      open_case_count: Number(row.open_case_count ?? 0),
      has_amanah_hub: Boolean(row.has_amanah_hub),
      blocker_reasons: asStringArray(row.blocker_reasons),
      is_publication_ready: Boolean(row.is_publication_ready),
    });
  });

  const snapshotsByOrg = new Map<string, PublicationCommandSnapshot[]>();
  (snapshots ?? []).forEach((row: any) => {
    const orgId = String(row.organization_id);
    const next = snapshotsByOrg.get(orgId) ?? [];
    next.push(normalizeSnapshot(row as SnapshotRow));
    snapshotsByOrg.set(orgId, next);
  });

  return (organizations ?? []).map((row: any) => {
    const organization: OrganizationRow = {
      id: String(row.id),
      organization_name: row.legal_name ? String(row.legal_name) : row.name ? String(row.name) : String(row.id),
      registration_no: row.registration_no ? String(row.registration_no) : null,
      org_type: row.org_type ? String(row.org_type) : null,
      workspace_status: row.workspace_status ? String(row.workspace_status) : null,
      listing_status: row.listing_status ? String(row.listing_status) : null,
      created_at: String(row.created_at),
    };

    const readiness = readinessByOrg.get(organization.id);
    const orgSnapshots = snapshotsByOrg.get(organization.id) ?? [];
    const latestDraftSnapshot = orgSnapshots.find((snapshot) => snapshot.snapshot_status === "draft") ?? null;
    const currentPublishedSnapshot = orgSnapshots.find((snapshot) => snapshot.snapshot_status === "published" && snapshot.is_current) ?? null;
    const lastPublishedSnapshot = orgSnapshots.find((snapshot) => snapshot.snapshot_status === "published") ?? null;
    const draftBlockers = computeDraftGateBlockers({ organization, readiness, draft: latestDraftSnapshot });

    return {
      organization_id: organization.id,
      organization_name: organization.organization_name,
      registration_no: organization.registration_no,
      org_type: organization.org_type,
      workspace_status: organization.workspace_status,
      listing_status: organization.listing_status,
      open_case_count: readiness?.open_case_count ?? 0,
      has_amanah_hub: readiness?.has_amanah_hub ?? false,
      blocker_reasons: latestDraftSnapshot ? draftBlockers : (readiness?.blocker_reasons ?? draftBlockers),
      publication_ready: readiness?.is_publication_ready ?? false,
      latest_draft_snapshot: latestDraftSnapshot,
      current_published_snapshot: currentPublishedSnapshot,
      last_published_snapshot: lastPublishedSnapshot,
      can_publish_latest_draft: latestDraftSnapshot ? draftBlockers.length === 0 : false,
    } satisfies PublicationCommandRow;
  });
}

export async function getPublicationCommandSummary() {
  const rows = await listPublicationCommandRows();

  return {
    total_organizations: rows.length,
    currently_live: rows.filter((row) => Boolean(row.current_published_snapshot)).length,
    ready_to_publish: rows.filter((row) => row.can_publish_latest_draft).length,
    blocked_drafts: rows.filter((row) => row.latest_draft_snapshot && !row.can_publish_latest_draft).length,
    without_draft: rows.filter((row) => !row.latest_draft_snapshot).length,
    without_amanah_hub: rows.filter((row) => !row.has_amanah_hub).length,
  };
}
