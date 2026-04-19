import { ConsoleShell } from "@/components/console-shell";
import { ClarificationQueueTable } from "@/components/clarification-queue-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getClarificationSummary, listClarificationQueue } from "@/lib/console/case-clarifications";

export default async function ClarificationsPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [summary, rows] = await Promise.all([getClarificationSummary(), listClarificationQueue(200)]);

  return (
    <ConsoleShell
      title="Organisation Clarifications"
      description="Queue for organisation explanations, rebuttals, additional evidence, and remediation responses submitted into governance cases."
      currentPath="/clarifications"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="total" value={summary.total} note="All clarification records" />
        <StatsCard label="submitted" value={summary.submitted} note="Waiting for console review" />
        <StatsCard label="under review" value={summary.under_review} note="Actively assessed by console" />
        <StatsCard label="accepted" value={summary.accepted} note="Accepted organisation responses" />
        <StatsCard label="needs more info" value={summary.needs_more_info} note="Clarification not yet sufficient" />
        <StatsCard label="rejected" value={summary.rejected} note="Rejected responses" />
      </section>

      <ClarificationQueueTable rows={rows} title="All organisation clarification submissions" />
    </ConsoleShell>
  );
}
