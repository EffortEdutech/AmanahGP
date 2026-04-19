import Link from "next/link";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { CaseDossier } from "@/lib/console/case-dossier";

function SimpleBadge({ value }: { value: string }) {
  return <span className="badge badge-neutral">{titleCase(value.replaceAll("_", " "))}</span>;
}

export function CaseDossierSummary({ dossier }: { dossier: CaseDossier }) {
  const s = dossier.caseSummary;
  return (
    <section className="panel section stack">
      <div className="h2">Case summary</div>
      <div className="grid-3">
        <div><div className="muted">Case code</div><div>{s.case_code}</div></div>
        <div><div className="muted">Organisation</div><div>{s.organization_name}</div></div>
        <div><div className="muted">Registration no.</div><div>{s.registration_no || "—"}</div></div>
        <div><div className="muted">Review type</div><div>{titleCase(s.review_type.replaceAll("_", " "))}</div></div>
        <div><div className="muted">Status</div><div>{titleCase(s.status.replaceAll("_", " "))}</div></div>
        <div><div className="muted">Priority</div><div>{titleCase(s.priority)}</div></div>
        <div><div className="muted">Opened</div><div>{formatDateTime(s.opened_at)}</div></div>
        <div><div className="muted">Due</div><div>{s.due_at ? formatDateTime(s.due_at) : "—"}</div></div>
        <div><div className="muted">Outcome</div><div>{s.outcome ? titleCase(s.outcome.replaceAll("_", " ")) : "—"}</div></div>
      </div>
      <div className="muted">{s.summary || "No summary recorded."}</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn-secondary" href={`/cases/${s.id}`}>Open case</Link>
        <Link className="btn-secondary" href={`/cases/${s.id}/recommendations`}>Recommendations</Link>
        <Link className="btn-secondary" href={`/cases/${s.id}/decision`}>Decision workspace</Link>
        <Link className="btn-secondary" href={`/organisations/${s.organization_id}`}>Organisation</Link>
      </div>
    </section>
  );
}

