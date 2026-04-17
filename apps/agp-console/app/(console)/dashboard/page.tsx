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
      {/* Stats row */}
      <section className="grid-cards">
        <StatsCard
          label="Organisations"
          value={stats.organizations}
          note="Registered in public.organizations"
          accent="green"
        />
        <StatsCard
          label="App Installations"
          value={stats.installations}
          note="Active org workspaces"
          accent="blue"
        />
        <StatsCard
          label="Billing Plans"
          value={stats.plans}
          note="Reusable pricing catalog"
          accent="purple"
        />
        <StatsCard
          label="Pending Invites"
          value={stats.pendingInvites}
          note="Awaiting org acceptance"
          accent="amber"
        />
      </section>

      {/* Action cards */}
      <section className="grid-cards">
        <div className="panel section stack">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Building2 size={18} color="#047857" />
            </div>
            <div className="h2">Organisation Lifecycle</div>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Create, verify, suspend, and review organisation legal profile and platform status.
          </p>
          <div>
            <Link className="btn btn-primary" href="/organisations/new">
              <PlusCircle size={15} />
              Create organisation
            </Link>
          </div>
        </div>

        <div className="panel section stack">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="h2">App Provisioning</div>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Enable apps per organisation and manage which workspaces are active.
          </p>
          <div>
            <Link className="btn btn-secondary" href="/organisations">
              <Building2 size={15} />
              Open organisations
            </Link>
          </div>
        </div>

        <div className="panel section stack">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Wallet size={18} color="#7c3aed" />
            </div>
            <div className="h2">Billing Control</div>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Manage plans, subscriptions, invoice records, and the platform billing lifecycle.
          </p>
          <div>
            <Link className="btn btn-secondary" href="/plans">
              <Wallet size={15} />
              View plans
            </Link>
          </div>
        </div>
      </section>
    </ConsoleShell>
  );
}
