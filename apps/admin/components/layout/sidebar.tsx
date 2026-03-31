'use client';
// apps/admin/components/layout/sidebar.tsx
// AmanahHub Console — Compact sidebar (Sprint 8 UI uplift)
// Matches UAT .sidebar 180px pattern with .sb-link 12px items

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut }     from '@/app/(auth)/actions';

interface SidebarProps {
  user: { displayName: string; email: string; platformRole: string };
  orgs: Array<{
    organization_id:   string;
    org_name:          string;
    org_role:          string;
    onboarding_status: string;
    listing_status:    string;
  }>;
}

function isReviewer(role: string) {
  return role === 'reviewer' || role === 'scholar' || role === 'super_admin';
}

function isOrgMember(orgs: SidebarProps['orgs']) {
  return orgs.length > 0;
}

export function Sidebar({ user, orgs }: SidebarProps) {
  const pathname = usePathname();
  const orgId    = orgs[0]?.organization_id;
  const firstOrg = orgs[0];

  function active(href: string | null) {
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const reviewer = isReviewer(user.platformRole);
  const hasOrg   = isOrgMember(orgs);

  return (
    <aside className="w-[180px] flex-shrink-0 bg-white border-r border-gray-200
                      flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* Brand */}
      <div className="px-3 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center justify-center
                          text-white text-xs font-medium flex-shrink-0">A</div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-gray-900 truncate">AmanahHub</div>
            <div className="text-[10px] text-gray-400">Console</div>
          </div>
        </div>
      </div>

      {/* Org context label */}
      {firstOrg && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider truncate">
            {firstOrg.org_name}
          </p>
        </div>
      )}

      {/* Org admin nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">

        <NavLink href="/dashboard"         label="Dashboard"     icon="▣" active={active('/dashboard')} />

        {hasOrg && (
          <>
            <NavLink href={`/orgs/${orgId}`}                label="Organization"   icon="◎" active={active(`/orgs/${orgId}`) && !active(`/orgs/${orgId}/projects`) && !active(`/orgs/${orgId}/members`) && !active(`/orgs/${orgId}/financials`) && !active(`/orgs/${orgId}/certification`)} />
            <NavLink href={`/orgs/${orgId}/projects`}       label="Projects"       icon="▦" active={active(`/orgs/${orgId}/projects`)} />
            <NavLink href={`/orgs/${orgId}/financials`}     label="Financials"     icon="$" active={active(`/orgs/${orgId}/financials`)} />
            <NavLink href={`/orgs/${orgId}/certification`}  label="Certification"  icon="★" active={active(`/orgs/${orgId}/certification`)} />
            <NavLink href={`/orgs/${orgId}/members`}        label="Members"        icon="♟" active={active(`/orgs/${orgId}/members`)} />
          </>
        )}

        <NavLink href="/onboarding/new" label="New org" icon="+" active={active('/onboarding/new')} />

        {/* Reviewer section */}
        {reviewer && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-2 text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                Reviewer
              </p>
            </div>
            <NavLink href="/review/onboarding"   label="All queues"     icon="≡" active={active('/review/onboarding') || active('/review/reports') || active('/review/certification') || active('/review/amanah') || active('/review/scholar')} />
            <NavLink href="/review/certification" label="CTCF eval"     icon="★" active={active('/review/certification')} />
            <NavLink href="/review/scholar"       label="Scholar notes"  icon="✎" active={active('/review/scholar')} />
            <NavLink href="/review/amanah"        label="Amanah score"  icon="▲" active={active('/review/amanah')} />
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0">
        <p className="text-[11px] font-medium text-gray-700 truncate">
          {user.displayName}
        </p>
        <p className="text-[10px] text-gray-400 truncate mb-2">{user.email}</p>
        <form action={signOut}>
          <button type="submit"
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLink({
  href, label, icon, active, disabled,
}: {
  href: string; label: string; icon: string;
  active?: boolean; disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md
                      text-[12px] text-gray-300 cursor-not-allowed select-none">
        <span className="w-3.5 text-[11px] flex-shrink-0 text-center">{icon}</span>
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px]
                  transition-colors w-full
                  ${active
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
    >
      <span className="w-3.5 text-[11px] flex-shrink-0 text-center">{icon}</span>
      {label}
    </Link>
  );
}
