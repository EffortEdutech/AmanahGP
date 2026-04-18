import { updateGovernanceFindingStatusAction } from "@/app/(console)/cases/actions";
import type { GovernanceCaseFindingRow } from "@/lib/console/server";
import { GOVERNANCE_FINDING_STATUS_OPTIONS } from "@/lib/console/constants";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function severityBadgeClass(severity: string) {
  if (severity === "critical") return "badge badge-red";
  if (severity === "major") return "badge badge-amber";
  if (severity === "minor") return "badge badge-neutral";
  return "badge badge-green";
}

function statusBadgeClass(status: string) {
  if (status === "open") return "badge badge-red";
  if (status === "accepted") return "badge badge-amber";
  if (status === "resolved") return "badge badge-green";
  return "badge badge-neutral";
}

export function GovernanceFindingsTable({
  caseId,
  rows,
}: {
  caseId: string;
  rows: GovernanceCaseFindingRow[];
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Finding</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Recommendation</th>
            <th>Recorded by</th>
            <th>Created</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{row.title}</div>
                <div className="muted">{row.details || "—"}</div>
              </td>
              <td>{titleCase(row.finding_type)}</td>
              <td><span className={severityBadgeClass(row.severity)}>{titleCase(row.severity)}</span></td>
              <td><span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span></td>
              <td className="muted">{row.recommendation || "—"}</td>
              <td>{row.user?.display_name || row.user?.email || "Console user"}</td>
              <td>{formatDateTime(row.created_at)}</td>
              <td>
                <form className="row" action={updateGovernanceFindingStatusAction}>
                  <input type="hidden" name="case_id" value={caseId} />
                  <input type="hidden" name="finding_id" value={row.id} />
                  <select className="select" name="status" defaultValue={row.status} style={{ minWidth: 130 }}>
                    {GOVERNANCE_FINDING_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" type="submit">Save</button>
                </form>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No findings recorded yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
