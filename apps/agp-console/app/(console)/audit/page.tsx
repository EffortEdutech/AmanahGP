import { ConsoleShell } from "@/components/console-shell";
import { AuditLogTable } from "@/components/audit-log-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuditLogs } from "@/lib/console/server";

const ENTITY_TABLE_OPTIONS = [
  "organizations",
  "org_members",
  "org_invitations",
  "app_installations",
  "organization_subscriptions",
  "organization_billing_records",
  "billing_plans",
  "platform_user_roles",
];

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity_table?: string; organization_id?: string }>;
}) {
  const { user, roles } = await requireConsoleAccess("audit.read");
  const params = await searchParams;
  const logs = await listAuditLogs(100, {
    q: params.q,
    entityTable: params.entity_table,
    organizationId: params.organization_id,
  });

  const summary = {
    total: logs.length,
    organizations: logs.filter((log: any) => log.entity_table === "organizations").length,
    memberships: logs.filter((log: any) => ["org_members", "org_invitations"].includes(log.entity_table)).length,
    billing: logs.filter((log: any) => ["organization_subscriptions", "organization_billing_records", "billing_plans"].includes(log.entity_table)).length,
  };

  return (
    <ConsoleShell
      title="Audit Log"
      description="Recent platform actions from public.audit_logs for compliance, regulator review, and operational governance."
      currentPath="/audit"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="loaded logs" value={summary.total} note="Last 100 matching audit records" />
        <StatsCard label="organisation events" value={summary.organizations} note="Lifecycle and profile changes" />
        <StatsCard label="member events" value={summary.memberships} note="Invites, accepts, and membership updates" />
        <StatsCard label="billing events" value={summary.billing} note="Plans, subscriptions, and invoice actions" />
      </section>

      <section className="panel section stack">
        <div className="h2">Filter audit records</div>
        <form className="form-grid" method="get">
          <div className="field">
            <label htmlFor="q">Action contains</label>
            <input className="input" id="q" name="q" defaultValue={params.q ?? ""} placeholder="invite, update, suspend" />
          </div>
          <div className="field">
            <label htmlFor="entity_table">Entity table</label>
            <select className="select" id="entity_table" name="entity_table" defaultValue={params.entity_table ?? ""}>
              <option value="">All tables</option>
              {ENTITY_TABLE_OPTIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="organization_id">Organisation ID</label>
            <input className="input" id="organization_id" name="organization_id" defaultValue={params.organization_id ?? ""} placeholder="optional exact UUID" />
          </div>
          <div className="row" style={{ alignItems: "end" }}>
            <button className="btn btn-primary" type="submit">Apply filters</button>
          </div>
        </form>
      </section>

      <section className="panel section stack">
        <div className="h2">Recent activity</div>
        <AuditLogTable logs={logs as any[]} />
      </section>
    </ConsoleShell>
  );
}
