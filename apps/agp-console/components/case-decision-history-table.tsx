import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { CaseDecisionRow } from "@/lib/console/decisions";

function outcomeBadge(value: string | null) {
  if (value === "approved") return "badge badge-green";
  if (value === "conditional") return "badge badge-blue";
  if (value === "improvement_required") return "badge badge-amber";
  if (value === "rejected" || value === "expired") return "badge badge-red";
  return "badge badge-neutral";
}

export function CaseDecisionHistoryTable({ rows }: { rows: CaseDecisionRow[] }) {
  return (
    <section className="panel section stack">
      <div className="h2">Decision history</div>
      {rows.length === 0 ? (
        <div className="notice">No formal decisions recorded for this case yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Decision</th>
                <th>Outcome</th>
                <th>Note</th>
                <th>Decided by</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{titleCase(row.decision_stage)}</td>
                  <td>{titleCase(row.decision.replaceAll("_", " "))}</td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={outcomeBadge(row.result_outcome)}>
                        {titleCase((row.result_outcome ?? row.result_status).replaceAll("_", " "))}
                      </span>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.result_status.replaceAll("_", " "))}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div>{row.decision_note || "—"}</div>
                      {row.conditions_text ? <div className="muted" style={{ fontSize: 12 }}>{row.conditions_text}</div> : null}
                    </div>
                  </td>
                  <td>{row.decided_by_name}</td>
                  <td>{formatDateTime(row.decided_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
