import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { TrustEventLedgerRow } from "@/lib/console/trust-event-ledger";

function pillarBadgeClass(pillar: string | null) {
  if (pillar === "governance") return "badge badge-amber";
  if (pillar === "compliance") return "badge badge-red";
  if (pillar === "transparency") return "badge badge-green";
  if (pillar === "financial_integrity") return "badge badge-neutral";
  return "badge badge-neutral";
}

export function TrustEventLedgerTable({ rows }: { rows: TrustEventLedgerRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No trust events yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Occurred</th>
            <th>Organisation</th>
            <th>Event</th>
            <th>Signal</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{formatDateTime(row.occurred_at)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.source)}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.organization_name || row.organization_id}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.registration_no || "—"}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>{row.event_type}</div>
                  {row.event_ref_table ? <div className="muted" style={{ fontSize: 12 }}>{row.event_ref_table}</div> : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className={pillarBadgeClass(row.pillar)}>{titleCase((row.pillar || "unknown").replaceAll("_", " "))}</span>
                  <div className="muted" style={{ fontSize: 12 }}>Score delta: {row.score_delta ?? 0}</div>
                </div>
              </td>
              <td>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(row.payload, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
