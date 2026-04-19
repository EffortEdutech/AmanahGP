import Link from "next/link";
import { AlertTriangle, ClipboardCheck, ShieldAlert } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { ReviewEscalationTable } from "@/components/review-escalation-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getReviewEscalationSummary, listReviewEscalationRows } from "@/lib/console/review-escalations";

export default async function ReviewEscalationsPage() {
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const [summary, rows] = await Promise.all([getReviewEscalationSummary(), listReviewEscalationRows()]);

  return (
    <ConsoleShell
      title="Review Escalations"
      description="Mission-focused escalation board for cases that are overdue, unassigned, or stuck before reviewer, scholar, or approver action."
      currentPath="/review-escalations"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="total escalations" value={summary.total} note="All active escalation signals" />
        <StatsCard label="critical" value={summary.critical} note="Immediate platform owner intervention needed" />
        <StatsCard label="warning" value={summary.warning} note="Monitor before it becomes critical" />
        <StatsCard label="overdue cases" value={summary.overdue_cases} note="Case due date already passed" />
        <StatsCard label="missing assignments" value={summary.missing_assignments} note="Reviewer, scholar, or approver gap" />
        <StatsCard label="pending acceptance" value={summary.pending_acceptance} note="Assigned but not yet accepted" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">What this page is for</div>
          <div className="muted">
            Use this board to rescue governance work before review or approval stalls. It is especially useful for platform owner oversight of reviewer, scholar, and approver pipelines.
          </div>
        </div>

        <div className="panel section stack">
          <div className="h2">Fast access</div>
          <div style={{ display: "grid", gap: 10 }}>
            <Link className="btn btn-secondary" href="/review-workbench">
              <ClipboardCheck size={16} />
              Open review workbench
            </Link>
            <Link className="btn btn-secondary" href="/my-reviews">
              <ShieldAlert size={16} />
              Open my reviews
            </Link>
            <Link className="btn btn-secondary" href="/cases">
              <AlertTriangle size={16} />
              Open cases
            </Link>
          </div>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Escalation board</div>
        <div className="muted">Open the case, fix assignments, or move the work to the correct reviewer, scholar, or approver workspace.</div>
        <ReviewEscalationTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
