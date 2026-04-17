import { ConsoleShell } from "@/components/console-shell";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDateTime } from "@/lib/console/mappers";
import { listAuditLogs } from "@/lib/console/server";

export default async function AuditPage() {
  const { user, roles } = await requireConsoleAccess("audit.read");
  const logs = await listAuditLogs(100);

  return (
    <ConsoleShell
      title="Audit Log"
      description="Recent platform actions from public.audit_logs for compliance and governance review."
      currentPath="/audit"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="h2">Recent activity</div>
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
              {logs.map((log: any) => (
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
              {logs.length === 0 ? <tr><td colSpan={6} className="muted">No audit logs yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