export function CaseDossierAssignments({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Assignments</div>
      {dossier.assignments.length === 0 ? <div className="notice">No case assignments yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Assignee</th><th>Role</th><th>Status</th><th>Notes</th><th>Assigned</th></tr></thead><tbody>
          {dossier.assignments.map((row) => <tr key={row.id}><td>{row.assignee_name}</td><td>{titleCase(row.assignment_role)}</td><td><SimpleBadge value={row.status} /></td><td>{row.notes || "—"}</td><td>{formatDateTime(row.assigned_at)}</td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierFindings({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Findings</div>
      {dossier.findings.length === 0 ? <div className="notice">No findings recorded yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Type / Severity</th><th>Status</th><th>Recommendation</th><th>Recorded</th></tr></thead><tbody>
          {dossier.findings.map((row) => <tr key={row.id}><td><div style={{ display: "grid", gap: 4 }}><div>{row.title}</div><div className="muted" style={{ fontSize: 12 }}>{row.details || "—"}</div></div></td><td><div style={{ display: "grid", gap: 6 }}><SimpleBadge value={row.finding_type} /><SimpleBadge value={row.severity} /></div></td><td><SimpleBadge value={row.status} /></td><td>{row.recommendation || "—"}</td><td><div style={{ display: "grid", gap: 4 }}><div>{row.recorded_by_name}</div><div className="muted" style={{ fontSize: 12 }}>{formatDateTime(row.created_at)}</div></div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierEvidence({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Evidence</div>
      {dossier.evidence.length === 0 ? <div className="notice">No evidence recorded yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Type</th><th>Link</th><th>Recorded by</th><th>Created</th></tr></thead><tbody>
          {dossier.evidence.map((row) => <tr key={row.id}><td><div style={{ display: "grid", gap: 4 }}><div>{row.title}</div><div className="muted" style={{ fontSize: 12 }}>{row.notes || "—"}</div></div></td><td><SimpleBadge value={row.evidence_type} /></td><td>{row.evidence_url ? <a href={row.evidence_url} target="_blank" rel="noreferrer">Open</a> : "—"}</td><td>{row.recorded_by_name}</td><td>{formatDateTime(row.created_at)}</td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierRecommendations({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Recommendations</div>
      {dossier.recommendations.length === 0 ? <div className="notice">No recommendations submitted yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Submitted by</th><th>Role</th><th>Recommendation</th><th>Summary</th><th>Status</th></tr></thead><tbody>
          {dossier.recommendations.map((row) => <tr key={row.id}><td>{row.submitted_by_name}</td><td>{row.assignment_role ? titleCase(row.assignment_role) : "—"}</td><td>{titleCase(row.recommendation.replaceAll("_", " "))}</td><td><div style={{ display: "grid", gap: 4 }}><div>{row.summary}</div><div className="muted" style={{ fontSize: 12 }}>{row.detailed_notes || "—"}</div></div></td><td><div style={{ display: "grid", gap: 4 }}><SimpleBadge value={row.status} />{row.submitted_at ? <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(row.submitted_at)}</div> : null}</div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierDecisions({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Decisions</div>
      {dossier.decisions.length === 0 ? <div className="notice">No formal decisions yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Stage</th><th>Decision</th><th>Outcome</th><th>Note</th><th>Decided</th></tr></thead><tbody>
          {dossier.decisions.map((row) => <tr key={row.id}><td>{titleCase(row.decision_stage)}</td><td>{titleCase(row.decision.replaceAll("_", " "))}</td><td><div style={{ display: "grid", gap: 4 }}><SimpleBadge value={row.result_status} />{row.result_outcome ? <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.result_outcome.replaceAll("_", " "))}</div> : null}</div></td><td><div style={{ display: "grid", gap: 4 }}><div>{row.decision_note || "—"}</div><div className="muted" style={{ fontSize: 12 }}>{row.conditions_text || "—"}</div></div></td><td><div style={{ display: "grid", gap: 4 }}><div>{row.decided_by_name}</div><div className="muted" style={{ fontSize: 12 }}>{formatDateTime(row.decided_at)}</div></div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierActions({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Action items</div>
      {dossier.actionItems.length === 0 ? <div className="notice">No remediation action items yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Title</th><th>Priority / Status</th><th>Owner</th><th>Due</th><th>Resolution</th></tr></thead><tbody>
          {dossier.actionItems.map((row) => <tr key={row.id}><td><div style={{ display: "grid", gap: 4 }}><div>{row.title}</div><div className="muted" style={{ fontSize: 12 }}>{row.description || "—"}</div></div></td><td><div style={{ display: "grid", gap: 6 }}><SimpleBadge value={row.priority} /><SimpleBadge value={row.status} /></div></td><td><div style={{ display: "grid", gap: 4 }}><div>{row.owner_name || row.assigned_role_label || "—"}</div>{row.verified_at ? <div className="muted" style={{ fontSize: 12 }}>Verified {formatDateTime(row.verified_at)}</div> : null}</div></td><td>{row.due_at ? formatDateTime(row.due_at) : "—"}</td><td>{row.resolution_note || "—"}</td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierUpdates({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Remediation submissions</div>
      {dossier.actionUpdates.length === 0 ? <div className="notice">No remediation submissions yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Update</th><th>Source</th><th>Review status</th><th>Attachment</th><th>Submitted</th></tr></thead><tbody>
          {dossier.actionUpdates.map((row) => <tr key={row.id}><td><div style={{ display: "grid", gap: 4 }}><div>{row.message}</div><div className="muted" style={{ fontSize: 12 }}>{row.review_note || "—"}</div></div></td><td><div style={{ display: "grid", gap: 4 }}><div>{titleCase(row.source)}</div><div className="muted" style={{ fontSize: 12 }}>{titleCase(row.update_type.replaceAll("_", " "))}</div></div></td><td><div style={{ display: "grid", gap: 4 }}><SimpleBadge value={row.review_status} />{row.proposed_status ? <div className="muted" style={{ fontSize: 12 }}>Proposed: {titleCase(row.proposed_status.replaceAll("_", " "))}</div> : null}</div></td><td>{row.attachment_url ? <a href={row.attachment_url} target="_blank" rel="noreferrer">Open</a> : "—"}</td><td><div style={{ display: "grid", gap: 4 }}><div>{row.submitted_by_name}</div><div className="muted" style={{ fontSize: 12 }}>{formatDateTime(row.submitted_at)}</div></div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierSnapshots({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Trust snapshots</div>
      {dossier.snapshots.length === 0 ? <div className="notice">No trust snapshots for this organisation yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Status</th><th>Trust</th><th>Badge</th><th>Governance</th><th>Summary</th></tr></thead><tbody>
          {dossier.snapshots.map((row) => <tr key={row.id}><td><div style={{ display: "grid", gap: 4 }}><SimpleBadge value={row.snapshot_status} />{row.is_current ? <span className="badge badge-green">Current</span> : null}</div></td><td>{titleCase(row.trust_level)}</td><td>{titleCase(row.verification_badge.replaceAll("_", " "))}</td><td>{titleCase(row.governance_status.replaceAll("_", " "))}</td><td><div style={{ display: "grid", gap: 4 }}><div>{row.public_summary}</div><div className="muted" style={{ fontSize: 12 }}>{row.published_at ? `Published ${formatDateTime(row.published_at)}` : `Created ${formatDateTime(row.created_at)}`}</div></div></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

export function CaseDossierEvents({ dossier }: { dossier: CaseDossier }) {
  return (
    <section className="panel section stack">
      <div className="h2">Recent trust events</div>
      {dossier.trustEvents.length === 0 ? <div className="notice">No trust events found for this organisation yet.</div> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>Event type</th><th>Pillar</th><th>Source</th><th>Score delta</th><th>Occurred</th></tr></thead><tbody>
          {dossier.trustEvents.map((row) => <tr key={row.id}><td>{row.event_type}</td><td>{row.pillar ? titleCase(row.pillar.replaceAll("_", " ")) : "—"}</td><td>{titleCase(row.source)}</td><td>{row.score_delta ?? "—"}</td><td>{formatDateTime(row.occurred_at)}</td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}
