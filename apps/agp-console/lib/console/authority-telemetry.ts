import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PilotKpiSnapshotRow = {
  id: string;
  authority_id: string;
  authority_name: string | null;
  jurisdiction_id: string | null;
  jurisdiction_name: string | null;
  pilot_cohort_id: string;
  pilot_cohort_name: string | null;
  snapshot_ref: string;
  period_start: string;
  period_end: string;
  status: string;
  organizations_total: number;
  organizations_active: number;
  submissions_total: number;
  submissions_accepted: number;
  submissions_late_or_overdue: number;
  obligations_total: number;
  obligations_overdue: number;
  exceptions_total: number;
  exceptions_high_critical: number;
  evidence_links_total: number;
  state_report_packs_total: number;
  feedback_total: number;
  feedback_average_rating: number | null;
  support_incidents_total: number;
  support_incidents_open: number;
  support_incidents_resolved: number;
  metric_events_total: number;
  generated_at: string;
};

export type PilotFeedbackRow = {
  id: string;
  pilot_cohort_id: string;
  organization_name: string | null;
  respondent_role: string;
  feedback_type: string;
  rating: number | null;
  sentiment: string;
  title: string;
  status: string;
  submitted_at: string;
};

export type PilotSupportIncidentRow = {
  id: string;
  pilot_cohort_id: string;
  organization_name: string | null;
  incident_ref: string;
  incident_type: string;
  severity: string;
  status: string;
  title: string;
  opened_at: string;
  resolved_at: string | null;
};

export type PilotKpiSummary = {
  snapshots: number;
  organizations_active: number;
  submissions_total: number;
  submissions_late_or_overdue: number;
  exceptions_high_critical: number;
  support_open: number;
  feedback_average_rating: number | null;
};

type PilotFilters = {
  authorityId?: string;
  jurisdictionId?: string;
  pilotCohortId?: string;
  limit?: number;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapSnapshot(row: any): PilotKpiSnapshotRow {
  const authority = relationOne(row.authority) as { name?: string | null } | null;
  const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null } | null;
  const cohort = relationOne(row.pilot_cohort) as { name?: string | null } | null;
  return {
    id: String(row.id),
    authority_id: String(row.authority_id),
    authority_name: authority?.name ? String(authority.name) : null,
    jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
    jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
    pilot_cohort_id: String(row.pilot_cohort_id),
    pilot_cohort_name: cohort?.name ? String(cohort.name) : null,
    snapshot_ref: String(row.snapshot_ref),
    period_start: String(row.period_start),
    period_end: String(row.period_end),
    status: String(row.status),
    organizations_total: Number(row.organizations_total ?? 0),
    organizations_active: Number(row.organizations_active ?? 0),
    submissions_total: Number(row.submissions_total ?? 0),
    submissions_accepted: Number(row.submissions_accepted ?? 0),
    submissions_late_or_overdue: Number(row.submissions_late_or_overdue ?? 0),
    obligations_total: Number(row.obligations_total ?? 0),
    obligations_overdue: Number(row.obligations_overdue ?? 0),
    exceptions_total: Number(row.exceptions_total ?? 0),
    exceptions_high_critical: Number(row.exceptions_high_critical ?? 0),
    evidence_links_total: Number(row.evidence_links_total ?? 0),
    state_report_packs_total: Number(row.state_report_packs_total ?? 0),
    feedback_total: Number(row.feedback_total ?? 0),
    feedback_average_rating: row.feedback_average_rating === null || row.feedback_average_rating === undefined ? null : Number(row.feedback_average_rating),
    support_incidents_total: Number(row.support_incidents_total ?? 0),
    support_incidents_open: Number(row.support_incidents_open ?? 0),
    support_incidents_resolved: Number(row.support_incidents_resolved ?? 0),
    metric_events_total: Number(row.metric_events_total ?? 0),
    generated_at: String(row.generated_at),
  };
}

