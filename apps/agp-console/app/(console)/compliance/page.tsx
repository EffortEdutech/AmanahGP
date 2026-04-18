import { ConsoleShell } from "@/components/console-shell";
import { ComplianceOrganizationsTable } from "@/components/compliance-organizations-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getComplianceSummary, listComplianceOrganizations } from "@/lib/console/server";

export default async function CompliancePage() {
  const { user, roles } = await requireConsoleAccess("audit.read");
  const [summary, rows] = await Promise.all([getComplianceSummary(), listComplianceOrganizations()]);

  const orderedRows = [...rows].sort((a, b) => {
    const weight = { danger: 3, warning: 2, good: 1 } as const;
    const riskDiff = weight[b.risk_level] - weight[a.risk_level];
    if (riskDiff !== 0) return riskDiff;
    return new Date(b.last_activity_at ?? 0).getTime() - new Date(a.last_activity_at ?? 0).getTime();
  });

  return (
    <ConsoleShell
      title="Compliance Center"
      description="Console-wide compliance view across organisation lifecycle, membership readiness, app enablement, billing health, and operational follow-up."
      currentPath="/compliance"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="organisations" value={summary.total} note="Total organisations evaluated" />
        <StatsCard label="good" value={summary.good} note="No current flags detected" />
        <StatsCard label="warning" value={summary.warning} note="Needs review or follow-up" />
        <StatsCard label="danger" value={summary.danger} note="High-priority intervention needed" />
        <StatsCard label="approved" value={summary.approved} note="Onboarding approved" />
        <StatsCard label="listed" value={summary.listed} note="Publicly listed organisations" />
      </section>

      <section className="panel section stack">
        <div className="h2">Organisation compliance matrix</div>
        <div className="muted">Rows are sorted by risk level first, then most recent activity.</div>
        <ComplianceOrganizationsTable rows={orderedRows} />
      </section>
    </ConsoleShell>
  );
}
