import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { TrustEventQueueTable } from "@/components/trust-event-queue-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { getGovernanceEventIntakeSummary, listGovernanceEventIntake } from "@/lib/console/event-intake";

export default async function TrustEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string;
    status?: string;
    message?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [summary, rows] = await Promise.all([
    getGovernanceEventIntakeSummary({ organizationId: params.organizationId }),
    listGovernanceEventIntake({ organizationId: params.organizationId, status: params.status }),
  ]);

  return (
    <ConsoleShell
      title="Trust Event Intake"
      description="Mission-focused intake queue from canonical public.trust_events. Review-worthy AmanahOS and platform signals are routed here before reviewer, scholar, and approver action." 
      currentPath="/events"
      roles={roles}
      userEmail={user.email}
    >
      {params.message ? <div className="notice">{decodeURIComponent(params.message)}</div> : null}
      {params.error ? <div className="notice notice-warning">{decodeURIComponent(params.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="total intake" value={summary.total} note="All review-worthy trust events" />
        <StatsCard label="pending" value={summary.pending} note="Waiting for reviewer or approver action" />
        <StatsCard label="case opened" value={summary.case_opened} note="Already converted into governance cases" />
        <StatsCard label="ignored" value={summary.ignored} note="Explicitly dismissed from queue" />
        <StatsCard label="urgent + high" value={summary.urgent_high} note="Higher-risk events requiring closer attention" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Event queue</div>
            <p className="muted">This is the bridge between AmanahOS operational events and Console governance action.</p>
          </div>
        </div>

        <div className="notice">
          Only trust events covered by <code>public.governance_event_rules</code> enter this queue. That keeps Console focused on reviewer, scholar, and approver work.
        </div>

        {params.organizationId ? (
          <div className="notice">
            Filtered to one organisation. Remove the query string to see the full platform queue.
          </div>
        ) : null}

        <TrustEventQueueTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
