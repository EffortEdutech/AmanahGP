import Link from "next/link";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { PublicTrustProfileRow } from "@/lib/console/public-trust-profiles";

function badgeClass(value: string) {
  if (value === "exemplary" || value === "approved") return "badge badge-green";
  if (value === "assured") return "badge badge-blue";
  if (value === "developing" || value === "reviewed") return "badge badge-amber";
  if (value === "watchlist" || value === "rejected" || value === "suspended") return "badge badge-red";
  return "badge badge-neutral";
}

export function PublicTrustProfileTable({ rows }: { rows: PublicTrustProfileRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No published public trust profiles yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Trust</th>
            <th>Verification</th>
            <th>Governance</th>
            <th>Published</th>
            <th>Apps</th>
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
              <td><span className={badgeClass(row.trust_level)}>{titleCase(row.trust_level)}</span></td>
              <td><span className={badgeClass(row.verification_badge)}>{titleCase(row.verification_badge.replaceAll("_", " "))}</span></td>
              <td><span className={badgeClass(row.governance_status)}>{titleCase(row.governance_status.replaceAll("_", " "))}</span></td>
              <td>{row.published_at ? formatDateTime(row.published_at) : "—"}</td>
              <td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {row.enabled_app_keys.length > 0 ? row.enabled_app_keys.map((appKey) => (
                    <span key={appKey} className="badge badge-neutral">{appKey}</span>
                  )) : <span className="muted">—</span>}
                </div>
              </td>
              <td>
                <Link className="btn-secondary" href={`/public-trust-profiles/${row.organization_id}`}>
                  Preview
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
