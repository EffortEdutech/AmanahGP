import { ConsoleShell } from "@/components/console-shell";
import { EndToEndGovernanceUatBoard } from "@/components/end-to-end-governance-uat-board";
import { requireConsoleAccess } from "@/lib/console/access";
import { getGovernanceUatSummary, listGovernanceUatRows } from "@/lib/console/governance-uat";

const WORKFLOW_STEPS = [
  "Organisation performs a governance-relevant action in AmanahOS.",
  "Trust event is written into public.trust_events and routed through public.governance_event_intake.",
  "AGP Console opens or links a governance review case.",
  "Reviewer investigates and submits recommendation.",
  "Scholar and approver complete the decision path.",
  "Trust snapshot is created or updated.",
  "Publication control makes the result donor-facing.",
] as const;

function SummaryCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <section className="panel section stack">
      <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div className="muted" style={{ fontSize: 12 }}>{note}</div>
    </section>
  );
}

export default async function EndToEndGovernanceUatPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([listGovernanceUatRows(100), getGovernanceUatSummary()]);

  return (
    <ConsoleShell
      title="End-to-End Governance UAT"
      description="Validate the mission flow from AmanahOS action to donor-facing publication using canonical AGP tables only."
      currentPath="/e2e-governance-uat"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <SummaryCard label="tracked rows" value={summary.total_rows} note="Governance events already routed into console intake" />
        <SummaryCard label="cases opened" value={summary.cases_opened} note="Events that now have linked governance cases" />
        <SummaryCard label="reviewer done" value={summary.reviewer_completed} note="Cases that already passed reviewer handling" />
        <SummaryCard label="scholar done" value={summary.scholar_completed} note="Cases that already passed scholar handling" />
        <SummaryCard label="decisions" value={summary.decisions_recorded} note="Cases with recorded approval outcome" />
        <SummaryCard label="donor-facing" value={summary.donor_facing} note="Rows already published through trust snapshot output" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Target mission flow</div>
            <p className="muted">Use this page while testing AGP across AmanahOS, AGP Console, and donor-facing publication readiness.</p>
          </div>
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            <span className="badge badge-amber">Waiting reviewer: {summary.waiting_reviewer}</span>
            <span className="badge badge-blue">Waiting scholar: {summary.waiting_scholar}</span>
            <span className="badge badge-purple">Waiting decision: {summary.waiting_decision}</span>
            <span className="badge badge-neutral">Waiting publication: {summary.waiting_publication}</span>
          </div>
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
          {WORKFLOW_STEPS.map((step) => (
            <li key={step} className="muted">{step}</li>
          ))}
        </ol>
      </section>

      <EndToEndGovernanceUatBoard rows={rows} />
    </ConsoleShell>
  );
}
