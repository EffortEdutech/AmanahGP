import { formatDateTime } from "@/lib/console/mappers";

export function AuditLogTable({ logs }: { logs: any[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Organisation</th>
            <th>Entity</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.occurred_at)}</td>
              <td>{log.action}</td>
              <td>{log.actor?.display_name || log.actor?.email || "—"}</td>
              <td>{log.organization?.legal_name || log.organization?.name || "—"}</td>
              <td>{[log.entity_table, log.entity_id].filter(Boolean).join(" / ") || "—"}</td>
              <td>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "#c7d6ea" }}>{JSON.stringify(log.metadata ?? {}, null, 2)}</pre>
              </td>
            </tr>
          ))}
          {logs.length === 0 ? <tr><td colSpan={6} className="muted">No audit logs found.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
