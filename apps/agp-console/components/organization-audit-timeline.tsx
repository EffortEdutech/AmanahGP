import { formatDateTime, titleCase } from "@/lib/console/mappers";

export function OrganizationAuditTimeline({ logs }: { logs: any[] }) {
  return (
    <div className="stack">
      {logs.length === 0 ? <div className="muted">No recent audit records for this organisation yet.</div> : null}
      {logs.map((log) => {
        const actorName = log.actor?.display_name || log.actor?.email || log.actor_role || "System";
        const note = log.metadata?.note;
        return (
          <div key={log.id} className="panel-soft section stack">
            <div className="row-between">
              <div className="h2" style={{ fontSize: 14 }}>{titleCase(String(log.action).replaceAll(".", " ").replaceAll("_", " "))}</div>
              <div className="muted">{formatDateTime(log.occurred_at)}</div>
            </div>
            <div className="muted">Actor: {actorName}</div>
            <div className="muted">Entity: {log.entity_table || "—"}</div>
            {note ? <div className="notice">{note}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
