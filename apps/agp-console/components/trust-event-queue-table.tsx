import Link from "next/link";
import { openCaseFromEventAction, ignoreEventIntakeAction } from "@/app/(console)/events/actions";
import type { GovernanceEventIntakeRow } from "@/lib/console/event-intake";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

function payloadPreview(payload: Record<string, unknown> | null) {
  if (!payload || Object.keys(payload).length === 0) return "—";

  const text = JSON.stringify(payload);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

function eventLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TrustEventQueueTable({ rows }: { rows: GovernanceEventIntakeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="h3">No intake rows yet</div>
        <p className="muted">When AmanahOS or the platform writes review-worthy trust events, they will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Occurred</th>
            <th>Organisation</th>
            <th>Event</th>
            <th>Routing</th>
            <th>Payload</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const orgName = row.organization?.name || row.organization?.legal_name || row.organization_id;
            const canOpenCase = row.intake_status === "pending" && !row.linked_case_id;

            return (
              <tr key={row.id}>
                <td>
                  <div>{formatDateTime(row.occurred_at)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.source}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{orgName}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.organization?.registration_no ?? row.organization_id}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{eventLabel(row.event_type)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {row.pillar ? titleCase(row.pillar.replaceAll("_", " ")) : "No pillar"}
                  </div>
                  {row.event_ref_table ? (
                    <div className="muted" style={{ fontSize: 12 }}>Ref: {row.event_ref_table}</div>
                  ) : null}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{eventLabel(row.routing_mode)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Case: {eventLabel(row.suggested_case_type)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Priority: {eventLabel(row.suggested_priority)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Assign: {eventLabel(row.suggested_assignment_role)}</div>
                </td>
                <td>
                  <div style={{ maxWidth: 280, whiteSpace: "normal", wordBreak: "break-word", fontSize: 12, color: "#475569" }}>{payloadPreview(row.payload)}</div>
                </td>
                <td>
                  <span className={statusBadgeClass(row.intake_status)}>{eventLabel(row.intake_status)}</span>
                  {row.linked_case ? (
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      Linked: {row.linked_case.case_code}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div style={{ display: "grid", gap: 8 }}>
                    {row.linked_case ? (
                      <Link className="btn btn-secondary" href={`/cases/${row.linked_case.id}`}>
                        Open case
                      </Link>
                    ) : canOpenCase ? (
                      <form action={openCaseFromEventAction}>
                        <input type="hidden" name="intake_id" value={row.id} />
                        <button className="btn btn-primary" type="submit">
                          Open case
                        </button>
                      </form>
                    ) : null}

                    {row.intake_status === "pending" ? (
                      <form action={ignoreEventIntakeAction}>
                        <input type="hidden" name="intake_id" value={row.id} />
                        <button className="btn btn-secondary" type="submit">
                          Ignore
                        </button>
                      </form>
                    ) : null}

                    <Link className="btn btn-secondary" href={`/organisations/${row.organization_id}`}>
                      Organisation
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
