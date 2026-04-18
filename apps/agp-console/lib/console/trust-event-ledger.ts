import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TrustEventLedgerRow = {
  id: string;
  organization_id: string;
  organization_name: string | null;
  registration_no: string | null;
  event_type: string;
  event_ref_table: string | null;
  event_ref_id: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
  actor_user_id: string | null;
  source: string;
  pillar: string | null;
  score_delta: number | null;
  created_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function listTrustEventLedger(limit = 100): Promise<TrustEventLedgerRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("trust_events")
    .select("id, organization_id, event_type, event_ref_table, event_ref_id, payload, occurred_at, actor_user_id, source, pillar, score_delta, created_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);

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
    organization_name: organizationById.get(String(row.organization_id))?.name ?? null,
    registration_no: organizationById.get(String(row.organization_id))?.registration_no ?? null,
    event_type: String(row.event_type),
    event_ref_table: row.event_ref_table ? String(row.event_ref_table) : null,
    event_ref_id: row.event_ref_id ? String(row.event_ref_id) : null,
    payload: asRecord(row.payload),
    occurred_at: String(row.occurred_at),
    actor_user_id: row.actor_user_id ? String(row.actor_user_id) : null,
    source: String(row.source),
    pillar: row.pillar ? String(row.pillar) : null,
    score_delta: row.score_delta == null ? null : Number(row.score_delta),
    created_at: String(row.created_at),
  }));
}

export async function getTrustEventLedgerSummary() {
  const rows = await listTrustEventLedger(250);

  return {
    total_events: rows.length,
    governance_events: rows.filter((row) => row.pillar === "governance").length,
    compliance_events: rows.filter((row) => row.pillar === "compliance").length,
    transparency_events: rows.filter((row) => row.pillar === "transparency").length,
    trust_snapshot_published: rows.filter((row) => row.event_type === "trust_snapshot_published").length,
    governance_case_terminal: rows.filter((row) => row.event_type.startsWith("gov_case_")).length,
  };
}
