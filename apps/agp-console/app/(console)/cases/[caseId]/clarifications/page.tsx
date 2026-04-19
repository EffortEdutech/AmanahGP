import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { ClarificationQueueTable } from "@/components/clarification-queue-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { getGovernanceCaseSummary } from "@/lib/console/case-assignments";
import { listCaseClarifications } from "@/lib/console/case-clarifications";

export default async function CaseClarificationsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { user, roles } = await requireConsoleAccess("cases.read");

  const [caseSummary, rows] = await Promise.all([
    getGovernanceCaseSummary(caseId),
    listCaseClarifications(caseId),
  ]);

  if (!caseSummary) {
    notFound();
  }

  return (
    <ConsoleShell
      title="Case Clarifications"
      description={`Organisation clarification thread for ${caseSummary.case_code}.`}
      currentPath="/clarifications"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">{caseSummary.case_code}</div>
            <p className="muted">{caseSummary.organization_name} · {caseSummary.status}</p>
          </div>
        </div>
      </section>

      <ClarificationQueueTable rows={rows} title="Clarification thread for this case" />
    </ConsoleShell>
  );
}
