import Link from "next/link";
import { AlertTriangle, Bell, Building2, ClipboardList, Compass, PlusCircle, ShieldCheck, Wallet } from "lucide-react";
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

  return (
    <ConsoleShell
      title="Dashboard"
      description="Monitor organisations, govern review flow, publish donor-safe trust profiles, and control the AGP platform from one place."
      currentPath="/dashboard"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="organizations" value={stats.organizations} note="Canonical public.organizations" />
        <StatsCard label="app installations" value={stats.installations} note="Enabled org workspaces and modules" />
        <StatsCard label="billing plans" value={stats.plans} note="Reusable pricing catalog" />
        <StatsCard label="pending invites" value={stats.pendingInvites} note="org_invitations waiting for acceptance" />
        <StatsCard label="open alerts" value={notificationSummary.total} note="Computed from canonical billing, invites, and org lifecycle tables" />
        <StatsCard label="critical alerts" value={notificationSummary.danger} note="Danger-level notifications requiring immediate action" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Organisation Lifecycle</div>
          <p className="muted">Create, verify, suspend, and review organisation legal profile and platform status.</p>
          <Link className="btn btn-primary" href="/organisations/new">
            <PlusCircle size={16} />
            Create organisation
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">App Provisioning</div>
          <p className="muted">Enable apps per organisation and manage which workspaces are active.</p>
          <Link className="btn btn-secondary" href="/organisations">
            <Building2 size={16} />
            Open organisations
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">Billing Control</div>
          <p className="muted">Manage plans, subscriptions, invoice records, and the platform billing lifecycle.</p>
          <Link className="btn btn-secondary" href="/plans">
            <Wallet size={16} />
            View plans
          </Link>
        </div>
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Mission flow access</div>
          <p className="muted">Open the major governance and publication pages from here without typing URLs.</p>
          <div style={{ display: "grid", gap: 10 }}>
            <Link className="btn btn-secondary" href="/flow-map">
              <Compass size={16} />
              Open console flow map
            </Link>
            <Link className="btn btn-secondary" href="/review-workbench">
              <ShieldCheck size={16} />
              Open review workbench
            </Link>
            <Link className="btn btn-secondary" href="/review-escalations">
              <AlertTriangle size={16} />
              Open review escalations
            </Link>
            <Link className="btn btn-secondary" href="/publication-command">
              <ShieldCheck size={16} />
              Open publication command
            </Link>
          </div>
        </div>
      </section>

      <section className="grid-cards" style={{ alignItems: "start" }}>
        <div className="panel section stack">
          <div className="row-between">
            <div>
              <div className="h2">Notification Center</div>
              <p className="muted">Live control-plane alerts computed from canonical tables only.</p>
            </div>
            <Link className="btn btn-secondary" href="/notifications">
              <Bell size={16} />
              Open notifications
            </Link>
          </div>
          <NotificationFeed notifications={recentNotifications} emptyText="No active alerts right now." />
        </div>

        <div className="panel section stack">
          <div className="row-between">
            <div>
              <div className="h2">Recent Audit Activity</div>
              <p className="muted">Latest actions written to public.audit_logs.</p>
            </div>
            <Link className="btn btn-secondary" href="/audit">
              <ClipboardList size={16} />
              Open audit log
            </Link>
          </div>
          <div className="stack">
            {recentAudit.length === 0 ? <div className="muted">No audit logs yet.</div> : null}
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
    </ConsoleShell>
  );
}
