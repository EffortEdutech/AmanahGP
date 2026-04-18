import { ConsoleShell } from "@/components/console-shell";
import { ReviewWorkbenchTable } from "@/components/review-workbench-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import {
  getReviewWorkbenchSummary,
  listMyReviewWorkbenchRows,
  listReviewWorkbenchRows,
} from "@/lib/console/review-workbench";

export default async function ReviewWorkbenchPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [allRows, myRows, summary] = await Promise.all([
    listReviewWorkbenchRows(),
    listMyReviewWorkbenchRows(user.id),
    getReviewWorkbenchSummary(user.id),
  ]);

  return (
    <ConsoleShell
      title="Review Workbench"
      description="Operational queue for reviewer, scholar, and approver work so the governance team can clear cases efficiently."
      currentPath="/review-workbench"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="active cases" value={summary.total_active} note="All active governance cases" />
        <StatsCard label="my queue" value={summary.total_mine} note="Cases assigned to me" />
        <StatsCard label="my overdue" value={summary.overdue_mine} note="My cases past due" />
        <StatsCard label="reviewer" value={summary.reviewer_stage} note="Cases in reviewer stage" />
        <StatsCard label="scholar" value={summary.scholar_stage} note="Cases in scholar stage" />
        <StatsCard label="approver" value={summary.approver_stage} note="Cases in approval stage" />
      </section>

      <ReviewWorkbenchTable rows={myRows} currentUserId={user.id} title="My assigned queue" />
      <ReviewWorkbenchTable rows={allRows} currentUserId={user.id} title="All active governance cases" />
    </ConsoleShell>
  );
}
