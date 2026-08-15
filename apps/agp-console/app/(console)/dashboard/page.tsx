import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  ClipboardList,
  Gavel,
  PlusCircle,
  Radio,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { NotificationFeed } from "@/components/notification-feed";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDateTime } from "@/lib/console/mappers";
import { getDashboardStats, getNotificationSummary, listAuditLogs, listConsoleNotifications } from "@/lib/console/server";

export default async function DashboardPage() {
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const [stats, notificationSummary, recentNotifications, recentAudit] = await Promise.all([
    getDashboardStats(),
    getNotificationSummary(),
    listConsoleNotifications(5),
    listAuditLogs(5),
  ]);

  const hasAlerts = notificationSummary.total > 0;
  const hasCritical = notificationSummary.danger > 0;

  return (
    <ConsoleShell
      title="Dashboard"
      description="Platform overview — organisations, active alerts, and recent governance activity."
      currentPath="/dashboard"
      roles={roles}
      userEmail={user.email}
    >
      {/* Platform stats */}
      <section className="grid-cards">
        <StatsCard label="Organisations" value={stats.organizations} note="Registered on the platform" />
        <StatsCard label="Active workspaces" value={stats.installations} note="Org apps currently enabled" />
        <StatsCard label="Billing plans" value={stats.plans} note="Available subscription tiers" />
        <StatsCard label="Pending invites" value={stats.pendingInvites} note="Awaiting member acceptance" />
        <StatsCard
          label="Open alerts"
          value={notificationSummary.total}
          note={hasAlerts ? "Requires attention" : "No active alerts"}
          accent={hasAlerts ? "amber" : "green"}
        />
        <StatsCard
          label="Critical alerts"
          value={notificationSummary.danger}
          note={hasCritical ? "Immediate action needed" : "None"}
          accent={hasCritical ? "amber" : "green"}
        />
      </section>

      {/* Quick actions — visible on all screen sizes */}
      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Organisations</div>
          <p className="muted">Register new organisations, verify status, and manage their platform access.</p>
          <Link className="btn btn-primary" href="/organisations/new">
            <PlusCircle size={16} />
            Register organisation
          </Link>
          <Link className="btn btn-secondary" href="/organisations">
            <Building2 size={16} />
            View all organisations
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">Governance review</div>
          <p className="muted">Process incoming trust events, manage open cases, and move reviews through the approval workflow.</p>
          <Link className="btn btn-primary" href="/review-workbench">
            <ShieldCheck size={16} />
            Open review workbench
          </Link>
          <Link className="btn btn-secondary" href="/cases">
            <Gavel size={16} />
            View governance cases
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">Publication</div>
          <p className="muted">Release approved trust scores and compliance results to the public donor platform.</p>
          <Link className="btn btn-primary" href="/publication-command">
            <Send size={16} />
            Publication command
          </Link>
          <Link className="btn btn-secondary" href="/events">
            <Radio size={16} />
            View trust events
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">Billing &amp; plans</div>
          <p className="muted">Manage subscription tiers, assign plans to organisations, and track the billing lifecycle.</p>
          <Link className="btn btn-secondary" href="/plans">
            <Wallet size={16} />
            View plans
          </Link>
        </div>
      </section>

      {/* Live activity feeds */}
      <section className="grid-cards" style={{ alignItems: "start" }}>
        <div className="panel section stack">
          <div className="row-between">
            <div>
              <div className="h2">Alerts</div>
              <p className="muted">Unresolved platform alerts requiring action.</p>
            </div>
            <Link className="btn btn-secondary" href="/notifications">
              <Bell size={16} />
              All alerts
            </Link>
          </div>
          <NotificationFeed notifications={recentNotifications} emptyText="No active alerts — all clear." />
        </div>

        <div className="panel section stack">
          <div className="row-between">
            <div>
              <div className="h2">Recent activity</div>
              <p className="muted">Latest governance and platform actions.</p>
            </div>
            <Link className="btn btn-secondary" href="/audit">
              <ClipboardList size={16} />
              Full audit log
            </Link>
          </div>
          <div className="stack">
            {recentAudit.length === 0 ? <div className="muted">No recorded activity yet.</div> : null}
            {recentAudit.map((log: any) => (
              <div className="notification-card panel-soft" key={log.id}>
                <div className="row-between">
                  <div className="stack" style={{ gap: 6 }}>
                    <div className="badge badge-neutral">{log.entity_table || "platform"}</div>
                    <div style={{ fontWeight: 700 }}>{log.action}</div>
                    <div className="muted">{log.organization?.legal_name || log.organization?.name || "Platform-wide"}</div>
                  </div>
                  <div className="muted">{formatDateTime(log.occurred_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Escalations callout — only shown when critical alerts exist */}
      {hasCritical ? (
        <section className="panel section">
          <div className="row-between">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={18} color="#b45309" />
              </span>
              <div>
                <div className="h2" style={{ color: "#92400e" }}>
                  {notificationSummary.danger} critical {notificationSummary.danger === 1 ? "alert" : "alerts"} need attention
                </div>
                <p className="muted">Review escalated items before the next governance cycle.</p>
              </div>
            </div>
            <Link className="btn btn-secondary" href="/review-escalations">
              View escalations
            </Link>
          </div>
        </section>
      ) : null}
    </ConsoleShell>
  );
}
