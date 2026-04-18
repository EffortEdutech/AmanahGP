import { reviewGovernanceActionUpdateAction } from "@/app/(console)/cases/remediation-update-actions";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { GovernanceCaseActionUpdateRow } from "@/lib/console/governance-action-updates";

function reviewBadgeClass(status: string) {
  if (status === "accepted") return "badge badge-green";
  if (status === "rejected") return "badge badge-red";
  if (status === "needs_more_info") return "badge badge-amber";
  return "badge badge-neutral";
}

export function GovernanceActionUpdateTable({
  caseId,
  rows,
}: {
  caseId: string;
  rows: GovernanceCaseActionUpdateRow[];
}) {
  if (rows.length === 0) {
    return <div className="notice">No remediation submissions yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Submitted</th>
            <th>Action item</th>
            <th>Source</th>
            <th>Message</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{formatDateTime(row.submitted_at)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.update_type.replaceAll("_", " "))}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.action_item_title || row.action_item_id}</div>
                  {row.proposed_status ? <span className={statusBadgeClass(row.proposed_status)}>{titleCase(row.proposed_status)}</span> : null}
                </div>
              </td>
              <td>{titleCase(row.source.replaceAll("_", " "))}</td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>{row.message}</div>
                  {row.attachment_url ? (
                    <a className="link" href={row.attachment_url} target="_blank" rel="noreferrer">Open attachment</a>
                  ) : null}
                  {row.review_note ? <div className="muted" style={{ fontSize: 12 }}>Review note: {row.review_note}</div> : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 8 }}>
                  <span className={reviewBadgeClass(row.review_status)}>{titleCase(row.review_status.replaceAll("_", " "))}</span>
                  <form className="stack" action={reviewGovernanceActionUpdateAction}>
                    <input type="hidden" name="case_id" value={caseId} />
                    <input type="hidden" name="action_update_id" value={row.id} />
                    <select className="select" name="decision" defaultValue={row.review_status === "pending" ? "accepted" : row.review_status}>
                      <option value="accepted">Accept</option>
                      <option value="rejected">Reject</option>
                      <option value="needs_more_info">Needs more info</option>
                    </select>
                    <textarea className="textarea" name="review_note" rows={3} defaultValue={row.review_note || ""} placeholder="Reviewer note to organisation" />
                    <button className="btn btn-secondary" type="submit">Review submission</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
