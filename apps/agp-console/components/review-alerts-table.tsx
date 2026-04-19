import Link from "next/link";
import { AlertTriangle, ExternalLink, FolderOpen } from "lucide-react";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { ReviewAlertRow } from "@/lib/console/review-alerts";

function severityBadgeClass(severity: string) {
  if (severity === "critical") return "badge badge-danger";
  if (severity === "warning") return "badge badge-warning";
  return "badge badge-neutral";
}

function alertTypeLabel(alertType: string) {
  switch (alertType) {
    case "case_overdue":
      return "Case overdue";
    case "reviewer_unassigned":
      return "Reviewer missing";
    case "scholar_unassigned":
      return "Scholar missing";
    case "recommendation_missing":
      return "Recommendation missing";
    case "approver_unassigned":
      return "Approver missing";
    case "decision_missing":
      return "Decision missing";
    case "remediation_overdue":
      return "Remediation overdue";
    case "remediation_review_pending":
      return "Remediation review pending";
    case "publication_pending":
      return "Publication pending";
    default:
      return titleCase(alertType.replaceAll("_", " "));
  }
}

type ReviewAlertsTableProps = {
  rows: ReviewAlertRow[];
};

export function ReviewAlertsTable({ rows }: ReviewAlertsTableProps) {
  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">Review Alerts</div>
          <p className="muted">Live SLA-style queue for cases, assignments, remediation follow-up, and publication readiness.</p>
        </div>
        <div className="badge badge-neutral">
          <AlertTriangle size={14} />
          {rows.length} active
        </div>
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Alert</th>
              <th>Organisation</th>
              <th>Case</th>
              <th>Stage / Status</th>
              <th>Due</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No active review alerts right now.</div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.alert_key}>
                  <td>
                    <span className={severityBadgeClass(row.severity)}>{titleCase(row.severity)}</span>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.alert_title}</div>
                      <div className="muted" style={{ maxWidth: 420 }}>{row.alert_message}</div>
                      <div className="badge badge-neutral">{alertTypeLabel(row.alert_type)}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 600 }}>{row.organization_name}</div>
                      <Link className="btn btn-secondary" href={`/organisations/${row.organization_id}`}>
                        <FolderOpen size={14} />
                        Open org
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 600 }}>{row.case_code ?? "—"}</div>
                      {row.action_item_title ? <div className="muted">{row.action_item_title}</div> : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      {row.assignment_role ? <span className="badge badge-neutral">{titleCase(row.assignment_role)}</span> : null}
                      {row.case_status ? <span className={statusBadgeClass(row.case_status)}>{titleCase(row.case_status)}</span> : null}
                      {row.action_item_status ? (
                        <span className={statusBadgeClass(row.action_item_status)}>{titleCase(row.action_item_status)}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div>{formatDate(row.due_at)}</div>
                      {row.days_overdue ? <div className="muted">{row.days_overdue} day(s) late</div> : <div className="muted">—</div>}
                    </div>
                  </td>
                  <td>
                    <Link className="btn btn-primary" href={row.target_href}>
                      <ExternalLink size={14} />
                      {row.target_label}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
