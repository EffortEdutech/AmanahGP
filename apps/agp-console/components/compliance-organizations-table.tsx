import Link from "next/link";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { ComplianceOrganizationRow } from "@/lib/console/server";

function riskBadgeClass(level: ComplianceOrganizationRow["risk_level"]) {
  if (level === "danger") return "badge badge-red";
  if (level === "warning") return "badge badge-amber";
  return "badge badge-green";
}

export function ComplianceOrganizationsTable({ rows }: { rows: ComplianceOrganizationRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Risk</th>
            <th>Lifecycle</th>
            <th>Members</th>
            <th>Apps</th>
            <th>Billing</th>
            <th>Last activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{row.legal_name ?? row.name}</div>
                <div className="muted">{row.registration_no || row.name}</div>
                {row.issues.length > 0 ? (
                  <div className="muted" style={{ marginTop: 6 }}>{row.issues.slice(0, 2).join(" • ")}</div>
                ) : null}
              </td>
              <td>
                <span className={riskBadgeClass(row.risk_level)}>{titleCase(row.risk_level)}</span>
              </td>
              <td>
                <div className="row">
                  <span className={statusBadgeClass(row.onboarding_status)}>{titleCase(row.onboarding_status)}</span>
                  <span className={statusBadgeClass(row.listing_status)}>{titleCase(row.listing_status)}</span>
                </div>
              </td>
              <td>
                <div>{row.active_members} active</div>
                <div className="muted">{row.pending_invites} pending invites</div>
              </td>
              <td>{row.active_apps} active</td>
              <td>
                <div>{titleCase(row.subscription_status) || "No subscription"}</div>
                <div className="muted">{row.open_billing_records} open records</div>
              </td>
              <td>{formatDateTime(row.last_activity_at)}</td>
              <td>
                <div className="row">
                  <Link className="btn btn-secondary" href={`/organisations/${row.id}`}>Open</Link>
                  <Link className="btn btn-secondary" href={`/organisations/${row.id}/billing`}>Billing</Link>
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No organisations found.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
