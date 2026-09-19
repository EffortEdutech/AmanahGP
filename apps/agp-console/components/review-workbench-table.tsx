"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { ReviewWorkbenchRow } from "@/lib/console/review-workbench";

function stageBadgeClass(stage: string) {
  if (stage === "reviewer") return "badge badge-amber";
  if (stage === "scholar")  return "badge badge-blue";
  if (stage === "approver") return "badge badge-green";
  return "badge badge-neutral";
}

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high")   return "badge badge-amber";
  return "badge badge-neutral";
}

function slaBadgeClass(bucket: string) {
  if (bucket === "overdue")   return "badge badge-red";
  if (bucket === "due_today") return "badge badge-amber";
  if (bucket === "due_soon")  return "badge badge-blue";
  return "badge badge-neutral";
}

function workspaceLink(row: ReviewWorkbenchRow) {
  return row.current_stage === "approver"
    ? `/cases/${row.case_id}/decision`
    : `/cases/${row.case_id}/recommendations`;
}

function workspaceLabel(row: ReviewWorkbenchRow) {
  return row.current_stage === "approver" ? "Decision" : "Recommendations";
}

const SLA_OPTIONS = [
  { value: "overdue",    label: "Overdue" },
  { value: "due_today",  label: "Due Today" },
  { value: "due_soon",   label: "Due Soon" },
  { value: "comfortable", label: "Comfortable" },
];

export function ReviewWorkbenchTable({ rows, currentUserId, title }: {
  rows: ReviewWorkbenchRow[];
  currentUserId: string;
  title: string;
}) {
  const [stage, setStage] = useState("");
  const [sla,   setSla]   = useState("");

  const filtered = rows.filter(r => {
    if (stage && r.current_stage !== stage) return false;
    if (sla   && r.sla_bucket    !== sla)   return false;
    return true;
  });

  const hasFilters = stage || sla;

  return (
    <section className="panel section stack">
      <div className="h2">{title}</div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor={`wb-stage-${title}`}>Stage</label>
          <select className="select" id={`wb-stage-${title}`} value={stage} onChange={e => setStage(e.target.value)}>
            <option value="">All stages — {rows.length}</option>
            <option value="reviewer">Reviewer — {rows.filter(r => r.current_stage === "reviewer").length}</option>
            <option value="scholar">Scholar — {rows.filter(r => r.current_stage === "scholar").length}</option>
            <option value="approver">Approver — {rows.filter(r => r.current_stage === "approver").length}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`wb-sla-${title}`}>SLA</label>
          <select className="select" id={`wb-sla-${title}`} value={sla} onChange={e => setSla(e.target.value)}>
            <option value="">All — {rows.length}</option>
            {SLA_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} — {rows.filter(r => r.sla_bucket === o.value).length}
              </option>
            ))}
          </select>
        </div>
        {hasFilters ? (
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label style={{ visibility: "hidden" }}>Reset</label>
            <button className="btn btn-secondary btn-sm" onClick={() => { setStage(""); setSla(""); }}>
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="notice">No active cases in this queue.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Organisation</th>
                <th>Stage</th>
                <th>Priority / SLA</th>
                <th>Assignments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const mine = row.active_assignee_user_ids.includes(currentUserId);
                return (
                  <tr key={row.case_id}>
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
                        <span className={stageBadgeClass(row.current_stage)}>{titleCase(row.current_stage)}</span>
                        <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.status.replaceAll("_", " "))}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span className={priorityBadgeClass(row.priority)}>{titleCase(row.priority)}</span>
                          <span className={slaBadgeClass(row.sla_bucket)}>{titleCase(row.sla_bucket.replaceAll("_", " "))}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div className="muted" style={{ fontSize: 12 }}>Reviewer: {row.reviewer_assignment_count}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Scholar: {row.scholar_assignment_count}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Approver: {row.approver_assignment_count}</div>
                        {mine ? <span className="badge badge-green">Assigned to me</span> : null}
                      </div>
                    </td>
                    <td>
                      <details className="action-menu">
                        <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                        <div className="action-menu__dropdown">
                          <Link className="action-menu__item action-menu__item--primary" href={`/cases/${row.case_id}`}>Open case</Link>
                          <Link className="action-menu__item" href={workspaceLink(row)}>{workspaceLabel(row)}</Link>
                          <Link className="action-menu__item" href={`/cases/${row.case_id}/assignments`}>Assignments</Link>
                          <Link className="action-menu__item" href={`/cases/${row.case_id}/dossier`}>Dossier</Link>
                          <Link className="action-menu__item" href={`/organisations/${row.organization_id}`}>Organisation</Link>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="muted" style={{ fontSize: 12 }}>
        Showing {filtered.length} of {rows.length}
      </div>
    </section>
  );
}
