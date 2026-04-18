import Link from "next/link";
import type { ComplianceOrganizationRow } from "@/lib/console/server";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

function riskBadgeClass(level: ComplianceOrganizationRow["risk_level"]) {
  if (level === "danger") return "badge badge-red";
  if (level === "warning") return "badge badge-amber";
  return "badge badge-green";
}

export function VerificationQueueTable({ rows }: { rows: ComplianceOrganizationRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Risk</th>
            <th>Lifecycle</th>
            <th>Reasons</th>
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
              </td>
              <td><span className={riskBadgeClass(row.risk_level)}>{titleCase(row.risk_level)}</span></td>
              <td>
                <div className="row">
                  <span className={statusBadgeClass(row.onboarding_status)}>{titleCase(row.onboarding_status)}</span>
                  <span className={statusBadgeClass(row.listing_status)}>{titleCase(row.listing_status)}</span>
                </div>
              </td>
              <td>
                <div className="muted">{row.issues.length ? row.issues.slice(0, 3).join(" • ") : "Ready"}</div>
              </td>
              <td>{formatDateTime(row.last_activity_at)}</td>
              <td>
                <div className="row">
                  <Link className="btn btn-secondary" href={`/organisations/${row.id}`}>Open</Link>
                  <Link className="btn btn-secondary" href={`/cases/new?orgId=${row.id}`}>Open case</Link>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted">No organisations need manual verification right now.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
