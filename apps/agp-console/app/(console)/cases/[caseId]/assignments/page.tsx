import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { CaseAssignmentBoard } from "@/components/case-assignment-board";
import { requireConsoleAccess } from "@/lib/console/access";
import {
  getGovernanceCaseSummary,
  listAssignableUsers,
  listCaseAssignments,
} from "@/lib/console/case-assignments";

export default async function CaseAssignmentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { user, roles } = await requireConsoleAccess("cases.read");

  const [caseSummary, assignments, reviewerUsers, scholarUsers, approverUsers] = await Promise.all([
    getGovernanceCaseSummary(caseId),
    listCaseAssignments(caseId),
    listAssignableUsers("reviewer"),
    listAssignableUsers("scholar"),
    listAssignableUsers("approver"),
  ]);

  if (!caseSummary) {
    notFound();
  }

  return (
    <ConsoleShell
      title="Case Assignments"
      description="Assign reviewer, scholar, and approver responsibility for a governance review case."
      currentPath="/review-workbench"
      roles={roles}
      userEmail={user.email}
    >
      <CaseAssignmentBoard
        caseSummary={caseSummary}
        assignments={assignments}
        reviewerUsers={reviewerUsers}
        scholarUsers={scholarUsers}
        approverUsers={approverUsers}
      />
    </ConsoleShell>
  );
}
