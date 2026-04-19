import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DossierAssignment = {
  id: string;
  assignee_name: string;
  assignment_role: string;
  status: string;
  notes: string | null;
  assigned_at: string;
  completed_at: string | null;
};

export type DossierFinding = {
  id: string;
  finding_type: string;
  severity: string;
  status: string;
  title: string;
  details: string | null;
  recommendation: string | null;
  recorded_by_name: string;
  created_at: string;
};

export type DossierEvidence = {
  id: string;
  finding_id: string | null;
  evidence_type: string;
  title: string;
  evidence_url: string | null;
  notes: string | null;
  recorded_by_name: string;
  created_at: string;
};

export type DossierRecommendation = {
  id: string;
  assignment_role: string | null;
  submitted_by_name: string;
  recommendation: string;
  summary: string;
  detailed_notes: string | null;
  status: string;
  submitted_at: string | null;
};

export type DossierDecision = {
  id: string;
  decision_stage: string;
  decision: string;
  result_status: string;
  result_outcome: string | null;
  decision_note: string | null;
  conditions_text: string | null;
  decided_by_name: string;
  decided_at: string;
};

export type DossierActionItem = {
  id: string;
  finding_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_role_label: string | null;
  owner_name: string | null;
  due_at: string | null;
  resolution_note: string | null;
  verified_at: string | null;
};

export type DossierActionUpdate = {
  id: string;
  action_item_id: string;
  source: string;
  update_type: string;
  message: string;
  proposed_status: string | null;
  attachment_url: string | null;
  submitted_by_name: string;
  submitted_at: string;
  review_status: string;
  review_note: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
};

export type DossierSnapshot = {
  id: string;
  snapshot_status: string;
  trust_level: string;
  verification_badge: string;
  governance_status: string;
  public_summary: string;
  published_at: string | null;
  is_current: boolean;
  created_at: string;
};

export type DossierTrustEvent = {
  id: string;
  event_type: string;
  pillar: string | null;
  source: string;
  occurred_at: string;
  score_delta: string | null;
};

export type CaseDossier = {
  caseSummary: {
    id: string;
    case_code: string;
    organization_id: string;
    organization_name: string;
    registration_no: string | null;
    review_type: string;
    status: string;
    priority: string;
    intake_source: string;
    summary: string | null;
    due_at: string | null;
    opened_at: string;
    submitted_at: string | null;
    review_started_at: string | null;
    scholar_started_at: string | null;
    approval_started_at: string | null;
    closed_at: string | null;
    outcome: string | null;
  };
  assignments: DossierAssignment[];
  findings: DossierFinding[];
  evidence: DossierEvidence[];
  recommendations: DossierRecommendation[];
  decisions: DossierDecision[];
  actionItems: DossierActionItem[];
  actionUpdates: DossierActionUpdate[];
  snapshots: DossierSnapshot[];
  trustEvents: DossierTrustEvent[];
};

function userLabel(row: { display_name?: string | null; email?: string | null } | undefined, fallback?: string | null) {
  return String(row?.display_name ?? row?.email ?? fallback ?? "—");
}

