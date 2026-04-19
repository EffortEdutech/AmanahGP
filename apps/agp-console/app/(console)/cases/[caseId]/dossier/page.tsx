import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import {
  CaseDossierActions,
  CaseDossierAssignments,
  CaseDossierDecisions,
  CaseDossierEvidence,
  CaseDossierEvents,
  CaseDossierFindings,
  CaseDossierRecommendations,
  CaseDossierSnapshots,
  CaseDossierSummary,
  CaseDossierUpdates,
} from "@/components/case-dossier-sections";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCaseDossier } from "@/lib/console/case-dossier";

export default async function CaseDossierPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const { caseId } = await params;

  const dossier = await getCaseDossier(caseId);
  if (!dossier) notFound();

  return (
    <ConsoleShell
      title={`Case Dossier — ${dossier.caseSummary.case_code}`}
      description="Single review file for reviewers, scholars, and approvers before recommendation or decision."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      <CaseDossierSummary dossier={dossier} />
      <CaseDossierAssignments dossier={dossier} />
      <CaseDossierFindings dossier={dossier} />
      <CaseDossierEvidence dossier={dossier} />
      <CaseDossierRecommendations dossier={dossier} />
      <CaseDossierDecisions dossier={dossier} />
      <CaseDossierActions dossier={dossier} />
      <CaseDossierUpdates dossier={dossier} />
      <CaseDossierSnapshots dossier={dossier} />
      <CaseDossierEvents dossier={dossier} />
    </ConsoleShell>
  );
}
