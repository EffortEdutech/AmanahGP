"use client";

import { useState } from "react";
import Link from "next/link";
import type { ApprovalBoardRow } from "@/lib/console/approval-board";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function bucketLabel(bucket: ApprovalBoardRow["readiness_bucket"]) {
  switch (bucket) {
    case "awaiting_scholar_assignment":    return "Scholar unassigned";
    case "awaiting_scholar_recommendation": return "Awaiting scholar recommendation";
    case "scholar_recommendation_ready":   return "Ready for approver";
    case "awaiting_approver_assignment":   return "Approver unassigned";
    case "awaiting_approver_decision":     return "Awaiting final decision";
    case "decision_recorded":              return "Decision recorded";
    default: return bucket;
  }
}

function bucketBadgeClass(bucket: ApprovalBoardRow["readiness_bucket"]) {
  switch (bucket) {
    case "awaiting_scholar_assignment":
    case "awaiting_approver_assignment":   return "badge badge-red";
    case "awaiting_scholar_recommendation":
    case "awaiting_approver_decision":     return "badge badge-amber";
    case "scholar_recommendation_ready":   return "badge badge-blue";
    case "decision_recorded":              return "badge badge-green";
    default: return "badge badge-neutral";
  }
}

function stageBadgeClass(stage: string) {
  if (stage === "approver") return "badge badge-purple";
  if (stage === "scholar")  return "badge badge-blue";
  return "badge badge-neutral";
}

function recommendationText(value: string | null) {
  return value ? titleCase(value.replaceAll("_", " ")) : "—";
}

function primaryActionHref(row: ApprovalBoardRow) {
  return row.current_stage === "approver"
    ? `/cases/${row.case_id}/decision`
    : `/cases/${row.case_id}/recommendations`;
}

function primaryActionLabel(row: ApprovalBoardRow) {
  return row.current_stage === "approver" ? "Decision" : "Recommendations";
}

const BUCKET_OPTIONS: { value: ApprovalBoardRow["readiness_bucket"]; label: string }[] = [
  { value: "awaiting_scholar_assignment",    label: "Scholar unassigned" },
  { value: "awaiting_scholar_recommendation", label: "Awaiting recommendation" },
  { value: "scholar_recommendation_ready",   label: "Ready for approver" },
  { value: "awaiting_approver_assignment",   label: "Approver unassigned" },
  { value: "awaiting_approver_decision",     label: "Awaiting decision" },
  { value: "decision_recorded",              label: "Decision recorded" },
];

export function ApprovalBoardTable({ rows }: { rows: ApprovalBoardRow[] }) {
  const [stage,   setStage]   = useState("");
  const [bucket,  setBucket]  = useState("");

  const filtered = rows.filter(r => {
    if (stage  && r.current_stage     !== stage)  return false;
    if (bucket && r.readiness_bucket  !== bucket) return false;
    return true;
  });

  const hasFilters = stage || bucket;

  if (rows.length === 0) {
    return <div className="notice">No scholar or approver pipeline cases right now. Alhamdulillah.</div>;
  }

  return (
    <div className="stack">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="ab-stage">Stage</label>
          <select className="select" id="ab-stage" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="">All stages — {rows.length}</option>
            <option value="scholar">Scholar — {rows.filter(r => r.current_stage === "scholar").length}</option>
            <option value="approver">Approver — {rows.filter(r => r.current_stage === "approver").length}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ab-bucket">Readiness</label>
          <select className="select" id="ab-bucket" value={bucket} onChange={e => setBucket(e.target.value)}>
            <option value="">All readiness — {rows.length}</option>
            {BUCKET_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} — {rows.filter(r => r.readiness_bucket === o.value).length}
              </option>
            ))}
          </select>
        </div>
        {hasFilters ? (
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label style={{ visibility: "hidden" }}>Reset</label>
            <button className="btn btn-secondary btn-sm" onClick={() => { setStage(""); setBucket(""); }}>
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
                <th>Stage</th>
                <th>Readiness</th>
                <th>Recommendations / Decision</th>
                <th>Assignments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.case_id}>
                  <td>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div>{row.case_code}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{row.organization_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.review_type.replaceAll("_", " "))}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span className={stageBadgeClass(row.current_stage)}>{titleCase(row.current_stage)}</span>
                        {row.is_overdue ? <span className="badge badge-red">Overdue</span> : null}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>Status: {titleCase(row.case_status.replaceAll("_", " "))}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={bucketBadgeClass(row.readiness_bucket)}>{bucketLabel(row.readiness_bucket)}</span>
                      <div className="muted" style={{ fontSize: 12 }}>Priority: {titleCase(row.priority)}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div className="muted" style={{ fontSize: 12 }}>Reviewer: {recommendationText(row.latest_reviewer_recommendation)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Scholar: {recommendationText(row.latest_scholar_recommendation)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Final: {recommendationText(row.latest_approver_decision)}</div>
                      {row.latest_scholar_recommendation_at ? (
                        <div className="muted" style={{ fontSize: 12 }}>
                          Scholar submitted: {formatDateTime(row.latest_scholar_recommendation_at)}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Scholar: {row.scholar_assignees.length ? row.scholar_assignees.join(", ") : "Unassigned"}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        Approver: {row.approver_assignees.length ? row.approver_assignees.join(", ") : "Unassigned"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <details className="action-menu">
                      <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                      <div className="action-menu__dropdown">
                        <Link className="action-menu__item action-menu__item--primary" href={primaryActionHref(row)}>{primaryActionLabel(row)}</Link>
                        <Link className="action-menu__item" href={`/cases/${row.case_id}`}>Case</Link>
                        <Link className="action-menu__item" href={`/cases/${row.case_id}/assignments`}>Assignments</Link>
                        <Link className="action-menu__item" href={`/cases/${row.case_id}/dossier`}>Dossier</Link>
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
        Showing {filtered.length} of {rows.length}
      </div>
    </div>
  );
}
