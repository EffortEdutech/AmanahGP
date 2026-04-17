import Link from "next/link";
import {
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
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
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/organisations", label: "Organisations", icon: Building2 },
  { href: "/plans",         label: "Plans & Billing", icon: Wallet },
  { href: "/roles",         label: "Roles & Access", icon: Users },
  { href: "/audit",         label: "Audit Log",      icon: ClipboardList },
  { href: "/notifications", label: "Notifications",  icon: Bell },
];

function UserInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function ConsoleShell({
  title,
  description,
  currentPath,
  roles,
  userEmail,
  children,
}: ConsoleShellProps) {
  const roleLabel = getPrimaryRoleLabel(roles);

  return (
    <div className="page-shell">
      <div className="sidebar-layout">

        {/* ── Sidebar ── */}
        <aside className="panel sidebar">

          {/* Brand mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #047857, #065f46)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <ShieldCheck size={18} color="#ffffff" />
            </div>
            <div>
              <div className="kicker" style={{ letterSpacing: "0.08em" }}>AGP Console</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Platform Control Plane</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

          {/* Nav */}
          <nav className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.href ||
                currentPath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  className="nav-link"
                  href={item.href}
                  data-active={isActive}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "20px 0 16px" }} />

          {/* User strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="avatar avatar-green"
              style={{ width: 34, height: 34, fontSize: 12 }}
            >
              {userEmail ? UserInitials(userEmail) : "?"}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: "#0f172a",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {userEmail ?? "Signed in"}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                {roleLabel}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <LogoutButton />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="stack">

          {/* Page header panel */}
          <section className="panel hero" style={{ borderLeft: "4px solid #047857" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div className="kicker">Amanah Governance Platform</div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#047857",
                background: "#ecfdf5", border: "1px solid #a7f3d0",
                borderRadius: 999, padding: "2px 8px", letterSpacing: "0.06em",
              }}>
                Canonical DB Mode
              </div>
            </div>
            <h1 className="h1">{title}</h1>
            {description ? (
              <p className="muted" style={{ marginTop: 6, maxWidth: 820 }}>
                {description}
              </p>
            ) : null}
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}
