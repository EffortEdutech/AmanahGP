import Link from "next/link";
import type { ComplianceOrganizationRow } from "@/lib/console/server";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function riskBadgeClass(level: ComplianceOrganizationRow["risk_level"]) {
  if (level === "danger") return "badge badge-red";
  if (level === "warning") return "badge badge-amber";
  return "badge badge-green";
}

export function OrganizationCompliancePanel({ row }: { row: ComplianceOrganizationRow | null }) {
  if (!row) {
    return (
      <section className="panel section stack">
        <div className="h2">Compliance overview</div>
        <div className="muted">Compliance summary is not available for this organisation yet.</div>
      </section>
    );
  }

  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">Compliance overview</div>
          <div className="muted">Derived from lifecycle, members, apps, subscription, billing, and recent activity.</div>
        </div>
        <div className={riskBadgeClass(row.risk_level)}>{titleCase(row.risk_level)}</div>
      </div>

      <div className="grid-cards">
        <div className="stat-blk">
          <div className="stat-val">{row.active_members}</div>
          <div className="stat-lbl">active members</div>
        </div>
        <div className="stat-blk">
          <div className="stat-val">{row.pending_invites}</div>
          <div className="stat-lbl">pending invites</div>
        </div>
        <div className="stat-blk">
          <div className="stat-val">{row.active_apps}</div>
          <div className="stat-lbl">active apps</div>
        </div>
        <div className="stat-blk">
          <div className="stat-val">{row.open_billing_records}</div>
          <div className="stat-lbl">open billing records</div>
        </div>
      </div>

      <div className="panel-soft section stack">
        <div className="h2">Current subscription</div>
        <div className="muted">{titleCase(row.subscription_status) || "No subscription assigned"}</div>
        <div className="muted">Last activity: {formatDateTime(row.last_activity_at)}</div>
      </div>

      <div className="stack">
        <div className="h2">Flags</div>
        {row.issues.length === 0 ? (
          <div className="notice">No current compliance flags detected.</div>
        ) : (
          row.issues.map((issue) => (
            <div key={issue} className={row.risk_level === "danger" ? "notice notice-danger" : "notice notice-warning"}>
              {issue}
            </div>
          ))
        )}
      </div>

      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${row.id}/members`}>Open members</Link>
        <Link className="btn btn-secondary" href={`/organisations/${row.id}/apps`}>Open apps</Link>
        <Link className="btn btn-secondary" href={`/organisations/${row.id}/billing`}>Open billing</Link>
      </div>
    </section>
  );
}
