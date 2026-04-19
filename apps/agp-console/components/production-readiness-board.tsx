import Link from "next/link";
import type { ProductionReadinessSummary } from "@/lib/console/production-readiness";

export function ProductionReadinessBoard({
  summary,
  flow,
  checklist,
}: {
  summary: ProductionReadinessSummary;
  flow: ReadonlyArray<{ label: string; href: string; purpose: string }>;
  checklist: ReadonlyArray<string>;
}) {
  return (
    <>
      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Navigation lock</div>
          <div className="muted">Final sidebar routes are now treated as the locked operating map for AGP Console.</div>
          <div className="notice">Goal: every important page is reachable from the UI without typing URLs manually.</div>
        </div>

        <div className="panel section stack">
          <div className="h2">Production signal</div>
          <div className="muted">Use the live counts below to confirm the canonical console is connected to the expected database objects.</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
            <li>Organisations: {summary.organizations}</li>
            <li>Cases: {summary.cases}</li>
            <li>Review alerts: {summary.reviewAlerts}</li>
            <li>Current snapshots: {summary.currentSnapshots}</li>
            <li>Open clarifications: {summary.clarificationsOpen}</li>
            <li>Billing plans: {summary.plans}</li>
            <li>Platform roles: {summary.platformRoles}</li>
          </ul>
        </div>
      </section>

      {summary.issues.length > 0 ? (
        <section className="panel section stack">
          <div className="h2">Database / RLS issues detected</div>
          <div className="notice">
            Production Readiness stayed open, but some metrics could not be queried. Fix the items below one by one.
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569' }}>
            {summary.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel section stack">
        <div className="h2">Critical route flow</div>
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Route</th>
                <th>Purpose</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {flow.map((item) => (
                <tr key={item.href}>
                  <td style={{ fontWeight: 600 }}>{item.label}</td>
                  <td><code>{item.href}</code></td>
                  <td>{item.purpose}</td>
                  <td>
                    <Link className="btn btn-secondary" href={item.href}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Final UAT checklist</div>
        <div className="stack">
          {checklist.map((item) => (
            <label key={item} className="row" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
