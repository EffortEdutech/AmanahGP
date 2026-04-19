import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { CaseRecommendationRow } from "@/lib/console/recommendations";

function recommendationBadgeClass(value: string) {
  if (value === "approve") return "badge badge-green";
  if (value === "approve_with_conditions") return "badge badge-blue";
  if (value === "remediate") return "badge badge-amber";
  if (value === "reject") return "badge badge-red";
  return "badge badge-neutral";
}

export function CaseRecommendationsTable({ rows }: { rows: CaseRecommendationRow[] }) {
  return (
    <section className="panel section stack">
      <div className="h2">Submitted recommendations</div>
      {rows.length === 0 ? (
        <div className="notice">No recommendations submitted for this case yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Submitted by</th>
                <th>Role</th>
                <th>Recommendation</th>
                <th>Summary</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.submitted_by_name}</td>
                  <td>{row.assignment_role ? titleCase(row.assignment_role) : "—"}</td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={recommendationBadgeClass(row.recommendation)}>
                        {titleCase(row.recommendation.replaceAll("_", " "))}
                      </span>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.status)}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div>{row.summary}</div>
                      {row.detailed_notes ? (
                        <div className="muted" style={{ fontSize: 12 }}>{row.detailed_notes}</div>
                      ) : null}
                    </div>
                  </td>
                  <td>{row.submitted_at ? formatDateTime(row.submitted_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
