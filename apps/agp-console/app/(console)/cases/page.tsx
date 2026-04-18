import Link from "next/link";
import { Gavel } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { GovernanceCaseTable } from "@/components/governance-case-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getGovernanceCaseSummary, listGovernanceReviewCases } from "@/lib/console/server";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [summary, cases] = await Promise.all([
    getGovernanceCaseSummary(),
    listGovernanceReviewCases({ organizationId: params.organizationId }),
  ]);

  return (
    <ConsoleShell
      title="Governance Review Cases"
      description="Mission-focused case management for reviewer, scholar, and approval workflows across canonical AGP organisations."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      {params.message ? <div className="notice">{decodeURIComponent(params.message)}</div> : null}
      {params.error ? <div className="notice notice-warning">{decodeURIComponent(params.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="total cases" value={summary.total} note="All governance review cases" />
        <StatsCard label="submitted" value={summary.submitted} note="Waiting for reviewer intake" />
        <StatsCard label="under review" value={summary.under_review} note="Reviewer work in progress" />
        <StatsCard label="scholar review" value={summary.scholar_review} note="Shariah and scholarly review" />
        <StatsCard label="approval pending" value={summary.approval_pending} note="Waiting for final decision" />
        <StatsCard label="approved" value={summary.approved} note="Closed with approval" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Case registry</div>
            <p className="muted">Each case represents a real governance review journey for an organisation.</p>
          </div>
          <Link className="btn btn-primary" href={params.organizationId ? `/cases/new?orgId=${params.organizationId}` : "/cases/new"}>
            <Gavel size={16} />
            Open new case
          </Link>
        </div>

        {params.organizationId ? (
          <div className="notice">
            Filtered to one organisation. Clear the query string in the URL to see all cases.
          </div>
        ) : null}

        <GovernanceCaseTable rows={cases} />
      </section>
    </ConsoleShell>
  );
}
