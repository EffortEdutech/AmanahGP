import Link from "next/link";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { PublicationReadinessRow } from "@/lib/console/publication-readiness";

function readinessBadgeClass(ready: boolean) {
  return ready ? "badge badge-green" : "badge badge-red";
}

function neutralBadgeClass(active: boolean) {
  return active ? "badge badge-green" : "badge badge-neutral";
}

export function PublicationReadinessTable({ rows }: { rows: PublicationReadinessRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No organisations found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Readiness</th>
            <th>Trust snapshot</th>
            <th>Publication gates</th>
            <th>Blockers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.organization_id}>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.organization_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.registration_no || "—"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{titleCase((row.org_type || "other").replaceAll("_", " "))}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className={readinessBadgeClass(row.is_publication_ready)}>
                    {row.is_publication_ready ? "Ready" : "Blocked"}
                  </span>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Open cases: {row.open_case_count}
                  </div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>{row.snapshot_status ? titleCase(row.snapshot_status) : "No snapshot"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.trust_level ? titleCase(row.trust_level) : "—"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.published_at ? formatDateTime(row.published_at) : "—"}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span className={neutralBadgeClass(row.workspace_status === "active")}>workspace</span>
                  <span className={neutralBadgeClass(row.listing_status === "listed")}>listing</span>
                  <span className={neutralBadgeClass(Boolean(row.snapshot_id))}>snapshot</span>
                  <span className={neutralBadgeClass(row.has_amanah_hub)}>amanah_hub</span>
                </div>
              </td>
              <td>
                {row.blocker_reasons.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {row.blocker_reasons.map((reason, index) => (
                      <li key={`${row.organization_id}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="muted">No blockers</span>
                )}
              </td>
              <td>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link className="btn-secondary" href={`/organisations/${row.organization_id}`}>
                    Open organisation
                  </Link>
                  <Link className="btn-secondary" href={`/public-trust-profiles/${row.organization_id}`}>
                    Public preview
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
