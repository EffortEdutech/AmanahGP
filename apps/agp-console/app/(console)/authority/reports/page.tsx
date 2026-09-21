import Link from "next/link";
import { Banknote, Download, FileSearch, Landmark, LifeBuoy, MessageSquareQuote, Scale, TrendingUp } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityStateReportPacks, getAuthorityStateReportSummary } from "@/lib/console/authority-report-packs";
import { getPilotKpiSummary, listPilotFeedback, listPilotKpiSnapshots, listPilotSupportIncidents } from "@/lib/console/authority-telemetry";
import { formatDateTime, formatMoney, titleCase } from "@/lib/console/mappers";

function periodLabel(year: number, month: number | null) {
  if (!month) return `${year} full year`;
  return new Intl.DateTimeFormat("en-MY", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function reconcileStatus(pack: { net_movement: number; total_receipts: number; total_expenditure: number }) {
  return pack.net_movement === pack.total_receipts - pack.total_expenditure ? "pass" : "fail";
}

export default async function AuthorityReportsPage() {
  const { user, roles } = await requireConsoleAccess("authority.reports.export");
  const [summary, packs, kpiSummary, kpiSnapshots, feedback, supportIncidents] = await Promise.all([
    getAuthorityStateReportSummary(),
    listAuthorityStateReportPacks({ limit: 100 }),
    getPilotKpiSummary(),
    listPilotKpiSnapshots({ limit: 20 }),
    listPilotFeedback({ limit: 10 }),
    listPilotSupportIncidents({ limit: 10 }),
  ]);

  return (
    <ConsoleShell title="Reports / Exports" description="Authority state reporting packs and pilot KPI telemetry with summary-only data boundaries." currentPath="/authority/reports" roles={roles} userEmail={user.email}>
      <section className="grid-cards">
        <StatsCard label="Report packs" value={summary.total_packs} note="Generated state packs" accent="blue" />
        <StatsCard label="Receipts" value={formatMoney(summary.total_receipts)} note="Summary receipts" accent="green" />
        <StatsCard label="Expenditure" value={formatMoney(summary.total_expenditure)} note="Summary expenditure" accent="amber" />
        <StatsCard label="Net movement" value={formatMoney(summary.net_movement)} note="Receipts less expenditure" accent="purple" />
        <StatsCard label="Discrepancy packs" value={summary.discrepancy_packs} note="Bank discrepancy signals" accent={summary.discrepancy_packs ? "amber" : "green"} />
        <StatsCard label="Evidence links" value={summary.evidence_links} note="Evidence index entries" accent="blue" />
      </section>

      <section className="grid-cards">
        <StatsCard label="KPI snapshots" value={kpiSummary.snapshots} note="Pilot KPI report periods" accent="blue" />
        <StatsCard label="Active pilot orgs" value={kpiSummary.organizations_active} note="Latest KPI snapshot" accent="green" />
        <StatsCard label="Late submissions" value={kpiSummary.submissions_late_or_overdue} note={`${kpiSummary.submissions_total} total submissions`} accent={kpiSummary.submissions_late_or_overdue ? "amber" : "green"} />
        <StatsCard label="Support open" value={kpiSummary.support_open} note="Pilot support incidents" accent={kpiSummary.support_open ? "amber" : "green"} />
        <StatsCard label="Feedback rating" value={kpiSummary.feedback_average_rating ?? "-"} note="Average 1-5 rating" accent="purple" />
        <StatsCard label="High exceptions" value={kpiSummary.exceptions_high_critical} note="Latest KPI snapshot" accent={kpiSummary.exceptions_high_critical ? "amber" : "green"} />
      </section>

      <section className="grid-cards">
        <div className="panel section stack"><Banknote size={18} /><div className="h2">Monthly receipts / expenditure</div><div className="muted">Generated from period-close totals, not raw journal lines.</div></div>
        <div className="panel section stack"><Landmark size={18} /><div className="h2">Bank reconciliation summary</div><div className="muted">Counts reconciled accounts, discrepancies, and aggregate differences.</div></div>
        <div className="panel section stack"><Scale size={18} /><div className="h2">Fund balance summary</div><div className="muted">Uses period-close fund balance snapshots.</div></div>
        <div className="panel section stack"><FileSearch size={18} /><div className="h2">Evidence index</div><div className="muted">Uses explicit authority evidence links from Phase 7.</div></div>
        <div className="panel section stack"><TrendingUp size={18} /><div className="h2">Pilot KPI report</div><div className="muted">Cohort-level adoption, reporting, evidence, exception, support, and feedback metrics.</div></div>
        <div className="panel section stack"><MessageSquareQuote size={18} /><div className="h2">Pilot feedback</div><div className="muted">Structured feedback from organisations, authority users, reviewers, and platform teams.</div></div>
        <div className="panel section stack"><LifeBuoy size={18} /><div className="h2">Support incidents</div><div className="muted">Training needs, bugs, access issues, and support requests for rollout health.</div></div>
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div><div className="h2">State report packs</div><div className="muted">Summary reports for MAIN/JAIN review. Source private accounting tables remain protected by their own RLS.</div></div>
          <span className="badge badge-neutral">{packs.length} packs</span>
        </div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Report</th><th>Organisation</th><th>Period</th><th>Receipts</th><th>Expenditure</th><th>Fund balance</th><th>Bank</th><th>Exceptions</th><th>Evidence</th><th>Check</th></tr></thead><tbody>
          {packs.map((pack) => <tr key={pack.id}><td><div style={{ fontWeight: 800 }}>{pack.report_ref}</div><div className="muted">{titleCase(pack.report_type)} / {titleCase(pack.status)}</div></td><td>{pack.organization_name ?? pack.organization_id}</td><td>{periodLabel(pack.period_year, pack.period_month)}</td><td>{formatMoney(pack.total_receipts, pack.currency)}</td><td>{formatMoney(pack.total_expenditure, pack.currency)}</td><td>{formatMoney(pack.fund_balance_total, pack.currency)}</td><td>{pack.bank_accounts_reconciled}/{pack.bank_accounts_total} reconciled<br /><span className="muted">Diff {formatMoney(pack.bank_difference_total, pack.currency)}</span></td><td>{pack.exception_total} total<br /><span className="muted">{pack.exception_high_critical} high/critical</span></td><td>{pack.evidence_link_total} links<br /><span className="muted">{pack.evidence_reviewable_total} reviewable</span></td><td><AuthorityBadge value={reconcileStatus(pack)} /></td></tr>)}
          {packs.length === 0 ? <tr><td colSpan={10}><EmptyAuthorityState label="state report packs" /></td></tr> : null}
        </tbody></table></div>
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div><div className="h2">Pilot KPI snapshots</div><div className="muted">Generated KPI reports for scoped pilot cohorts.</div></div>
          <span className="badge badge-neutral">{kpiSnapshots.length} snapshots</span>
        </div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Snapshot</th><th>Cohort</th><th>Period</th><th>Organisations</th><th>Submissions</th><th>Exceptions</th><th>Support</th><th>Feedback</th><th>Generated</th></tr></thead><tbody>
          {kpiSnapshots.map((snapshot) => <tr key={snapshot.id}><td><div style={{ fontWeight: 800 }}>{snapshot.snapshot_ref}</div><div className="muted">{titleCase(snapshot.status)}</div></td><td>{snapshot.pilot_cohort_name ?? snapshot.pilot_cohort_id}</td><td>{snapshot.period_start} to {snapshot.period_end}</td><td>{snapshot.organizations_active}/{snapshot.organizations_total} active</td><td>{snapshot.submissions_accepted}/{snapshot.submissions_total} accepted<br /><span className="muted">{snapshot.submissions_late_or_overdue} late/overdue</span></td><td>{snapshot.exceptions_high_critical}/{snapshot.exceptions_total} high</td><td>{snapshot.support_incidents_open}/{snapshot.support_incidents_total} open</td><td>{snapshot.feedback_average_rating ?? "-"} avg<br /><span className="muted">{snapshot.feedback_total} responses</span></td><td>{formatDateTime(snapshot.generated_at)}</td></tr>)}
          {kpiSnapshots.length === 0 ? <tr><td colSpan={9}><EmptyAuthorityState label="pilot KPI snapshots" /></td></tr> : null}
        </tbody></table></div>
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="row-between"><div><div className="h2">Recent feedback</div><div className="muted">Pilot experience signals.</div></div><span className="badge badge-neutral">{feedback.length}</span></div>
          {feedback.length === 0 ? <EmptyAuthorityState label="pilot feedback" /> : null}
          {feedback.map((item) => <div className="panel-soft stack" key={item.id}><div className="row-between"><strong>{item.title}</strong><AuthorityBadge value={item.sentiment} /></div><div className="muted">{titleCase(item.feedback_type)} / {item.rating ? `${item.rating}/5` : "No rating"} / {item.organization_name ?? "Cohort"}</div></div>)}
        </div>
        <div className="panel section stack">
          <div className="row-between"><div><div className="h2">Support incidents</div><div className="muted">Open and recently resolved rollout support items.</div></div><span className="badge badge-neutral">{supportIncidents.length}</span></div>
          {supportIncidents.length === 0 ? <EmptyAuthorityState label="support incidents" /> : null}
          {supportIncidents.map((item) => <div className="panel-soft stack" key={item.id}><div className="row-between"><strong>{item.incident_ref}</strong><AuthorityBadge value={item.status} /></div><div>{item.title}</div><div className="muted">{titleCase(item.incident_type)} / {titleCase(item.severity)} / {item.organization_name ?? "Cohort"}</div></div>)}
        </div>
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div><div className="h2">Export readiness</div><div className="muted">The Phase 10 KPI report is ready for export wiring; downloadable files can be added after pilot fixture data is seeded.</div></div>
          <Link className="btn btn-secondary" href="/authority/evidence"><Download size={15} />Open evidence index</Link>
        </div>
        <div className="notice notice-warning">Authority report packs and pilot KPIs are summary-only. They do not grant authority users direct access to private ledgers, bank accounts, payment requests, source documents, or raw evidence files.</div>
      </section>
    </ConsoleShell>
  );
}
