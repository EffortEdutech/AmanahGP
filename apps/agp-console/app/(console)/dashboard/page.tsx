import Link from "next/link";
import { Building2, PlusCircle, Wallet } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getDashboardStats } from "@/lib/console/server";

export default async function DashboardPage() {
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const stats = await getDashboardStats();

  return (
    <ConsoleShell
      title="Dashboard"
      description="Monitor organisations, provision apps, control subscriptions, and govern the AGP platform from one place."
      currentPath="/dashboard"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="organizations" value={stats.organizations} note="Canonical public.organizations" />
        <StatsCard label="app installations" value={stats.installations} note="Enabled org workspaces and modules" />
        <StatsCard label="billing plans" value={stats.plans} note="Reusable pricing catalog" />
        <StatsCard label="pending invites" value={stats.pendingInvites} note="org_invitations waiting for acceptance" />
      </section>

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Organisation Lifecycle</div>
          <p className="muted">Create, verify, suspend, and review organisation legal profile and platform status.</p>
          <Link className="btn btn-primary" href="/organisations/new">
            <PlusCircle size={16} />
            Create organisation
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">App Provisioning</div>
          <p className="muted">Enable apps per organisation and manage which workspaces are active.</p>
          <Link className="btn btn-secondary" href="/organisations">
            <Building2 size={16} />
            Open organisations
          </Link>
        </div>

        <div className="panel section stack">
          <div className="h2">Billing Control</div>
          <p className="muted">Manage plans, subscriptions, invoice records, and the platform billing lifecycle.</p>
          <Link className="btn btn-secondary" href="/plans">
            <Wallet size={16} />
            View plans
          </Link>
        </div>
      </section>
    </ConsoleShell>
  );
}
