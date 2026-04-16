'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';

interface OrgEntry {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
}

interface OrgShellProps {
  user: { displayName: string; email: string; platformRole: string };
  orgs: OrgEntry[];
  children: React.ReactNode;
}

const STORAGE_KEY = 'amanahos.sidebar.desktop.open';

export function OrgShell({ user, orgs, children }: OrgShellProps) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === '0') {
        setDesktopSidebarOpen(false);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, desktopSidebarOpen ? '1' : '0');
    } catch {
      // Ignore storage errors.
    }
  }, [desktopSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {desktopSidebarOpen && (
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar user={user} orgs={orgs} />
        </div>
      )}

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
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
          user={user}
          orgs={orgs}
          showMobileClose
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-200 bg-white/95 px-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            ☰
          </button>

          <button
            type="button"
            onClick={() => setDesktopSidebarOpen((value) => !value)}
            aria-label={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            title={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 lg:inline-flex"
          >
            {desktopSidebarOpen ? '◀' : '▶'}
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900">amanahOS</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
