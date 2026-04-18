import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { GovernanceCaseDecisionRow } from "@/lib/console/governance-decisions";

export function GovernanceCaseDecisionTable({ rows }: { rows: GovernanceCaseDecisionRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No formal decisions recorded yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Decided at</th>
            <th>Stage</th>
            <th>Decision</th>
            <th>Result</th>
            <th>By</th>
            <th>Trust signal</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const actorName = row.actor?.display_name || row.actor?.email || row.decided_by_user_id || "—";

            return (
              <tr key={row.id}>
                <td>{formatDateTime(row.decided_at)}</td>
                <td>{titleCase(row.decision_stage)}</td>
                <td>{titleCase(row.decision.replaceAll("_", " "))}</td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    <span className={statusBadgeClass(row.result_status)}>{titleCase(row.result_status)}</span>
                    {row.result_outcome ? <span className="badge badge-neutral">{titleCase(row.result_outcome)}</span> : null}
                  </div>
                </td>
                <td>{actorName}</td>
                <td>
                  {row.emitted_trust_event_type ? (
                    <div style={{ display: "grid", gap: 4 }}>
                      <span className="badge badge-green">{titleCase(row.emitted_trust_event_type.replaceAll("_", " "))}</span>
                      {row.emitted_trust_event_id ? <span className="muted" style={{ fontSize: 12 }}>{row.emitted_trust_event_id}</span> : null}
                    </div>
                  ) : (
                    <span className="muted">No trust event emitted</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "grid", gap: 6 }}>
                    {row.decision_note ? <div>{row.decision_note}</div> : <span className="muted">—</span>}
                    {row.conditions_text ? <div className="muted" style={{ fontSize: 12 }}>Conditions: {row.conditions_text}</div> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
