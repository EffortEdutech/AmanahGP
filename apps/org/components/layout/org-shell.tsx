'use client';
// apps/org/components/layout/org-shell.tsx
// amanahOS - App shell with mobile-lite workspace navigation.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

interface OrgEntry {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
}

interface OrgShellProps {
  currentOrgId: string;
  user: { displayName: string; email: string; platformRole: string };
  orgs: OrgEntry[];
  children: React.ReactNode;
}

const STORAGE_KEY = 'amanahos.sidebar.desktop.open';

export function OrgShell({ currentOrgId, user, orgs, children }: OrgShellProps) {
  const pathname = usePathname() ?? '';
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const currentOrg = orgs.find((org) => org.organization_id === currentOrgId) ?? orgs[0];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === '0') setDesktopSidebarOpen(false);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, desktopSidebarOpen ? '1' : '0');
    } catch {}
  }, [desktopSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {desktopSidebarOpen && (
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar currentOrgId={currentOrgId} user={user} orgs={orgs} />
        </div>
      )}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentOrgId={currentOrgId}
          user={user}
          orgs={orgs}
          showMobileClose
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-200 bg-white/95 px-3 backdrop-blur lg:h-12">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-base font-semibold text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            =
          </button>
          <button
            type="button"
            onClick={() => setDesktopSidebarOpen((value) => !value)}
            aria-label={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            title={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 lg:inline-flex"
          >
            {desktopSidebarOpen ? '<' : '>'}
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900">amanahOS</div>
            {currentOrg && (
              <div className="truncate text-[11px] text-gray-500 lg:hidden">{currentOrg.org_name}</div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>

        <MobileLiteNav
          base={`/org/${currentOrgId}`}
          pathname={pathname}
          onMore={() => setMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
}

function MobileLiteNav({
  base,
  pathname,
  onMore,
}: {
  base: string;
  pathname: string;
  onMore: () => void;
}) {
  const itemClass = (isActive: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors ${
      isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`;

  const active = (suffix: string) =>
    pathname === `${base}${suffix}` || pathname.startsWith(`${base}${suffix}/`);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      aria-label="Mobile workspace"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        <MobileNavLink href={`${base}/dashboard`} label="Home" code="H" isActive={active('/dashboard')} itemClass={itemClass} />
        <MobileNavLink href={`${base}/accounting`} label="Money" code="$" isActive={active('/accounting')} itemClass={itemClass} />
        <MobileNavLink href={`${base}/reports`} label="Reports" code="R" isActive={active('/reports')} itemClass={itemClass} />
        <MobileNavLink href={`${base}/trust`} label="Trust" code="T" isActive={active('/trust')} itemClass={itemClass} />
        <button type="button" onClick={onMore} className={itemClass(false)} aria-label="Open full menu">
          <span className="text-[13px] leading-none">...</span>
          <span className="truncate">More</span>
        </button>
      </div>
    </nav>
  );
}

function MobileNavLink({
  href,
  label,
  code,
  isActive,
  itemClass,
}: {
  href: string;
  label: string;
  code: string;
  isActive: boolean;
  itemClass: (isActive: boolean) => string;
}) {
  return (
    <Link href={href} className={itemClass(isActive)}>
      <span className="text-[12px] leading-none">{code}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
