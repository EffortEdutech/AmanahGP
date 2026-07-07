"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  ShieldCheck,
  X,
} from "lucide-react";
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

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/organisations", label: "Orgs", icon: Building2 },
  { href: "/review-workbench", label: "Reviews", icon: ClipboardList },
  { href: "/notifications", label: "Alerts", icon: Bell },
] as const;

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setMobileSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gridTemplateColumns = useMemo(() => (collapsed ? "88px minmax(0, 1fr)" : "300px minmax(0, 1fr)"), [collapsed]);

  return (
    <div className="page-shell">
      <div className="agp-console-mobile-bar">
        <button
          type="button"
          className="btn btn-secondary agp-console-mobile-menu"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="agp-console-mobile-title">
          <div className="agp-console-mobile-title__brand">AGP Console</div>
          <div className="agp-console-mobile-title__page">{title}</div>
        </div>
      </div>

      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="agp-console-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <div className="agp-console-layout" style={{ display: "grid", gridTemplateColumns, gap: 20, alignItems: "start" }}>
        <aside className="panel agp-console-sidebar" data-collapsed={collapsed} data-mobile-open={mobileSidebarOpen}>
          <div className="agp-console-sidebar__header">
            <div className="agp-console-brand">
              <div className="agp-console-brand__icon">
                <ShieldCheck size={18} color="#ffffff" />
              </div>

              <div className="agp-console-collapsible">
                <div className="kicker" style={{ letterSpacing: "0.08em" }}>AGP Console</div>
                <div className="agp-console-brand__sub">Governance Control Plane</div>
              </div>
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

            <button
              type="button"
              className="btn btn-secondary agp-console-mobile-close"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="agp-console-sidebar__divider" />

          <nav className="agp-console-nav">
            {CONSOLE_NAV_GROUPS.map((group) => (
              <div key={group.title} className="agp-console-nav-group">
                <div className="agp-console-nav-group__title-wrap agp-console-collapsible">
                  <div className="agp-console-nav-group__title">{group.title}</div>
                  <div className="agp-console-nav-group__desc">{group.description}</div>
                </div>

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
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        <Icon size={16} strokeWidth={2} />
                        <span className="agp-console-nav-label agp-console-collapsible">{item.label}</span>
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

              <div className="agp-console-user__meta agp-console-collapsible">
                <div className="agp-console-user__email">{userEmail ?? "Signed in"}</div>
                <div className="agp-console-user__role">{roleLabel}</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <LogoutButton />
            </div>

            <div className="agp-console-helper-links agp-console-collapsible">
              <Link href="/flow-map" className="btn btn-secondary" onClick={() => setMobileSidebarOpen(false)}>
                Open Flow Map
              </Link>
            </div>
          </div>
        </aside>

        <main className="stack agp-console-main">
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

      <nav className="agp-console-mobile-lite-nav" aria-label="Mobile console navigation">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link key={item.href} href={item.href} className="agp-console-mobile-lite-link" data-active={isActive}>
              <Icon size={16} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className="agp-console-mobile-lite-link"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open full console menu"
        >
          <MoreHorizontal size={16} strokeWidth={2} />
          <span>More</span>
        </button>
      </nav>

      <style jsx>{`
        .agp-console-mobile-bar {
          display: none;
        }

        .agp-console-mobile-backdrop {
          display: none;
        }

        .agp-console-mobile-lite-nav {
          display: none;
        }

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

        .agp-console-mobile-close {
          display: none;
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

        .agp-console-sidebar[data-collapsed='true'] .agp-console-collapsible {
          display: none;
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
          .page-shell {
            padding-bottom: 86px;
          }

          .agp-console-mobile-bar {
            position: sticky;
            top: 0;
            z-index: 30;
            display: flex;
            align-items: center;
            gap: 10px;
            margin: -4px 0 12px;
            padding: 10px 0;
            background: #f1f5f9;
          }

          .agp-console-main {
            gap: 12px;
          }

          .agp-console-mobile-menu {
            width: 40px;
            height: 38px;
            padding: 0;
            flex-shrink: 0;
          }

          .agp-console-mobile-title {
            min-width: 0;
          }

          .agp-console-mobile-title__brand {
            font-size: 12px;
            font-weight: 700;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .agp-console-mobile-title__page {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }

          .agp-console-mobile-backdrop {
            position: fixed;
            inset: 0;
            z-index: 50;
            display: block;
            border: 0;
            background: rgba(15, 23, 42, 0.42);
            padding: 0;
          }

          .agp-console-layout {
            grid-template-columns: 1fr !important;
          }

          .agp-console-sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 60;
            width: min(320px, 86vw);
            max-width: 86vw;
            height: 100vh;
            height: 100dvh;
            max-height: none;
            overflow: hidden;
            padding: 14px;
            border-radius: 0 16px 16px 0;
            box-shadow: 18px 0 36px rgba(15, 23, 42, 0.18);
            transform: translateX(-105%);
            transition: transform 180ms ease;
          }

          .agp-console-sidebar[data-mobile-open='true'] {
            transform: translateX(0);
          }

          .agp-console-sidebar[data-collapsed='true'] .agp-console-brand > .agp-console-collapsible,
          .agp-console-sidebar[data-collapsed='true'] .agp-console-user__meta,
          .agp-console-sidebar[data-collapsed='true'] .agp-console-helper-links {
            display: block;
          }

          .agp-console-sidebar[data-collapsed='true'] .agp-console-nav-group__title-wrap {
            display: grid;
          }

          .agp-console-sidebar[data-collapsed='true'] .agp-console-nav-label {
            display: inline;
          }

          .agp-console-sidebar__header {
            margin-bottom: 10px;
          }

          .agp-console-toggle {
            display: none;
          }

          .agp-console-mobile-close {
            display: inline-flex;
          }

          .agp-console-nav {
            flex: 1;
            min-height: 0;
            max-height: none;
            overflow-y: auto;
            overscroll-behavior: contain;
            padding-right: 4px;
          }

          .agp-console-nav-link,
          .agp-console-sidebar[data-collapsed='true'] .agp-console-nav-link {
            justify-content: flex-start;
          }

          .agp-console-sidebar__footer {
            margin-top: 12px;
          }

          .agp-console-mobile-lite-nav {
            position: fixed;
            inset-inline: 0;
            bottom: 0;
            z-index: 45;
            display: flex;
            align-items: center;
            gap: 4px;
            border-top: 1px solid #e2e8f0;
            background: rgba(255, 255, 255, 0.96);
            padding: 7px 8px max(env(safe-area-inset-bottom), 8px);
            box-shadow: 0 -10px 26px rgba(15, 23, 42, 0.08);
            backdrop-filter: blur(10px);
          }

          .agp-console-mobile-lite-link {
            min-width: 0;
            flex: 1;
            min-height: 48px;
            border: 0;
            border-radius: 12px;
            background: transparent;
            color: #64748b;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
          }

          .agp-console-mobile-lite-link[data-active='true'] {
            background: #ecfdf5;
            color: #047857;
          }
        }
      `}</style>
    </div>
  );
}
