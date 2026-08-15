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
      <section className="panel section stack">
        <div className="h2">Live counts</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginTop: 4 }}>
          {[
            { label: "Organisations", value: summary.organizations },
            { label: "Cases", value: summary.cases },
            { label: "Review alerts", value: summary.reviewAlerts },
            { label: "Snapshots", value: summary.currentSnapshots },
            { label: "Open clarifications", value: summary.clarificationsOpen },
            { label: "Billing plans", value: summary.plans },
            { label: "Platform roles", value: summary.platformRoles },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{label}</div>
            </div>
          ))}
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
                    <Link className="btn btn-secondary btn-sm" href={item.href}>Open →</Link>
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
