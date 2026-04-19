"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { CONSOLE_NAV_GROUPS } from "@/lib/console/navigation";

type ConsoleLayoutClientProps = {
  title: string;
  description?: string;
  currentPath: string;
  roleLabel: string;
  userEmail?: string | null;
  children: React.ReactNode;
};

const STORAGE_KEY = "agp-console-sidebar-collapsed";

function userInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function ConsoleLayoutClient({
  title,
  description,
  currentPath,
  roleLabel,
  userEmail,
  children,
}: ConsoleLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setCollapsed(raw === "1");
    } catch {
      setCollapsed(false);
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, mounted]);

  const gridTemplateColumns = useMemo(() => (collapsed ? "88px minmax(0, 1fr)" : "300px minmax(0, 1fr)"), [collapsed]);

  return (
    <div className="page-shell">
      <div className="agp-console-layout" style={{ display: "grid", gridTemplateColumns, gap: 20, alignItems: "start" }}>
        <aside className="panel agp-console-sidebar" data-collapsed={collapsed}>
          <div className="agp-console-sidebar__header">
            <div className="agp-console-brand">
              <div className="agp-console-brand__icon">
                <ShieldCheck size={18} color="#ffffff" />
              </div>

              {!collapsed ? (
                <div>
                  <div className="kicker" style={{ letterSpacing: "0.08em" }}>AGP Console</div>
                  <div className="agp-console-brand__sub">Governance Control Plane</div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="btn btn-secondary agp-console-toggle"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div className="agp-console-sidebar__divider" />

          <nav className="agp-console-nav">
            {CONSOLE_NAV_GROUPS.map((group) => (
              <div key={group.title} className="agp-console-nav-group">
                {!collapsed ? (
                  <div className="agp-console-nav-group__title-wrap">
                    <div className="agp-console-nav-group__title">{group.title}</div>
                    <div className="agp-console-nav-group__desc">{group.description}</div>
                  </div>
                ) : null}

                <div className="nav-list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        className="nav-link agp-console-nav-link"
                        href={item.href}
                        data-active={isActive}
                        title={item.label}
                      >
                        <Icon size={16} strokeWidth={2} />
                        {!collapsed ? <span>{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="agp-console-sidebar__footer">
            <div className="agp-console-sidebar__divider" />

            <div className="agp-console-user">
              <div className="avatar avatar-green agp-console-user__avatar">
                {userEmail ? userInitials(userEmail) : "?"}
              </div>

              {!collapsed ? (
                <div className="agp-console-user__meta">
                  <div className="agp-console-user__email">{userEmail ?? "Signed in"}</div>
                  <div className="agp-console-user__role">{roleLabel}</div>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 14 }}>
              <LogoutButton />
            </div>

            {!collapsed ? (
              <div className="agp-console-helper-links">
                <Link href="/flow-map" className="btn btn-secondary">Open Flow Map</Link>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="stack">
          <section className="panel hero" style={{ borderLeft: "4px solid #047857" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <div className="kicker">Amanah Governance Platform</div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#047857",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 999,
                  padding: "2px 8px",
                  letterSpacing: "0.06em",
                }}
              >
                Canonical DB Mode
              </div>
            </div>
            <h1 className="h1">{title}</h1>
            {description ? (
              <p className="muted" style={{ marginTop: 6, maxWidth: 860 }}>
                {description}
              </p>
            ) : null}
          </section>

          {children}
        </main>
      </div>

      <style jsx>{`
        .agp-console-sidebar {
          position: sticky;
          top: 16px;
          max-height: calc(100vh - 32px);
          overflow: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .agp-console-sidebar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        .agp-console-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .agp-console-brand__icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #047857, #065f46);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .agp-console-brand__sub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        .agp-console-toggle {
          padding-inline: 10px;
          min-width: 38px;
          height: 34px;
        }

        .agp-console-sidebar__divider {
          height: 1px;
          background: #f1f5f9;
          margin-bottom: 14px;
        }

        .agp-console-nav {
          display: grid;
          gap: 16px;
          overflow: auto;
          padding-right: 2px;
        }

        .agp-console-nav-group {
          display: grid;
          gap: 10px;
        }

        .agp-console-nav-group__title-wrap {
          display: grid;
          gap: 3px;
        }

        .agp-console-nav-group__title {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .agp-console-nav-group__desc {
          font-size: 11px;
          color: #64748b;
          line-height: 1.35;
        }

        .agp-console-nav-link {
          justify-content: flex-start;
        }

        .agp-console-sidebar[data-collapsed='true'] .agp-console-nav-link {
          justify-content: center;
        }

        .agp-console-sidebar__footer {
          margin-top: 16px;
        }

        .agp-console-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .agp-console-user__avatar {
          width: 34px;
          height: 34px;
          font-size: 12px;
        }

        .agp-console-user__meta {
          min-width: 0;
          flex: 1;
        }

        .agp-console-user__email {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .agp-console-user__role {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
        }

        .agp-console-helper-links {
          margin-top: 12px;
          display: grid;
        }

        @media (max-width: 1024px) {
          .agp-console-layout {
            grid-template-columns: 1fr !important;
          }

          .agp-console-sidebar {
            position: relative;
            top: 0;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
}
