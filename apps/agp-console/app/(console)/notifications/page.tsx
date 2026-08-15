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
      description="Live alerts across invitations, billing, subscriptions, and organisation lifecycle. Resolved items clear automatically."
      currentPath="/notifications"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="Open alerts" value={summary.total} note="All active alerts" accent={summary.total > 0 ? "amber" : "green"} />
        <StatsCard label="Critical" value={summary.danger} note="Immediate action needed" accent={summary.danger > 0 ? "amber" : "green"} />
        <StatsCard label="Pending invites" value={summary.invites} note="Awaiting acceptance" />
        <StatsCard label="Billing" value={summary.billing} note="Invoices & subscriptions" />
        <StatsCard label="Compliance" value={summary.compliance} note="Lifecycle & listing issues" />
      </section>

      <section className="panel section stack" style={{ paddingTop: 0 }}>
        <NotificationFeed notifications={notifications} emptyText="No active console notifications right now." />
      </section>
    </ConsoleShell>
  );
}
