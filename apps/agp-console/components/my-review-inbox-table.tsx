"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptAssignmentAction, completeAssignmentAction } from "@/app/(console)/my-reviews/actions";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { MyReviewInboxRow } from "@/lib/console/my-reviews";

function statusBadge(status: MyReviewInboxRow["assignment_status"]) {
  if (status === "accepted") return "badge badge-green";
  if (status === "assigned") return "badge badge-blue";
  return "badge badge-neutral";
}

function priorityBadge(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high")   return "badge badge-amber";
  return "badge badge-neutral";
}

const ROLE_OPTIONS    = ["reviewer", "scholar", "approver"];
const STATUS_OPTIONS  = ["assigned", "accepted", "completed"];

export function MyReviewInboxTable({ rows }: { rows: MyReviewInboxRow[] }) {
  const [role,   setRole]   = useState("");
  const [status, setStatus] = useState("");

  const filtered = rows.filter(r => {
    if (role   && r.assignment_role   !== role)   return false;
    if (status && r.assignment_status !== status) return false;
    return true;
  });

  const hasFilters = role || status;

  return (
    <section className="panel section stack">
      <div className="h2">My assigned reviews</div>

      {rows.length > 0 && (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="myrev-role">Role</label>
            <select className="select" id="myrev-role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="">All roles — {rows.length}</option>
              {ROLE_OPTIONS.map(v => (
                <option key={v} value={v}>
                  {titleCase(v)} — {rows.filter(r => r.assignment_role === v).length}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="myrev-status">Status</label>
            <select className="select" id="myrev-status" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All statuses — {rows.length}</option>
              {STATUS_OPTIONS.map(v => (
                <option key={v} value={v}>
                  {titleCase(v)} — {rows.filter(r => r.assignment_status === v).length}
                </option>
              ))}
            </select>
          </div>
          {hasFilters ? (
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label style={{ visibility: "hidden" }}>Reset</label>
              <button className="btn btn-secondary btn-sm" onClick={() => { setRole(""); setStatus(""); }}>
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="notice">No active review assignments for your account.</div>
      ) : filtered.length === 0 ? (
        <div className="muted">No assignments match the selected filters.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Organisation</th>
                <th>Role</th>
                <th>Priority / Due</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.assignment_id}>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>{row.case_code}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.review_type.replaceAll("_", " "))}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{row.summary || "—"}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>{row.organization_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{row.registration_no || "—"}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={statusBadge(row.assignment_status)}>{titleCase(row.assignment_status)}</span>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.assignment_role)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Case: {titleCase(row.case_status.replaceAll("_", " "))}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={priorityBadge(row.priority)}>{titleCase(row.priority)}</span>
                      <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Assigned: {formatDateTime(row.assigned_at)}</div>
                    </div>
                  </td>
                  <td>{row.notes || "—"}</td>
                  <td>
                    <details className="action-menu">
                      <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                      <div className="action-menu__dropdown">
                        <Link className="action-menu__item action-menu__item--primary" href={`/cases/${row.case_id}`}>Open case</Link>
                        {row.assignment_role === "approver" ? (
                          <Link className="action-menu__item" href={`/cases/${row.case_id}/decision`}>Decision workspace</Link>
                        ) : (
                          <Link className="action-menu__item" href={`/cases/${row.case_id}/recommendations`}>Recommendations</Link>
                        )}
                        <Link className="action-menu__item" href={`/cases/${row.case_id}/assignments`}>Assignments</Link>
                        <Link className="action-menu__item" href={`/cases/${row.case_id}/dossier`}>Dossier</Link>
                        {row.assignment_status === "assigned" ? (
                          <form action={acceptAssignmentAction} style={{ display: "contents" }}>
                            <input type="hidden" name="assignment_id" value={row.assignment_id} />
                            <input type="hidden" name="case_id" value={row.case_id} />
                            <button className="action-menu__item action-menu__item--primary" type="submit">Accept assignment</button>
                          </form>
                        ) : null}
                        {row.assignment_status === "accepted" ? (
                          <form action={completeAssignmentAction} style={{ display: "contents" }}>
                            <input type="hidden" name="assignment_id" value={row.assignment_id} />
                            <input type="hidden" name="case_id" value={row.case_id} />
                            <button className="action-menu__item action-menu__item--muted" type="submit">Mark complete</button>
                          </form>
                        ) : null}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div className="muted" style={{ fontSize: 12 }}>
          Showing {filtered.length} of {rows.length}
        </div>
      )}
    </section>
  );
}
