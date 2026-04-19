import Link from "next/link";
import { Bell, ClipboardList } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { ReviewAlertsTable } from "@/components/review-alerts-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getReviewAlertSummary, listReviewAlerts } from "@/lib/console/review-alerts";

export default async function ReviewAlertsPage() {
  const { user, roles } = await requireConsoleAccess("notifications.read");
  const [summary, rows] = await Promise.all([getReviewAlertSummary(), listReviewAlerts(200)]);

  return (
    <ConsoleShell
      title="Review Alerts"
      description="Live governance SLA alerts computed from canonical cases, assignments, remediation actions, and publication state."
      currentPath="/review-alerts"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="active alerts" value={summary.total} note="All current review alerts" />
        <StatsCard label="critical" value={summary.critical} note="Immediate action recommended" />
        <StatsCard label="warning" value={summary.warning} note="Needs follow-up soon" />
        <StatsCard label="overdue cases" value={summary.overdue_cases} note="Cases past their due date" />
        <StatsCard label="blocked assignments" value={summary.blocked_assignments} note="Missing reviewer, scholar, or approver" />
        <StatsCard label="remediation" value={summary.remediation} note="Action items overdue or awaiting review" />
        <StatsCard label="publication" value={summary.publication} note="Approved cases not yet published" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">How to use</div>
          <div className="muted">This queue is mission-focused: clear overdue cases, remove assignment bottlenecks, verify remediation, and publish donor-facing trust updates faster.</div>
          <div className="notice">Step 40 adds only one SQL view: public.v_governance_review_alerts. No new base table is introduced.</div>
          <div className="row">
            <Link className="btn btn-secondary" href="/review-workbench">
              <ClipboardList size={16} />
              Open review workbench
            </Link>
            <Link className="btn btn-secondary" href="/notifications">
              <Bell size={16} />
              Open notifications
            </Link>
          </div>
        </div>
      </section>

      <ReviewAlertsTable rows={rows} />
    </ConsoleShell>
  );
}
