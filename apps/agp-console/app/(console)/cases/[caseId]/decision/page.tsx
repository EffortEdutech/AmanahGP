import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseDecisionForm } from "@/components/case-decision-form";
import { CaseDecisionHistoryTable } from "@/components/case-decision-history-table";
import { ConsoleShell } from "@/components/console-shell";
import { requireConsoleAccess } from "@/lib/console/access";
import { getDecisionWorkspaceContext, listCaseDecisions } from "@/lib/console/decisions";
import { titleCase } from "@/lib/console/mappers";

export default async function CaseDecisionWorkspacePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { user, roles } = await requireConsoleAccess("cases.write");
  const { caseId } = await params;

  const context = await getDecisionWorkspaceContext(caseId, user.id);
  if (!context) notFound();

  const decisions = await listCaseDecisions(caseId);

  return (
    <ConsoleShell
      title={`Decision Workspace — ${context.caseCode}`}
      description="Formal reviewer, scholar, and approver decision entry for this governance case."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="h2">Case summary</div>
        <div className="grid-3">
          <div>
            <div className="muted">Organisation</div>
            <div>{context.organizationName}</div>
          </div>
          <div>
            <div className="muted">Review type</div>
            <div>{titleCase(context.reviewType.replaceAll("_", " "))}</div>
          </div>
          <div>
            <div className="muted">Current case status</div>
            <div>{titleCase(context.caseStatus.replaceAll("_", " "))}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn-secondary" href={`/cases/${caseId}`}>
            Open case
          </Link>
          <Link className="btn-secondary" href={`/cases/${caseId}/recommendations`}>
            Open recommendations
          </Link>
          <Link className="btn-secondary" href="/review-workbench">
            Back to Review Workbench
          </Link>
        </div>
      </section>

      <CaseDecisionForm caseId={caseId} assignmentRole={context.assignmentRole} />
      <CaseDecisionHistoryTable rows={decisions} />
    </ConsoleShell>
  );
}
