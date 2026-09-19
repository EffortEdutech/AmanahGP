"use client";

import { useState } from "react";
import Link from "next/link";
import type { GovernanceReviewCaseRow } from "@/lib/console/server";
import { formatDate, formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  if (priority === "low") return "badge badge-neutral";
  return "badge badge-green";
}

function isApproverStage(row: GovernanceReviewCaseRow) {
  return row.status === "approval_pending" || Boolean(row.approval_started_at);
}

function workspaceLink(row: GovernanceReviewCaseRow) {
  return isApproverStage(row) ? `/cases/${row.id}/decision` : `/cases/${row.id}/recommendations`;
}

function workspaceLabel(row: GovernanceReviewCaseRow) {
  return isApproverStage(row) ? "Decision" : "Recommendations";
}

const STATUS_OPTIONS = [
  { value: "submitted",        label: "Submitted" },
  { value: "under_review",     label: "Under Review" },
  { value: "scholar_review",   label: "Scholar Review" },
  { value: "approval_pending", label: "Approval Pending" },
  { value: "approved",         label: "Approved" },
  { value: "closed",           label: "Closed" },
  { value: "rejected",         label: "Rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high",   label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low",    label: "Low" },
];

export function GovernanceCaseTable({ rows }: { rows: GovernanceReviewCaseRow[] }) {
  const [status,   setStatus]   = useState("");
  const [priority, setPriority] = useState("");

  const filtered = rows.filter(r => {
    if (status   && r.status   !== status)   return false;
    if (priority && r.priority !== priority) return false;
    return true;
  });

  const hasFilters = status || priority;

  return (
    <div className="stack">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="case-status">Status</label>
          <select className="select" id="case-status" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses — {rows.length}</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} — {rows.filter(r => r.status === o.value).length}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="case-priority">Priority</label>
          <select className="select" id="case-priority" value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All priorities — {rows.length}</option>
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} — {rows.filter(r => r.priority === o.value).length}
              </option>
            ))}
          </select>
        </div>
        {hasFilters ? (
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label style={{ visibility: "hidden" }}>Reset</label>
            <button className="btn btn-secondary btn-sm" onClick={() => { setStatus(""); setPriority(""); }}>
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="muted">No cases match the selected filters.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Organisation</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.case_code}</div>
                    <div className="muted">{row.summary || "No summary yet"}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.organization?.legal_name || row.organization?.name || "—"}</div>
                    <div className="muted">{row.organization?.registration_no || row.organization?.org_type || "—"}</div>
                  </td>
                  <td>{titleCase(row.review_type)}</td>
                  <td><span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span></td>
                  <td><span className={priorityBadgeClass(row.priority)}>{titleCase(row.priority)}</span></td>
                  <td>{row.due_at ? formatDate(row.due_at) : "—"}</td>
                  <td>{formatDateTime(row.updated_at)}</td>
                  <td>
                    <details className="action-menu">
                      <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                      <div className="action-menu__dropdown">
                        <Link className="action-menu__item action-menu__item--primary" href={`/cases/${row.id}`}>Open case</Link>
                        <Link className="action-menu__item" href={workspaceLink(row)}>{workspaceLabel(row)}</Link>
                        <Link className="action-menu__item" href={`/cases/${row.id}/assignments`}>Assignments</Link>
                        <Link className="action-menu__item" href={`/cases/${row.id}/dossier`}>Dossier</Link>
                        <Link className="action-menu__item" href={`/organisations/${row.organization_id}`}>Organisation</Link>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="muted" style={{ fontSize: 12 }}>
        Showing {filtered.length} of {rows.length} cases
      </div>
    </div>
  );
}
