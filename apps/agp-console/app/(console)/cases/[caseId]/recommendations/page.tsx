import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseRecommendationForm } from "@/components/case-recommendation-form";
import { CaseRecommendationsTable } from "@/components/case-recommendations-table";
import { ConsoleShell } from "@/components/console-shell";
import { requireConsoleAccess } from "@/lib/console/access";
import { getRecommendationFormContext, listCaseRecommendations } from "@/lib/console/recommendations";
import { titleCase } from "@/lib/console/mappers";

export default async function CaseRecommendationsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const { caseId } = await params;

  const { caseSummary, assignmentId, assignmentRole } = await getRecommendationFormContext(caseId, user.id);
  if (!caseSummary) notFound();

  const rows = await listCaseRecommendations(caseId);

  return (
    <ConsoleShell
      title={`Recommendations — ${caseSummary.case_code}`}
      description="Reviewer and scholar recommendation register for this governance case."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="h2">Case summary</div>
        <div className="grid-3">
          <div>
            <div className="muted">Organisation</div>
            <div>{caseSummary.organization_name}</div>
          </div>
          <div>
            <div className="muted">Review type</div>
            <div>{titleCase(caseSummary.review_type.replaceAll("_", " "))}</div>
          </div>
          <div>
            <div className="muted">Priority</div>
            <div>{titleCase(caseSummary.priority)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn-secondary" href={`/cases/${caseId}`}>
            Open case
          </Link>
          <Link className="btn-secondary" href={`/cases/${caseId}/decision`}>
            Open decision workspace
          </Link>
          <Link className="btn-secondary" href="/my-reviews">
            Back to My Reviews
          </Link>
        </div>
      </section>

      <CaseRecommendationForm caseId={caseId} assignmentId={assignmentId} assignmentRole={assignmentRole} />
      <CaseRecommendationsTable rows={rows} />
    </ConsoleShell>
  );
}
