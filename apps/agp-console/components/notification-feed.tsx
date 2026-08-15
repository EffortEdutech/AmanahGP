"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime, notificationBadgeClass, titleCase } from "@/lib/console/mappers";

export type ConsoleNotificationItem = {
  id: string;
  kind: string;
  level: string;
  title: string;
  body: string;
  occurredAt: string;
  href?: string;
  organization?: {
    id: string;
    name: string | null;
    legal_name: string | null;
  } | null;
  metadata?: Record<string, unknown>;
};

const LEVEL_STRIP: Record<string, string> = {
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const LEVEL_ROW_BG: Record<string, string> = {
  danger: "rgba(239,68,68,0.04)",
  warning: "rgba(245,158,11,0.035)",
  info: "transparent",
};

const PAGE_SIZE = 20;

export function NotificationFeed({
  notifications,
  emptyText = "No notifications right now.",
}: {
  notifications: ConsoleNotificationItem[];
  emptyText?: string;
}) {
  const [level, setLevel] = useState("");
  const [kind,  setKind]  = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);

  if (notifications.length === 0) {
    return <div className="muted">{emptyText}</div>;
  }

  const filtered = notifications.filter(item => {
    if (level && item.level !== level) return false;
    if (kind === "billing") return item.kind === "billing" || item.kind === "subscription";
    if (kind && item.kind !== kind) return false;
    return true;
  });

  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - shown;

  function handleLevelChange(v: string) { setLevel(v); setShown(PAGE_SIZE); }
  function handleKindChange(v: string)  { setKind(v);  setShown(PAGE_SIZE); }

  return (
    <div className="stack" style={{ gap: 16 }}>

      {/* Filter bar — same style as /audit */}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="notif-level">Level</label>
          <select className="select" id="notif-level" value={level} onChange={e => handleLevelChange(e.target.value)}>
            <option value="">All levels</option>
            <option value="danger">Danger</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="notif-kind">Kind</label>
          <select className="select" id="notif-kind" value={kind} onChange={e => handleKindChange(e.target.value)}>
            <option value="">All kinds</option>
            <option value="invitation">Invitations</option>
            <option value="billing">Billing</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
        {(level || kind) ? (
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label style={{ visibility: "hidden" }}>Reset</label>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setLevel(""); setKind(""); setShown(PAGE_SIZE); }}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="muted">No alerts match the selected filters.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 4, padding: 0 }} />
                <th>Level</th>
                <th>Kind</th>
                <th>Organisation</th>
                <th>Alert</th>
                <th style={{ whiteSpace: "nowrap" }}>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map(item => (
                <tr
                  key={item.id}
                  style={{ background: LEVEL_ROW_BG[item.level] ?? "transparent" }}
                >
                  {/* colour strip */}
                  <td style={{
                    width: 4,
                    padding: 0,
                    background: LEVEL_STRIP[item.level] ?? "var(--border)",
                  }} />

                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className={notificationBadgeClass(item.level)}>
                      {titleCase(item.level)}
                    </span>
                  </td>

                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className="badge badge-neutral">
                      {titleCase(item.kind)}
                    </span>
                  </td>

                  <td style={{ fontSize: 13 }}>
                    {item.organization?.legal_name ?? item.organization?.name ?? (
                      <span className="muted">Platform-wide</span>
                    )}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{item.body}</div>
                  </td>

                  <td className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatDateTime(item.occurredAt)}
                  </td>

                  <td>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="action-menu__item action-menu__item--primary"
                        style={{ padding: "4px 8px", display: "inline-block", whiteSpace: "nowrap" }}
                      >
                        Open →
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {remaining > 0 ? (
          <button
            onClick={() => setShown(s => s + PAGE_SIZE)}
            className="btn btn-secondary btn-sm"
          >
            Show {Math.min(remaining, PAGE_SIZE)} more ({remaining} remaining)
          </button>
        ) : null}
        {filtered.length > 0 ? (
          <span className="muted" style={{ fontSize: 12 }}>
            Showing {visible.length} of {filtered.length}
          </span>
        ) : null}
      </div>

    </div>
  );
}
