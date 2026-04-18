import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { VerificationQueueTable } from "@/components/verification-queue-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { getComplianceSummary, listVerificationQueue } from "@/lib/console/server";

export default async function ReviewsPage() {
  const { user, roles } = await requireConsoleAccess("audit.read");
  const [summary, rows] = await Promise.all([getComplianceSummary(), listVerificationQueue()]);

  return (
    <ConsoleShell
      title="Verification Queue"
      description="Manual review queue for organisations needing onboarding verification, compliance follow-up, suspension review, or governance intervention."
      currentPath="/reviews"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="queue size" value={rows.length} note="Organisations needing review" />
        <StatsCard label="danger" value={rows.filter((row) => row.risk_level === "danger").length} note="Immediate attention" />
        <StatsCard label="warning" value={rows.filter((row) => row.risk_level === "warning").length} note="Follow-up needed" />
        <StatsCard label="approved" value={summary.approved} note="Approved onboarding overall" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">How to use</div>
          <div className="muted">Open an organisation, review the compliance panel, add an internal note, and take lifecycle action where needed.</div>
          <div className="row">
            <Link className="btn btn-secondary" href="/compliance">
              <ClipboardCheck size={16} />
              Open Compliance Center
            </Link>
          </div>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Manual review queue</div>
        <VerificationQueueTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
