import type { GovernanceCaseEvidenceRow } from "@/lib/console/server";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function typeBadgeClass(type: string) {
  if (type === "document") return "badge badge-neutral";
  if (type === "link") return "badge badge-green";
  if (type === "snapshot") return "badge badge-amber";
  return "badge badge-neutral";
}

export function GovernanceEvidenceTable({ rows }: { rows: GovernanceCaseEvidenceRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Evidence</th>
            <th>Type</th>
            <th>Finding</th>
            <th>Recorded by</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ fontWeight: 700 }}>
                  {row.evidence_url ? (
                    <a href={row.evidence_url} target="_blank" rel="noreferrer">{row.title}</a>
                  ) : (
                    row.title
                  )}
                </div>
                <div className="muted">{row.notes || "—"}</div>
              </td>
              <td><span className={typeBadgeClass(row.evidence_type)}>{titleCase(row.evidence_type)}</span></td>
              <td>{row.finding?.title || "General case evidence"}</td>
              <td>{row.user?.display_name || row.user?.email || "Console user"}</td>
              <td>{formatDateTime(row.created_at)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">No evidence saved yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
