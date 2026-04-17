import Link from "next/link";
import { Building2, ClipboardList, LayoutDashboard, ShieldCheck, Wallet } from "lucide-react";
import { getPrimaryRoleLabel } from "@/lib/console/access";
import { LogoutButton } from "@/components/logout-button";

type ConsoleShellProps = {
  title: string;
  description?: string;
  currentPath: string;
  roles: string[];
  userEmail?: string | null;
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organisations", label: "Organisations", icon: Building2 },
  { href: "/plans", label: "Plans & Billing", icon: Wallet },
  { href: "/audit", label: "Audit Log", icon: ClipboardList },
];

export function ConsoleShell({ title, description, currentPath, roles, userEmail, children }: ConsoleShellProps) {
  return (
    <div className="page-shell">
      <div className="sidebar-layout">
        <aside className="panel sidebar">
          <div className="kicker">AGP Console</div>
          <div className="h2" style={{ marginTop: 8 }}>Platform Control Plane</div>
          <div className="muted" style={{ marginTop: 10 }}>{userEmail ?? "Signed in"}</div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge"><ShieldCheck size={14} /> {getPrimaryRoleLabel(roles)}</span>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} className="nav-link" href={item.href} data-active={isActive}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 18 }}>
            <LogoutButton />
          </div>
        </aside>

        <main className="stack">
          <section className="panel hero">
            <div className="kicker">Amanah Governance Platform</div>
            <div className="row-between" style={{ marginTop: 10 }}>
              <div>
                <h1 className="h1">{title}</h1>
                {description ? <p className="muted" style={{ maxWidth: 860 }}>{description}</p> : null}
              </div>
            </div>
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
