"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquareReply, FolderOpen } from "lucide-react";
import { reviewClarificationAction } from "@/app/(console)/cases/[caseId]/clarifications/actions";
import type { GovernanceClarificationRow } from "@/lib/console/case-clarifications";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";

const STATUS_OPTIONS = [
  { value: "submitted",      label: "Submitted" },
  { value: "under_review",   label: "Under Review" },
  { value: "accepted",       label: "Accepted" },
  { value: "needs_more_info", label: "Needs More Info" },
  { value: "rejected",       label: "Rejected" },
];

type ClarificationQueueTableProps = {
  rows: GovernanceClarificationRow[];
  title: string;
};

export function ClarificationQueueTable({ rows, title }: ClarificationQueueTableProps) {
  const [status, setStatus] = useState("");

  const filtered = rows.filter(r => {
    if (status && r.status !== status) return false;
    return true;
  });

  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">{title}</div>
          <p className="muted">Organisation responses submitted from AmanahOS can be reviewed here before the case moves forward.</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="clar-status">Status</label>
            <select className="select" id="clar-status" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses — {rows.length}</option>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label} — {rows.filter(r => r.status === o.value).length}
                </option>
              ))}
            </select>
          </div>
          {status ? (
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label style={{ visibility: "hidden" }}>Reset</label>
              <button className="btn btn-secondary btn-sm" onClick={() => setStatus("")}>
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      )}

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">No organisation clarifications in this queue.</div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
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
                    <details className="action-menu">
                      <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                      <div className="action-menu__dropdown">
                        <Link className="action-menu__item action-menu__item--primary" href={`/cases/${row.case_id}`}>
                          <FolderOpen size={13} style={{ display: "inline", marginRight: 4 }} />
                          Case
                        </Link>
                        <Link className="action-menu__item" href={`/cases/${row.case_id}/clarifications`}>
                          <FolderOpen size={13} style={{ display: "inline", marginRight: 4 }} />
                          Thread
                        </Link>
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="muted" style={{ fontSize: 12 }}>
          Showing {filtered.length} of {rows.length}
        </div>
      )}
    </section>
  );
}
