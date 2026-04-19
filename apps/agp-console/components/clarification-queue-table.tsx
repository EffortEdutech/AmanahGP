import Link from "next/link";
import { MessageSquareReply, FolderOpen } from "lucide-react";
import { reviewClarificationAction } from "@/app/(console)/cases/[caseId]/clarifications/actions";
import type { GovernanceClarificationRow } from "@/lib/console/case-clarifications";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";

type ClarificationQueueTableProps = {
  rows: GovernanceClarificationRow[];
  title: string;
};

export function ClarificationQueueTable({ rows, title }: ClarificationQueueTableProps) {
  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">{title}</div>
          <p className="muted">Organisation responses submitted from AmanahOS can be reviewed here before the case moves forward.</p>
        </div>
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Organisation</th>
              <th>Case</th>
              <th>Clarification</th>
              <th>Status</th>
              <th>Review</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No organisation clarifications in this queue.</div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>{formatDate(row.submitted_at)}</div>
                      <div className="muted">{row.submitted_by_name ?? row.submitted_by_role ?? "Organisation"}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.organization_name ?? "—"}</div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 600 }}>{row.case_code ?? row.case_id}</div>
                      <div className="muted">{titleCase(row.target_kind)}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6, maxWidth: 420 }}>
                      <div style={{ fontWeight: 600 }}>{row.title}</div>
                      <div className="muted">{row.response_text}</div>
                    </div>
                  </td>
                  <td>
                    <span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span>
                  </td>
                  <td>
                    <form action={reviewClarificationAction} className="stack" style={{ minWidth: 250 }}>
                      <input type="hidden" name="clarification_id" value={row.id} />
                      <input type="hidden" name="case_id" value={row.case_id} />
                      <select name="status" className="input" defaultValue={row.status}>
                        <option value="under_review">Under review</option>
                        <option value="accepted">Accepted</option>
                        <option value="needs_more_info">Needs more info</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <textarea
                        name="review_note"
                        className="input"
                        rows={3}
                        placeholder="Console review note"
                        defaultValue={row.review_note ?? ""}
                      />
                      <button className="btn btn-primary" type="submit">
                        <MessageSquareReply size={14} />
                        Save review
                      </button>
                    </form>
                  </td>
                  <td>
                    <div className="row">
                      <Link className="btn btn-secondary" href={`/cases/${row.case_id}`}>
                        <FolderOpen size={14} />
                        Case
                      </Link>
                      <Link className="btn btn-secondary" href={`/cases/${row.case_id}/clarifications`}>
                        <FolderOpen size={14} />
                        Thread
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
