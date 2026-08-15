import Link from "next/link";
import { openCaseFromEventAction, ignoreEventIntakeAction } from "@/app/(console)/events/actions";
import type { GovernanceEventIntakeRow } from "@/lib/console/event-intake";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

function eventLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TrustEventQueueTable({ rows }: { rows: GovernanceEventIntakeRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="notice">
        No intake events yet. Review-worthy signals from AmanahOS will appear here automatically.
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const orgName = row.organization?.name || row.organization?.legal_name || row.organization_id;
            const canOpenCase = row.intake_status === "pending" && !row.linked_case_id;

            return (
              <tr key={row.id}>
                <td>
                  <div style={{ fontSize: 13 }}>{formatDateTime(row.occurred_at)}</div>
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
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{eventLabel(row.routing_mode)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{eventLabel(row.suggested_case_type)} · {eventLabel(row.suggested_priority)} · {eventLabel(row.suggested_assignment_role)}</div>
                </td>
                <td>
                  <span className={statusBadgeClass(row.intake_status)}>{eventLabel(row.intake_status)}</span>
                  {row.linked_case ? (
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>→ {row.linked_case.case_code}</div>
                  ) : null}
                </td>
                <td>
                  <details className="action-menu">
                    <summary className="btn btn-secondary btn-sm">Actions ▾</summary>
                    <div className="action-menu__dropdown">
                      {row.linked_case ? (
                        <Link className="action-menu__item action-menu__item--primary" href={`/cases/${row.linked_case.id}`}>Open case</Link>
                      ) : canOpenCase ? (
                        <form action={openCaseFromEventAction} style={{ display: "contents" }}>
                          <input type="hidden" name="intake_id" value={row.id} />
                          <button className="action-menu__item action-menu__item--primary" type="submit">Open case</button>
                        </form>
                      ) : null}
                      <Link className="action-menu__item" href={`/organisations/${row.organization_id}`}>Organisation</Link>
                      {row.intake_status === "pending" ? (
                        <form action={ignoreEventIntakeAction} style={{ display: "contents" }}>
                          <input type="hidden" name="intake_id" value={row.id} />
                          <button className="action-menu__item action-menu__item--muted" type="submit">Ignore</button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
