import Link from "next/link";
import type { GovernanceUatRow } from "@/lib/console/governance-uat";

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function titleCase(value: string | null) {
  if (!value) return "—";

  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageBadge(done: boolean, pendingText: string, doneText = "Done") {
  return <span className={done ? "badge badge-green" : "badge badge-amber"}>{done ? doneText : pendingText}</span>;
}

function decisionBadge(row: GovernanceUatRow) {
  if (row.decision_recorded) {
    if (row.latest_result_outcome === "approved") return <span className="badge badge-green">Approved</span>;
    if (row.latest_result_outcome === "conditional") return <span className="badge badge-blue">Conditional</span>;
    if (row.latest_result_outcome === "improvement_required") return <span className="badge badge-amber">Improvement</span>;
    if (row.latest_result_outcome === "rejected") return <span className="badge badge-red">Rejected</span>;
    return <span className="badge badge-green">Decision recorded</span>;
  }

  return <span className="badge badge-amber">Awaiting decision</span>;
}

export function EndToEndGovernanceUatBoard({ rows }: { rows: GovernanceUatRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="panel section stack">
        <div className="h2">End-to-End Governance Workflow</div>
        <div className="notice">
          No governance intake rows found yet. Create or simulate one AmanahOS-triggered event first, then reopen this page.
        </div>
      </section>
    );
  }

  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">Workflow monitor</div>
          <p className="muted">One row represents one incoming governance event routed into the Console workflow.</p>
        </div>
        <div className="badge badge-neutral">{rows.length} tracked row(s)</div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Organisation / Event</th>
              <th>Intake / Case</th>
              <th>Reviewer</th>
              <th>Scholar</th>
              <th>Decision</th>
              <th>Snapshot / Publish</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.trust_event_id}>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 600 }}>{row.organization_name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.event_type)}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {titleCase(row.pillar)} · {titleCase(row.event_source)} · {formatDateTime(row.event_occurred_at)}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>{stageBadge(row.intake_created, "Pending intake", "Intake ready")}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Status: {titleCase(row.intake_status)}</div>
                    <div>{row.case_opened ? <span className="badge badge-blue">{row.case_code ?? "Case opened"}</span> : <span className="badge badge-amber">Case not opened</span>}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {titleCase(row.case_review_type)} · {titleCase(row.case_status)}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>{stageBadge(row.reviewer_completed, "Awaiting reviewer")}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Assignments: {row.reviewer_assignments} · Recommendations: {row.reviewer_recommendations}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>{stageBadge(row.scholar_completed, "Awaiting scholar")}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      Assignments: {row.scholar_assignments} · Recommendations: {row.scholar_recommendations}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>Approver assignments: {row.approver_assignments}</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>{decisionBadge(row)}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {titleCase(row.latest_decision_stage)} · {titleCase(row.latest_decision)}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {titleCase(row.latest_result_status)} · {titleCase(row.latest_result_outcome)}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>At: {formatDateTime(row.latest_decision_at)}</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div>{stageBadge(row.snapshot_exists, "Snapshot pending", "Snapshot ready")}</div>
                    <div>{row.donor_facing ? <span className="badge badge-green">Donor-facing</span> : <span className="badge badge-amber">Not yet published</span>}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {titleCase(row.snapshot_status)} · {titleCase(row.snapshot_trust_level)} · {titleCase(row.snapshot_verification_badge)}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>Published: {formatDateTime(row.snapshot_published_at)}</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Link className="btn-secondary" href="/events">Trust events</Link>
                    {row.case_id ? <Link className="btn-secondary" href={`/cases/${row.case_id}`}>Open case</Link> : null}
                    <Link className="btn-secondary" href={`/organisations/${row.organization_id}`}>Open org</Link>
                    <Link className="btn-secondary" href="/publication-command">Publication</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
