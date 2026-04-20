'use client';
// apps/org/components/layout/sidebar.tsx
// amanahOS — Sidebar navigation (Option A: URL-based org context)
//
// Receives currentOrgId from OrgShell (which gets it from /org/[orgId]/layout.tsx).
// All nav hrefs are built as /org/${currentOrgId}/path.
// Org-switcher renders when the user belongs to more than one organisation.

import { useState } from 'react';
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
  currentOrgId: string;
  user: { displayName: string; email: string; platformRole: string };
  orgs: OrgEntry[];
  onNavigate?: () => void;
  onClose?: () => void;
  showMobileClose?: boolean;
}

export function Sidebar({
  currentOrgId,
  user,
  orgs,
  onNavigate,
  onClose,
  showMobileClose = false,
}: SidebarProps) {
  const pathname  = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // All hrefs are rooted at /org/${currentOrgId}
  const base = `/org/${currentOrgId}`;

  const active  = (suffix: string) =>
    pathname === `${base}${suffix}` || pathname.startsWith(`${base}${suffix}/`);
  const exact   = (suffix: string) => pathname === `${base}${suffix}`;

  const contextOrg  = orgs.find((o) => o.organization_id === currentOrgId) ?? orgs[0];
  const role        = contextOrg?.org_role ?? '';
  const isManager   = ['org_admin', 'org_manager'].includes(role);
  const hasMultiOrg = orgs.length > 1;

  const onboardingBadge = () => {
    const s = contextOrg?.onboarding_status;
    if (s === 'approved') return { label: 'Active',       cls: 'text-emerald-600 bg-emerald-50' };
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

      {/* Org context + switcher */}
      {contextOrg && (
        <div className="flex-shrink-0 border-b border-gray-50 px-3 py-2.5">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium leading-snug text-gray-800">
                {contextOrg.org_name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-0.5 text-[9px] capitalize text-gray-400">
                {role.replace('org_', '')}
              </p>
            </div>

            {/* Org-switcher toggle — only shown when user has multiple orgs */}
            {hasMultiOrg && (
              <button
                type="button"
                onClick={() => setSwitcherOpen((v) => !v)}
                title="Switch organisation"
                className="flex-shrink-0 mt-0.5 rounded px-1 py-0.5 text-[10px] text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                ⇅
              </button>
            )}
          </div>

          {/* Org list dropdown */}
          {switcherOpen && hasMultiOrg && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              {orgs.map((org) => (
                <Link
                  key={org.organization_id}
                  href={`/org/${org.organization_id}/dashboard`}
                  onClick={() => { setSwitcherOpen(false); onNavigate?.(); }}
                  className={`flex items-center gap-2 px-2.5 py-2 text-[11px] transition-colors hover:bg-gray-50 ${
                    org.organization_id === currentOrgId
                      ? 'bg-emerald-50 text-emerald-800 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                    {org.org_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{org.org_name}</span>
                  {org.organization_id === currentOrgId && (
                    <span className="ml-auto flex-shrink-0 text-[8px] text-emerald-600">✓</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        <NavLink
          href={`${base}/dashboard`}
          label="Dashboard"
          icon="▣"
          isActive={exact('/dashboard')}
          onClick={onNavigate}
        />

        <NavLink
          href={`${base}/onboarding`}
          label="Amanah Ready"
          icon="◉"
          isActive={active('/onboarding')}
          onClick={onNavigate}
        />

        <SectionLabel label="Accounting" accent />
        <NavLink href={`${base}/accounting`}                         label="Overview"          icon="$"  isActive={exact('/accounting')}                         onClick={onNavigate} />
        <NavLink href={`${base}/accounting/transactions`}            label="Transactions"      icon="⇄"  isActive={active('/accounting/transactions')}            onClick={onNavigate} />
        <NavLink href={`${base}/accounting/payment-requests`}        label="Payment requests"  icon="✉"  isActive={active('/accounting/payment-requests')}        onClick={onNavigate} />
        <NavLink href={`${base}/accounting/bank-accounts`}           label="Bank accounts"     icon="🏦" isActive={active('/accounting/bank-accounts')}           onClick={onNavigate} />
        <NavLink href={`${base}/accounting/funds`}                   label="Funds"             icon="◎"  isActive={active('/accounting/funds')}                   onClick={onNavigate} />
        <NavLink href={`${base}/accounting/chart-of-accounts`}       label="Chart of accounts" icon="≡"  isActive={active('/accounting/chart-of-accounts')}       onClick={onNavigate} />
        <NavLink href={`${base}/accounting/reports`}                 label="Reports"           icon="📊" isActive={active('/accounting/reports')}                 onClick={onNavigate} />
        {isManager && (
          <NavLink href={`${base}/accounting/close`}                 label="Month close"       icon="⊠"  isActive={active('/accounting/close')}                   onClick={onNavigate} />
        )}

        <SectionLabel label="Organisation" />
        <NavLink href={`${base}/profile`}    label="Profile"   icon="◎" isActive={active('/profile')}   onClick={onNavigate} />
        <NavLink href={`${base}/projects`}   label="Projects"  icon="▦" isActive={active('/projects')}  onClick={onNavigate} />
        <NavLink href={`${base}/reports`}    label="Reports"   icon="✎" isActive={active('/reports')}   onClick={onNavigate} />
        {isManager && (
          <NavLink href={`${base}/members`}  label="Members"   icon="♟" isActive={active('/members')}   onClick={onNavigate} />
        )}

        {isManager && (
          <>
            <SectionLabel label="Governance" />
            <NavLink href={`${base}/compliance`}  label="Compliance"  icon="☑" isActive={active('/compliance')}  onClick={onNavigate} />
            <NavLink href={`${base}/policy-kit`}  label="Policy kit"  icon="⊞" isActive={active('/policy-kit')}  onClick={onNavigate} />
          </>
        )}

        <SectionLabel label="Trust" />
        <NavLink href={`${base}/trust`}        label="Trust score"  icon="▲" isActive={active('/trust')}        onClick={onNavigate} />
        <NavLink href={`${base}/certification`} label="Certification" icon="★" isActive={active('/certification')} onClick={onNavigate} />
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
        isActive
          ? 'bg-emerald-50 font-medium text-emerald-800'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
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
