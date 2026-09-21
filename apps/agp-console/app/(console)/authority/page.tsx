import Link from "next/link";
import { AlertTriangle, BookOpen, ClipboardList, FileSearch, Gavel, ShieldCheck } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { AuthorityScreenGrid } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { getAuthorityEvidenceSummary } from "@/lib/console/authority-evidence";
import { getAuthorityExceptionSummary } from "@/lib/console/authority-exceptions";
import { getAuthorityObligationSummary } from "@/lib/console/authority-obligations";
import { getAuthorityApprovalSummary } from "@/lib/console/authority-approvals";
import { getRegulatorySubmissionSummary } from "@/lib/console/authority-submissions";

export default async function AuthorityDashboardPage() {
  const { user, roles } = await requireConsoleAccess("authority.dashboard.read");
  const [submissions, obligations, exceptions, approvals, evidence] = await Promise.all([
    getRegulatorySubmissionSummary(),
    getAuthorityObligationSummary(),
    getAuthorityExceptionSummary(),
    getAuthorityApprovalSummary(),
    getAuthorityEvidenceSummary(),
  ]);

  return (
    <ConsoleShell
      title="Authority View"
      description="MAIN/JAIN oversight workspace inside AGP Console, with explicit evidence and data boundaries."
      currentPath="/authority"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="Submissions" value={submissions.total} note={`${submissions.late_or_overdue} late or overdue`} accent="blue" />
        <StatsCard label="Obligations" value={obligations.total} note={`${obligations.overdue} overdue`} accent={obligations.overdue ? "amber" : "green"} />
        <StatsCard label="Exceptions" value={exceptions.total} note={`${exceptions.high_critical} high or critical`} accent={exceptions.high_critical ? "amber" : "green"} />
        <StatsCard label="Approvals" value={approvals.total} note={`${approvals.pending_approval} pending approval`} accent="purple" />
        <StatsCard label="Evidence links" value={evidence.total} note={`${evidence.reviewable} authority-reviewable`} accent="blue" />
        <StatsCard label="Private evidence" value={evidence.private_hidden} note="Hidden unless org/internal scoped" accent="green" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Operational monitors</div>
          <Link className="btn btn-secondary" href="/authority/submissions"><ClipboardList size={16} />Submissions</Link>
          <Link className="btn btn-secondary" href="/authority/obligations"><BookOpen size={16} />Obligations</Link>
          <Link className="btn btn-secondary" href="/authority/exceptions"><AlertTriangle size={16} />Exceptions</Link>
        </div>
        <div className="panel section stack">
          <div className="h2">Review workspace</div>
          <Link className="btn btn-secondary" href="/authority/cases"><Gavel size={16} />Governance cases</Link>
          <Link className="btn btn-secondary" href="/authority/evidence"><FileSearch size={16} />Evidence viewer</Link>
          <Link className="btn btn-secondary" href="/authority/policy"><ShieldCheck size={16} />Policy & jurisdiction</Link>
        </div>
      </section>

      <AuthorityScreenGrid current="AV-01" />
    </ConsoleShell>
  );
}
