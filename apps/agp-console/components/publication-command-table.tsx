import Link from "next/link";
import { publishTrustSnapshotAction, unpublishTrustSnapshotAction } from "@/app/(console)/publication-command/actions";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { PublicationCommandRow } from "@/lib/console/publication-command";

function trustBadgeClass(level: string) {
  if (level === "exemplary" || level === "assured") return "badge badge-green";
  if (level === "developing") return "badge badge-amber";
  if (level === "watchlist") return "badge badge-red";
  return "badge badge-neutral";
}

function statusBadgeClass(value: string | null | undefined) {
  if (!value) return "badge badge-neutral";
  if (["approved", "active", "listed"].includes(value)) return "badge badge-green";
  if (["draft", "under_review", "approval_pending"].includes(value)) return "badge badge-amber";
  if (["rejected", "suspended", "archived"].includes(value)) return "badge badge-red";
  return "badge badge-neutral";
}

function gateBadge(active: boolean, label: string) {
  return <span className={active ? "badge badge-green" : "badge badge-neutral"}>{label}</span>;
}

function SnapshotCard({
  label,
  snapshot,
}: {
  label: string;
  snapshot: PublicationCommandRow["latest_draft_snapshot"];
}) {
  if (!snapshot) {
    return <div className="muted">No snapshot</div>;
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span className="badge badge-neutral">{label}</span>
        <span className={statusBadgeClass(snapshot.snapshot_status)}>{titleCase(snapshot.snapshot_status)}</span>
        <span className={trustBadgeClass(snapshot.trust_level)}>{titleCase(snapshot.trust_level)}</span>
        <span className={statusBadgeClass(snapshot.verification_badge)}>{titleCase(snapshot.verification_badge.replaceAll("_", " "))}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        Governance: {titleCase(snapshot.governance_status.replaceAll("_", " "))}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        {snapshot.published_at ? `Published ${formatDateTime(snapshot.published_at)}` : `Created ${formatDateTime(snapshot.created_at)}`}
      </div>
    </div>
  );
}

export function PublicationCommandTable({ rows }: { rows: PublicationCommandRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No organisations found.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Organisation</th>
            <th>Live profile</th>
            <th>Draft candidate</th>
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
                <SnapshotCard label="Live" snapshot={row.current_published_snapshot ?? row.last_published_snapshot} />
              </td>
              <td>
                <SnapshotCard label="Draft" snapshot={row.latest_draft_snapshot} />
              </td>
              <td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {gateBadge(row.workspace_status === "active", "workspace")}
                  {gateBadge(row.listing_status === "listed", "listing")}
                  {gateBadge(row.has_amanah_hub, "amanah_hub")}
                  {gateBadge(row.open_case_count === 0, "no open cases")}
                  {gateBadge(row.can_publish_latest_draft, "publish-ready")}
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
                  {row.latest_draft_snapshot ? (
                    <form action={publishTrustSnapshotAction}>
                      <input type="hidden" name="snapshot_id" value={row.latest_draft_snapshot.id} />
                      <button className="btn-primary" disabled={!row.can_publish_latest_draft} type="submit">
                        Publish draft
                      </button>
                    </form>
                  ) : null}

                  {row.current_published_snapshot ? (
                    <form action={unpublishTrustSnapshotAction}>
                      <input type="hidden" name="snapshot_id" value={row.current_published_snapshot.id} />
                      <button className="btn-secondary" type="submit">
                        Unpublish live
                      </button>
                    </form>
                  ) : null}

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
