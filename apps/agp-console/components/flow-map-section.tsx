import Link from "next/link";
import type { ConsoleFlowSection } from "@/lib/console/flow-map";

export function FlowMapSection({ section }: { section: ConsoleFlowSection }) {
  return (
    <section className="panel section stack">
      <div>
        <div className="h2">{section.title}</div>
        <div className="muted">{section.description}</div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>How to reach it in UI</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {section.entries.map((entry) => (
              <tr key={`${section.title}-${entry.href}-${entry.label}`}>
                <td>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div>{entry.label}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{entry.href}</div>
                  </div>
                </td>
                <td>{entry.note}</td>
                <td>
                  <Link className="btn-secondary" href={entry.href}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