export async function getCaseDossier(caseId: string): Promise<CaseDossier | null> {
  const supabase = await createSupabaseServerClient();

  const { data: caseRow, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, case_code, organization_id, review_type, status, priority, intake_source, summary, due_at, opened_at, submitted_at, review_started_at, scholar_started_at, approval_started_at, closed_at, outcome")
    .eq("id", caseId)
    .maybeSingle();

  if (caseError) throw new Error(caseError.message);
  if (!caseRow) return null;

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("id, legal_name, name, registration_no")
    .eq("id", caseRow.organization_id)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);

  const [assignmentsRes, findingsRes, evidenceRes, recommendationsRes, decisionsRes, actionItemsRes, actionUpdatesRes, snapshotsRes, eventsRes] = await Promise.all([
    supabase.from("governance_case_assignments").select("id, assignee_user_id, assignment_role, status, notes, assigned_at, completed_at").eq("case_id", caseId).order("assigned_at", { ascending: false }),
    supabase.from("governance_case_findings").select("id, finding_type, severity, status, title, details, recommendation, recorded_by_user_id, created_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    supabase.from("governance_case_evidence").select("id, finding_id, evidence_type, title, evidence_url, notes, recorded_by_user_id, created_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    supabase.from("governance_case_recommendations").select("id, assignment_id, submitted_by_user_id, recommendation, summary, detailed_notes, status, submitted_at").eq("case_id", caseId).order("submitted_at", { ascending: false }),
    supabase.from("governance_case_decisions").select("id, decision_stage, decision, result_status, result_outcome, decision_note, conditions_text, decided_by_user_id, decided_at").eq("case_id", caseId).order("decided_at", { ascending: false }),
    supabase.from("governance_case_action_items").select("id, finding_id, title, description, priority, status, assigned_role_label, owner_name, due_at, resolution_note, verified_at").eq("case_id", caseId).order("created_at", { ascending: false }),
    supabase.from("governance_case_action_updates").select("id, action_item_id, source, update_type, message, proposed_status, attachment_url, submitted_by_user_id, submitted_at, review_status, review_note, reviewed_by_user_id, reviewed_at").eq("case_id", caseId).order("submitted_at", { ascending: false }),
    supabase.from("organization_trust_snapshots").select("id, snapshot_status, trust_level, verification_badge, governance_status, public_summary, published_at, is_current, created_at").eq("organization_id", caseRow.organization_id).order("created_at", { ascending: false }).limit(5),
    supabase.from("trust_events").select("id, event_type, pillar, source, occurred_at, score_delta").eq("organization_id", caseRow.organization_id).order("occurred_at", { ascending: false }).limit(10),
  ]);

  const results = [assignmentsRes, findingsRes, evidenceRes, recommendationsRes, decisionsRes, actionItemsRes, actionUpdatesRes, snapshotsRes, eventsRes];
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
  }

  const userIds = new Set<string>();
  const assignmentIds = new Set<string>();

  for (const row of assignmentsRes.data ?? []) if (row.assignee_user_id) userIds.add(String(row.assignee_user_id));
  for (const row of findingsRes.data ?? []) if (row.recorded_by_user_id) userIds.add(String(row.recorded_by_user_id));
  for (const row of evidenceRes.data ?? []) if (row.recorded_by_user_id) userIds.add(String(row.recorded_by_user_id));
  for (const row of recommendationsRes.data ?? []) {
    if (row.submitted_by_user_id) userIds.add(String(row.submitted_by_user_id));
    if (row.assignment_id) assignmentIds.add(String(row.assignment_id));
  }
  for (const row of decisionsRes.data ?? []) if (row.decided_by_user_id) userIds.add(String(row.decided_by_user_id));
  for (const row of actionUpdatesRes.data ?? []) {
    if (row.submitted_by_user_id) userIds.add(String(row.submitted_by_user_id));
    if (row.reviewed_by_user_id) userIds.add(String(row.reviewed_by_user_id));
  }

  const [{ data: users, error: usersError }, { data: assignmentsForRoles, error: assignmentsForRolesError }] = await Promise.all([
    supabase.from("users").select("id, display_name, email").in("id", Array.from(userIds).length ? Array.from(userIds) : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("governance_case_assignments").select("id, assignment_role").in("id", Array.from(assignmentIds).length ? Array.from(assignmentIds) : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  if (usersError) throw new Error(usersError.message);
  if (assignmentsForRolesError) throw new Error(assignmentsForRolesError.message);

  const userMap = new Map((users ?? []).map((row) => [String(row.id), row]));
  const assignmentRoleMap = new Map((assignmentsForRoles ?? []).map((row) => [String(row.id), String(row.assignment_role)]));

  return {
    caseSummary: {
      id: String(caseRow.id),
      case_code: String(caseRow.case_code),
      organization_id: String(caseRow.organization_id),
      organization_name: String(orgRow?.legal_name ?? orgRow?.name ?? caseRow.organization_id),
      registration_no: orgRow?.registration_no ? String(orgRow.registration_no) : null,
      review_type: String(caseRow.review_type),
      status: String(caseRow.status),
      priority: String(caseRow.priority),
      intake_source: String(caseRow.intake_source),
      summary: caseRow.summary ? String(caseRow.summary) : null,
      due_at: caseRow.due_at ? String(caseRow.due_at) : null,
      opened_at: String(caseRow.opened_at),
      submitted_at: caseRow.submitted_at ? String(caseRow.submitted_at) : null,
      review_started_at: caseRow.review_started_at ? String(caseRow.review_started_at) : null,
      scholar_started_at: caseRow.scholar_started_at ? String(caseRow.scholar_started_at) : null,
      approval_started_at: caseRow.approval_started_at ? String(caseRow.approval_started_at) : null,
      closed_at: caseRow.closed_at ? String(caseRow.closed_at) : null,
      outcome: caseRow.outcome ? String(caseRow.outcome) : null,
    },
    assignments: (assignmentsRes.data ?? []).map((row) => ({
      id: String(row.id),
      assignee_name: userLabel(userMap.get(String(row.assignee_user_id)), String(row.assignee_user_id)),
      assignment_role: String(row.assignment_role),
      status: String(row.status),
      notes: row.notes ? String(row.notes) : null,
      assigned_at: String(row.assigned_at),
      completed_at: row.completed_at ? String(row.completed_at) : null,
    })),
    findings: (findingsRes.data ?? []).map((row) => ({
      id: String(row.id),
      finding_type: String(row.finding_type),
      severity: String(row.severity),
      status: String(row.status),
      title: String(row.title),
      details: row.details ? String(row.details) : null,
      recommendation: row.recommendation ? String(row.recommendation) : null,
      recorded_by_name: userLabel(userMap.get(String(row.recorded_by_user_id)), String(row.recorded_by_user_id)),
      created_at: String(row.created_at),
    })),
    evidence: (evidenceRes.data ?? []).map((row) => ({
      id: String(row.id),
      finding_id: row.finding_id ? String(row.finding_id) : null,
      evidence_type: String(row.evidence_type),
      title: String(row.title),
      evidence_url: row.evidence_url ? String(row.evidence_url) : null,
      notes: row.notes ? String(row.notes) : null,
      recorded_by_name: userLabel(userMap.get(String(row.recorded_by_user_id)), String(row.recorded_by_user_id)),
      created_at: String(row.created_at),
    })),
    recommendations: (recommendationsRes.data ?? []).map((row) => ({
      id: String(row.id),
      assignment_role: row.assignment_id ? assignmentRoleMap.get(String(row.assignment_id)) ?? null : null,
      submitted_by_name: userLabel(userMap.get(String(row.submitted_by_user_id)), String(row.submitted_by_user_id)),
      recommendation: String(row.recommendation),
      summary: String(row.summary),
      detailed_notes: row.detailed_notes ? String(row.detailed_notes) : null,
      status: String(row.status),
      submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    })),
    decisions: (decisionsRes.data ?? []).map((row) => ({
      id: String(row.id),
      decision_stage: String(row.decision_stage),
      decision: String(row.decision),
      result_status: String(row.result_status),
      result_outcome: row.result_outcome ? String(row.result_outcome) : null,
      decision_note: row.decision_note ? String(row.decision_note) : null,
      conditions_text: row.conditions_text ? String(row.conditions_text) : null,
      decided_by_name: userLabel(userMap.get(String(row.decided_by_user_id)), String(row.decided_by_user_id)),
      decided_at: String(row.decided_at),
    })),
    actionItems: (actionItemsRes.data ?? []).map((row) => ({
      id: String(row.id),
      finding_id: row.finding_id ? String(row.finding_id) : null,
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      priority: String(row.priority),
      status: String(row.status),
      assigned_role_label: row.assigned_role_label ? String(row.assigned_role_label) : null,
      owner_name: row.owner_name ? String(row.owner_name) : null,
      due_at: row.due_at ? String(row.due_at) : null,
      resolution_note: row.resolution_note ? String(row.resolution_note) : null,
      verified_at: row.verified_at ? String(row.verified_at) : null,
    })),
    actionUpdates: (actionUpdatesRes.data ?? []).map((row) => ({
      id: String(row.id),
      action_item_id: String(row.action_item_id),
      source: String(row.source),
      update_type: String(row.update_type),
      message: String(row.message),
      proposed_status: row.proposed_status ? String(row.proposed_status) : null,
      attachment_url: row.attachment_url ? String(row.attachment_url) : null,
      submitted_by_name: userLabel(userMap.get(String(row.submitted_by_user_id)), String(row.submitted_by_user_id)),
      submitted_at: String(row.submitted_at),
      review_status: String(row.review_status),
      review_note: row.review_note ? String(row.review_note) : null,
      reviewed_by_name: row.reviewed_by_user_id ? userLabel(userMap.get(String(row.reviewed_by_user_id)), String(row.reviewed_by_user_id)) : null,
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    })),
    snapshots: (snapshotsRes.data ?? []).map((row) => ({
      id: String(row.id),
      snapshot_status: String(row.snapshot_status),
      trust_level: String(row.trust_level),
      verification_badge: String(row.verification_badge),
      governance_status: String(row.governance_status),
      public_summary: String(row.public_summary),
      published_at: row.published_at ? String(row.published_at) : null,
      is_current: Boolean(row.is_current),
      created_at: String(row.created_at),
    })),
    trustEvents: (eventsRes.data ?? []).map((row) => ({
      id: String(row.id),
      event_type: String(row.event_type),
      pillar: row.pillar ? String(row.pillar) : null,
      source: String(row.source),
      occurred_at: String(row.occurred_at),
      score_delta: row.score_delta == null ? null : String(row.score_delta),
    })),
  };
}
