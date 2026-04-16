'use client';
// apps/org/components/layout/sidebar.tsx
// amanahOS — Sidebar navigation

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/(auth)/actions';

interface OrgEntry {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
}

interface SidebarProps {
  user: { displayName: string; email: string; platformRole: string };
  orgs: OrgEntry[];
  onNavigate?: () => void;
  onClose?: () => void;
  showMobileClose?: boolean;
}

export function Sidebar({ user, orgs, onNavigate, onClose, showMobileClose = false }: SidebarProps) {
  const pathname = usePathname();
  const active = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/');
  const exact = (path: string) => pathname === path;

  const contextOrg = orgs[0];
  const orgId = contextOrg?.organization_id;
  const role = contextOrg?.org_role ?? '';
  const isManager = ['org_admin', 'org_manager'].includes(role);

  const onboardingBadge = () => {
    const s = contextOrg?.onboarding_status;
    if (s === 'approved') return { label: 'Active', cls: 'text-emerald-600 bg-emerald-50' };
    if (s === 'submitted') return { label: 'Under review', cls: 'text-amber-600 bg-amber-50' };
    return { label: 'Setup needed', cls: 'text-gray-500 bg-gray-100' };
  };
  const badge = onboardingBadge();

  return (
    <aside className="flex h-full w-56 max-w-[85vw] flex-shrink-0 flex-col border-r border-gray-100 bg-white shadow-sm lg:max-w-none lg:shadow-none">
      {/* Brand */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-600">
            <span className="text-[10px] font-bold text-white">OS</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-gray-900">amanahOS</div>
            <div className="text-[9px] text-gray-400">Governance Workspace</div>
          </div>
        </div>

        {showMobileClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            ✕
          </button>
        )}
      </div>

      {/* Org context */}
      {contextOrg && (
        <div className="flex-shrink-0 border-b border-gray-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-medium leading-snug text-gray-800">{contextOrg.org_name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="mt-0.5 text-[9px] capitalize text-gray-400">{role.replace('org_', '')}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        <NavLink href="/dashboard" label="Dashboard" icon="▣" isActive={exact('/dashboard')} onClick={onNavigate} />

        {orgId && (
          <NavLink
            href="/onboarding"
            label="Amanah Ready"
            icon="◉"
            isActive={active('/onboarding')}
            onClick={onNavigate}
          />
        )}

        {orgId && (
          <>
            <SectionLabel label="Accounting" accent />
            <NavLink href="/accounting" label="Overview" icon="$" isActive={exact('/accounting')} onClick={onNavigate} />
            <NavLink href="/accounting/transactions" label="Transactions" icon="⇄" isActive={active('/accounting/transactions')} onClick={onNavigate} />
            <NavLink href="/accounting/payment-requests" label="Payment requests" icon="✉" isActive={active('/accounting/payment-requests')} onClick={onNavigate} />
            <NavLink href="/accounting/bank-accounts" label="Bank accounts" icon="🏦" isActive={active('/accounting/bank-accounts')} onClick={onNavigate} />
            <NavLink href="/accounting/funds" label="Funds" icon="◎" isActive={active('/accounting/funds')} onClick={onNavigate} />
            <NavLink href="/accounting/chart-of-accounts" label="Chart of accounts" icon="≡" isActive={active('/accounting/chart-of-accounts')} onClick={onNavigate} />
            <NavLink href="/accounting/reports" label="Reports" icon="📊" isActive={active('/accounting/reports')} onClick={onNavigate} />
            {isManager && (
              <NavLink href="/accounting/close" label="Month close" icon="⊠" isActive={active('/accounting/close')} onClick={onNavigate} />
            )}
          </>
        )}

        {orgId && (
          <>
            <SectionLabel label="Organisation" />
            <NavLink href="/profile" label="Profile" icon="◎" isActive={active('/profile')} onClick={onNavigate} />
            <NavLink href="/projects" label="Projects" icon="▦" isActive={active('/projects')} onClick={onNavigate} />
            <NavLink href="/reports" label="Reports" icon="✎" isActive={active('/reports')} onClick={onNavigate} />
            {isManager && (
              <NavLink href="/members" label="Members" icon="♟" isActive={active('/members')} onClick={onNavigate} />
            )}
          </>
        )}

        {orgId && isManager && (
          <>
            <SectionLabel label="Governance" />
            <NavLink href="/compliance" label="Compliance" icon="☑" isActive={active('/compliance')} onClick={onNavigate} />
            <NavLink href="/policy-kit" label="Policy kit" icon="⊞" isActive={active('/policy-kit')} onClick={onNavigate} />
          </>
        )}

        {orgId && (
          <>
            <SectionLabel label="Trust" />
            <NavLink href="/trust" label="Trust score" icon="▲" isActive={active('/trust')} onClick={onNavigate} />
            <NavLink href="/certification" label="Certification" icon="★" isActive={active('/certification')} onClick={onNavigate} />
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-3">
        <p className="truncate text-[11px] font-medium text-gray-700">{user.displayName}</p>
        <p className="truncate text-[10px] text-gray-400">{user.email}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <a
            href={process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#'}
            onClick={onNavigate}
            className="text-[9px] text-gray-400 transition-colors hover:text-gray-600"
          >
            Console ↗
          </a>
          <form action={signOut}>
            <button type="submit" className="text-[10px] text-gray-400 transition-colors hover:text-gray-600">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div className="pb-0.5 pt-3">
      <p className={`px-2 text-[9px] font-semibold uppercase tracking-wider ${accent ? 'text-emerald-600' : 'text-gray-400'}`}>
        {label}
      </p>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  isActive,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  isActive?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
        isActive ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <span className="w-4 flex-shrink-0 text-center text-[11px]">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
          {badge}
        </span>
      )}
    </Link>
  );
}
