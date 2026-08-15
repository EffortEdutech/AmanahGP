import { ApprovalBoardTable } from "@/components/approval-board-table";
import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getApprovalBoardSummary, listApprovalBoardRows } from "@/lib/console/approval-board";

export default async function ApprovalBoardPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [summary, rows] = await Promise.all([getApprovalBoardSummary(), listApprovalBoardRows()]);

  return (
    <ConsoleShell
      title="Scholar & Approval Board"
      description="Scholar recommendations and final approval decisions before trust publication."
      currentPath="/approval-board"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="Pipeline cases" value={summary.total} note="Scholar & approver stage" />
        <StatsCard label="Scholar stage" value={summary.scholar_stage} note="Awaiting recommendation" accent="blue" />
        <StatsCard label="Approver stage" value={summary.approver_stage} note="Awaiting final decision" accent="purple" />
        <StatsCard label="Overdue" value={summary.overdue} note="Needs immediate action" accent={summary.overdue > 0 ? "amber" : "green"} />
        <StatsCard label="Scholar gaps" value={summary.awaiting_scholar_assignment + summary.awaiting_scholar_recommendation} note="Unassigned or no recommendation yet" />
        <StatsCard label="Approver gaps" value={summary.awaiting_approver_assignment + summary.awaiting_approver_decision} note="Unassigned or no decision yet" />
      </section>

      <section className="panel section stack">
        <ApprovalBoardTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
