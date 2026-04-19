import { Bell, CircleAlert, Mail, Wallet } from "lucide-react";
import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { NotificationFeed } from "@/components/notification-feed";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getNotificationSummary, listConsoleNotifications } from "@/lib/console/server";

export default async function NotificationsPage() {
  const { user, roles } = await requireConsoleAccess("notifications.read");
  const [summary, notifications] = await Promise.all([
    getNotificationSummary(),
    listConsoleNotifications(40),
  ]);

  return (
    <ConsoleShell
      title="Notifications"
      description="Cross-platform control-plane alerts computed from canonical invite, billing, subscription, and organisation lifecycle tables."
      currentPath="/notifications"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="open alerts" value={summary.total} note="All current computed console alerts" />
        <StatsCard label="critical alerts" value={summary.danger} note="Immediate platform action recommended" />
        <StatsCard label="pending invites" value={summary.invites} note="Member invitations waiting for acceptance" />
        <StatsCard label="billing alerts" value={summary.billing} note="Invoices and subscriptions needing follow-up" />
        <StatsCard label="compliance alerts" value={summary.compliance} note="Organisation lifecycle and listing issues" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Alert routing</div>
          <div className="row"><span className="badge badge-neutral"><Mail size={14} /> Invitations</span><span className="badge badge-warning"><Wallet size={14} /> Billing</span><span className="badge badge-danger"><CircleAlert size={14} /> Compliance / Suspension</span></div>
          <div className="notice">
            Step 13 uses canonical database only. Alerts are computed live from existing tables. No new notifications table is introduced in this pack.
          </div>
          <div className="row">
            <Link className="btn btn-secondary" href="/audit">
              <Bell size={16} />
              Review audit log
            </Link>
            <Link className="btn btn-secondary" href="/review-alerts">
              <CircleAlert size={16} />
              Open review alerts
            </Link>
          </div>
        </div>

        <div className="panel section stack">
          <div className="h2">How to use</div>
          <div className="muted">Open the linked organisation screen from each alert and resolve the underlying issue from members, billing, apps, or lifecycle controls.</div>
          <div className="muted">Because this feed is computed from canonical tables, resolved records automatically disappear from the list when their statuses are corrected.</div>
        </div>
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Notification Center</div>
            <p className="muted">Sorted newest-first across invitations, billing records, subscriptions, and organisation review states.</p>
          </div>
        </div>
        <NotificationFeed notifications={notifications} emptyText="No active console notifications right now." />
      </section>
    </ConsoleShell>
  );
}
