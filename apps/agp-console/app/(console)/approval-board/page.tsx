import Link from "next/link";
import { BookCheck, ClipboardCheck, Scale, ShieldCheck } from "lucide-react";
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
      description="Focused control page for scholar recommendation and final approval decisions before trust publication." 
      currentPath="/approval-board"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="pipeline cases" value={summary.total} note="Scholar and approver stage cases" />
        <StatsCard label="scholar stage" value={summary.scholar_stage} note="Needs scholarly recommendation flow" />
        <StatsCard label="approver stage" value={summary.approver_stage} note="Needs final decision flow" />
        <StatsCard label="overdue" value={summary.overdue} note="Requires immediate intervention" />
        <StatsCard label="scholar gaps" value={summary.awaiting_scholar_assignment + summary.awaiting_scholar_recommendation} note="Assignment or recommendation still missing" />
        <StatsCard label="approver gaps" value={summary.awaiting_approver_assignment + summary.awaiting_approver_decision} note="Assignment or decision still missing" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Why this page matters</div>
          <div className="muted">
            This board keeps AGP Console focused on the most sensitive governance step: moving from reviewer work into scholar recommendation and final approval without delay.
          </div>
        </div>

        <div className="panel section stack">
          <div className="h2">Open related workspaces</div>
          <div style={{ display: "grid", gap: 10 }}>
            <Link className="btn btn-secondary" href="/cases">
              <Scale size={16} />
              Open cases
            </Link>
            <Link className="btn btn-secondary" href="/review-workbench">
              <ClipboardCheck size={16} />
              Open review workbench
            </Link>
            <Link className="btn btn-secondary" href="/my-reviews">
              <BookCheck size={16} />
              Open my reviews
            </Link>
            <Link className="btn btn-secondary" href="/publication-command">
              <ShieldCheck size={16} />
              Open publication command
            </Link>
          </div>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Scholar and approver pipeline</div>
        <div className="muted">Open assignments, recommendations, decisions, and dossier views from one control table.</div>
        <ApprovalBoardTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
