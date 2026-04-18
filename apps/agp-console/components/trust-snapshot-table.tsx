import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { OrganizationTrustSnapshotRow } from "@/lib/console/trust-snapshots";

function trustLevelBadgeClass(level: string) {
  if (level === "exemplary") return "badge badge-green";
  if (level === "assured") return "badge badge-green";
  if (level === "developing") return "badge badge-amber";
  if (level === "watchlist") return "badge badge-red";
  return "badge badge-neutral";
}

export function TrustSnapshotTable({ rows }: { rows: OrganizationTrustSnapshotRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No trust snapshots yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Trust</th>
            <th>Governance</th>
            <th>Summary</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.organization_name || row.organization_id}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.registration_no || "—"}</div>
                  {row.is_current ? <span className="badge badge-green">Current</span> : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className={trustLevelBadgeClass(row.trust_level)}>{titleCase(row.trust_level)}</span>
                  <span className="badge badge-neutral">{titleCase(row.verification_badge.replaceAll("_", " "))}</span>
                </div>
              </td>
              <td><span className={statusBadgeClass(row.governance_status)}>{titleCase(row.governance_status.replaceAll("_", " "))}</span></td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>{row.public_summary}</div>
                  {row.public_highlights.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {row.public_highlights.map((highlight, index) => (
                        <li key={`${row.id}-${index}`} className="muted">{highlight}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <span className={row.snapshot_status === "published" ? "badge badge-green" : "badge badge-neutral"}>{titleCase(row.snapshot_status)}</span>
                  <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(row.published_at || row.created_at)}</div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
