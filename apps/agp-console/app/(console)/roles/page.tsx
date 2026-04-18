import { KeyRound, Search } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { PlatformRoleAssignmentTable } from "@/components/platform-role-assignment-table";
import { PlatformUserSearchTable } from "@/components/platform-user-search-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getPlatformRoleStats, listConsoleUsers, listPlatformRoleAssignments } from "@/lib/console/server";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; message?: string; error?: string }>;
}) {
  const { user, roles } = await requireConsoleAccess("roles.read");
  const params = await searchParams;
  const [stats, assignments, users] = await Promise.all([
    getPlatformRoleStats(),
    listPlatformRoleAssignments(),
    listConsoleUsers(params.q, 25),
  ]);

  const roleLookup = assignments.reduce<Record<string, string[]>>((acc, row: any) => {
    const key = String(row.user_id);
    acc[key] = [...(acc[key] ?? []), `${row.role}${row.is_active ? "" : " (inactive)"}`];
    return acc;
  }, {});

  return (
    <ConsoleShell
      title="Roles & Access"
      description="Manage platform control-plane roles for owners, admins, reviewers, scholars, approvers, and auditors using canonical public.platform_user_roles."
      currentPath="/roles"
      roles={roles}
      userEmail={user.email}
    >
      {params.message ? <div className="notice">{decodeURIComponent(params.message)}</div> : null}
      {params.error ? <div className="notice notice-warning">{decodeURIComponent(params.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="role assignments" value={stats.total} note="All rows from public.platform_user_roles" />
        <StatsCard label="active assignments" value={stats.active} note="Currently enabled console roles" />
        <StatsCard label="owners" value={stats.owners} note="Platform owner assignments" />
        <StatsCard label="admins" value={stats.admins} note="Operational admin assignments" />
        <StatsCard label="reviewers" value={stats.reviewers} note="Assigned governance reviewers" />
        <StatsCard label="scholars" value={stats.scholars} note="Assigned scholars" />
        <StatsCard label="approvers" value={stats.approvers} note="Assigned approvers" />
        <StatsCard label="auditors" value={stats.auditors} note="Read-focused oversight assignments" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Find public users</div>
            <p className="muted">Search public.users and grant console access by mapping to auth_provider_user_id.</p>
          </div>
          <span className="badge badge-neutral"><KeyRound size={14} /> Canonical only</span>
        </div>

        <form className="row" method="get">
          <input className="input" name="q" defaultValue={params.q ?? ""} placeholder="Search email or display name" style={{ maxWidth: 360 }} />
          <button className="btn btn-primary" type="submit"><Search size={16} /> Search</button>
        </form>

        <div className="notice">
          Governance workflow users should be granted <strong>Reviewer</strong>, <strong>Scholar</strong>, or <strong>Approver</strong> here before they can be assigned in Governance Cases.
        </div>

        <PlatformUserSearchTable users={users as any[]} roleLookup={roleLookup} />
      </section>

      <section className="panel section stack">
        <div className="h2">Current platform role assignments</div>
        <PlatformRoleAssignmentTable assignments={assignments as any[]} />
      </section>
    </ConsoleShell>
  );
}
