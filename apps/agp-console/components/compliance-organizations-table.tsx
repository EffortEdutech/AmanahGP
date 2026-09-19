"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { ComplianceOrganizationRow } from "@/lib/console/server";

function riskBadgeClass(level: ComplianceOrganizationRow["risk_level"]) {
  if (level === "danger")  return "badge badge-red";
  if (level === "warning") return "badge badge-amber";
  return "badge badge-green";
}

const RISK_OPTIONS: { value: ComplianceOrganizationRow["risk_level"]; label: string }[] = [
  { value: "danger",  label: "Danger" },
  { value: "warning", label: "Warning" },
  { value: "good",    label: "Good" },
];

export function ComplianceOrganizationsTable({ rows }: { rows: ComplianceOrganizationRow[] }) {
  const [risk, setRisk] = useState("");

  const filtered = rows.filter(r => {
    if (risk && r.risk_level !== risk) return false;
    return true;
  });

  return (
    <div className="stack">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="comp-risk">Risk level</label>
          <select className="select" id="comp-risk" value={risk} onChange={e => setRisk(e.target.value)}>
            <option value="">All organisations — {rows.length}</option>
            {RISK_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} — {rows.filter(r => r.risk_level === o.value).length}
              </option>
            ))}
          </select>
        </div>
        {risk ? (
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label style={{ visibility: "hidden" }}>Reset</label>
            <button className="btn btn-secondary btn-sm" onClick={() => setRisk("")}>
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="muted">No organisations match the selected filter.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Risk</th>
                <th>Dataset</th>
                <th>Lifecycle</th>
                <th>Members</th>
                <th>Apps</th>
                <th>Billing</th>
                <th>Last activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.legal_name ?? row.name}</div>
                    <div className="muted">{row.registration_no || row.name}</div>
                    {row.issues.length > 0 ? (
                      <div className="muted" style={{ marginTop: 6 }}>{row.issues.slice(0, 2).join(" • ")}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={riskBadgeClass(row.risk_level)}>{titleCase(row.risk_level)}</span>
                  </td>
                  <td>
                    <span className={row.data_origin === "seed" ? "badge badge-amber" : "badge badge-green"}>
                      {titleCase(row.data_origin)}
                    </span>
                  </td>
                  <td>
                    <div className="row">
                      <span className={statusBadgeClass(row.onboarding_status)}>{titleCase(row.onboarding_status)}</span>
                      <span className={statusBadgeClass(row.listing_status)}>{titleCase(row.listing_status)}</span>
                    </div>
                  </td>
                  <td>
                    <div>{row.active_members} active</div>
                    <div className="muted">{row.pending_invites} pending</div>
                  </td>
                  <td>{row.active_apps} active</td>
                  <td>
                    <div>{titleCase(row.subscription_status) || "No subscription"}</div>
                    <div className="muted">{row.open_billing_records} open records</div>
                  </td>
                  <td>{formatDateTime(row.last_activity_at)}</td>
                  <td>
                    <details className="action-menu">
                      <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                      <div className="action-menu__dropdown">
                        <Link className="action-menu__item action-menu__item--primary" href={`/organisations/${row.id}`}>Open</Link>
                        <Link className="action-menu__item" href={`/organisations/${row.id}/billing`}>Billing</Link>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="muted">No organisations found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="muted" style={{ fontSize: 12 }}>
        Showing {filtered.length} of {rows.length} organisations
      </div>
    </div>
  );
}