export async function listPilotKpiSnapshots(filters: PilotFilters = {}): Promise<PilotKpiSnapshotRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("pilot_kpi_snapshots")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      pilot_cohort_id,
      snapshot_ref,
      period_start,
      period_end,
      status,
      organizations_total,
      organizations_active,
      submissions_total,
      submissions_accepted,
      submissions_late_or_overdue,
      obligations_total,
      obligations_overdue,
      exceptions_total,
      exceptions_high_critical,
      evidence_links_total,
      state_report_packs_total,
      feedback_total,
      feedback_average_rating,
      support_incidents_total,
      support_incidents_open,
      support_incidents_resolved,
      metric_events_total,
      generated_at,
      authority:authorities!pilot_kpi_snapshots_authority_id_fkey (id, name),
      jurisdiction:jurisdictions!pilot_kpi_snapshots_jurisdiction_id_fkey (id, name),
      pilot_cohort:pilot_cohorts!pilot_kpi_snapshots_pilot_cohort_id_fkey (id, name)
    `)
    .order("period_end", { ascending: false })
    .order("generated_at", { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.pilotCohortId) query = query.eq("pilot_cohort_id", filters.pilotCohortId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSnapshot);
}

export async function listPilotFeedback(filters: PilotFilters = {}): Promise<PilotFeedbackRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("pilot_feedback")
    .select(`
      id,
      pilot_cohort_id,
      respondent_role,
      feedback_type,
      rating,
      sentiment,
      title,
      status,
      submitted_at,
      organization:organizations!pilot_feedback_organization_id_fkey (id, name, legal_name)
    `)
    .order("submitted_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.pilotCohortId) query = query.eq("pilot_cohort_id", filters.pilotCohortId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const organization = relationOne(row.organization) as { name?: string | null; legal_name?: string | null } | null;
    return {
      id: String(row.id),
      pilot_cohort_id: String(row.pilot_cohort_id),
      organization_name: organization?.legal_name || organization?.name ? String(organization.legal_name ?? organization.name) : null,
      respondent_role: String(row.respondent_role),
      feedback_type: String(row.feedback_type),
      rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
      sentiment: String(row.sentiment),
      title: String(row.title),
      status: String(row.status),
      submitted_at: String(row.submitted_at),
    };
  });
}

export async function listPilotSupportIncidents(filters: PilotFilters = {}): Promise<PilotSupportIncidentRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("pilot_support_incidents")
    .select(`
      id,
      pilot_cohort_id,
      incident_ref,
      incident_type,
      severity,
      status,
      title,
      opened_at,
      resolved_at,
      organization:organizations!pilot_support_incidents_organization_id_fkey (id, name, legal_name)
    `)
    .order("opened_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.authorityId) query = query.eq("authority_id", filters.authorityId);
  if (filters.jurisdictionId) query = query.eq("jurisdiction_id", filters.jurisdictionId);
  if (filters.pilotCohortId) query = query.eq("pilot_cohort_id", filters.pilotCohortId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const organization = relationOne(row.organization) as { name?: string | null; legal_name?: string | null } | null;
    return {
      id: String(row.id),
      pilot_cohort_id: String(row.pilot_cohort_id),
      organization_name: organization?.legal_name || organization?.name ? String(organization.legal_name ?? organization.name) : null,
      incident_ref: String(row.incident_ref),
      incident_type: String(row.incident_type),
      severity: String(row.severity),
      status: String(row.status),
      title: String(row.title),
      opened_at: String(row.opened_at),
      resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    };
  });
}

export async function getPilotKpiSummary(filters: Omit<PilotFilters, "limit"> = {}): Promise<PilotKpiSummary> {
  const snapshots = await listPilotKpiSnapshots({ ...filters, limit: 100 });
  const latest = snapshots[0] ?? null;
  if (!latest) {
    return { snapshots: 0, organizations_active: 0, submissions_total: 0, submissions_late_or_overdue: 0, exceptions_high_critical: 0, support_open: 0, feedback_average_rating: null };
  }
  return {
    snapshots: snapshots.length,
    organizations_active: latest.organizations_active,
    submissions_total: latest.submissions_total,
    submissions_late_or_overdue: latest.submissions_late_or_overdue,
    exceptions_high_critical: latest.exceptions_high_critical,
    support_open: latest.support_incidents_open,
    feedback_average_rating: latest.feedback_average_rating,
  };
}
