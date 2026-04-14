'use client';
// apps/org/components/layout/sidebar.tsx
// amanahOS — Sidebar navigation
//
// TOP-LEVEL SECTIONS:
//   ▣  Dashboard
//   ── Accounting ──          ← PRIMARY feature section
//      $ Overview
//      ⇄  Transactions
//      🏦 Bank accounts
//      ≡  Chart of accounts
//      ◎  Funds
//      ≡  Reports
//      ⊠  Month close
//   ── Organisation ──
//      ◎  Profile
//      ▦  Projects
//      ✎  Reports
//      ♟  Members
//   ── Governance ──
//      ☑  Compliance
//      ⊞  Policy kit
//   ── Trust ──
//      ▲  Trust score
//      ★  Certification

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
}

export function Sidebar({ user, orgs }: SidebarProps) {
  const pathname  = usePathname();
  const active    = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/');
  const exact     = (path: string)   => pathname === path;

  const contextOrg = orgs[0];
  const orgId      = contextOrg?.organization_id;
  const role       = contextOrg?.org_role ?? '';
  const isManager  = ['org_admin', 'org_manager'].includes(role);

  const onboardingBadge = () => {
    const s = contextOrg?.onboarding_status;
    if (s === 'approved')  return { label: 'Active',       cls: 'text-emerald-600 bg-emerald-50' };
    if (s === 'submitted') return { label: 'Under review', cls: 'text-amber-600 bg-amber-50' };
    return                        { label: 'Setup needed', cls: 'text-gray-500 bg-gray-100' };
  };
  const badge = onboardingBadge();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100">

      {/* Brand */}
      <div className="px-3 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">OS</span>
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-gray-900">amanahOS</div>
            <div className="text-[9px] text-gray-400">Governance Workspace</div>
          </div>
        </div>
      </div>

      {/* Org context */}
      {contextOrg && (
        <div className="px-3 py-2.5 border-b border-gray-50 flex-shrink-0">
          <p className="text-[11px] font-medium text-gray-800 truncate leading-snug">{contextOrg.org_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5 capitalize">{role.replace('org_', '')}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">

        {/* Dashboard */}
        <NavLink href="/dashboard" label="Dashboard" icon="▣" isActive={exact('/dashboard')} />

        {/* ══ ACCOUNTING (primary section) ══════════════════════ */}
        {orgId && (
          <>
            <SectionLabel label="Accounting" accent />

            <NavLink href="/accounting"
              label="Overview" icon="$"
              isActive={exact('/accounting')} />

            <NavLink href="/accounting/transactions"
              label="Transactions" icon="⇄"
              isActive={active('/accounting/transactions')} />

            <NavLink href="/accounting/bank-accounts"
              label="Bank accounts" icon="🏦"
              isActive={active('/accounting/bank-accounts')} />

            <NavLink href="/accounting/funds"
              label="Funds" icon="◎"
              isActive={active('/accounting/funds')} />

            <NavLink href="/accounting/chart-of-accounts"
              label="Chart of accounts" icon="≡"
              isActive={active('/accounting/chart-of-accounts')} />

            <NavLink href="/accounting/reports"
              label="Reports" icon="📊"
              isActive={active('/accounting/reports')} />

            {isManager && (
              <NavLink href="/accounting/close"
                label="Month close" icon="⊠"
                isActive={active('/accounting/close')} />
            )}
          </>
        )}

        {/* ══ ORGANISATION ══════════════════════════════════════ */}
        {orgId && (
          <>
            <SectionLabel label="Organisation" />
            <NavLink href="/profile"    label="Profile"  icon="◎" isActive={active('/profile')} />
            <NavLink href="/projects"   label="Projects" icon="▦" isActive={active('/projects')} />
            <NavLink href="/reports"    label="Reports"  icon="✎" isActive={active('/reports')} />
            {isManager && (
              <NavLink href="/members"  label="Members"  icon="♟" isActive={active('/members')} />
            )}
          </>
        )}

        {/* ══ GOVERNANCE ════════════════════════════════════════ */}
        {orgId && isManager && (
          <>
            <SectionLabel label="Governance" />
            <NavLink href="/compliance" label="Compliance" icon="☑"
              isActive={active('/compliance')} badge="Sprint 16" />
            <NavLink href="/policy-kit" label="Policy kit" icon="⊞"
              isActive={active('/policy-kit')} badge="Sprint 17" />
          </>
        )}

        {/* ══ TRUST ═════════════════════════════════════════════ */}
        {orgId && (
          <>
            <SectionLabel label="Trust" />
            <NavLink href="/trust"         label="Trust score"   icon="▲" isActive={active('/trust')} />
            <NavLink href="/certification" label="Certification" icon="★" isActive={active('/certification')} />
          </>
        )}

      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0">
        <p className="text-[11px] font-medium text-gray-700 truncate">{user.displayName}</p>
        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
        <div className="flex items-center justify-between mt-1.5">
          <a href={process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#'}
            className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors">
            Console ↗
          </a>
          <form action={signOut}>
            <button type="submit"
              className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
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
    <div className="pt-3 pb-0.5">
      <p className={`px-2 text-[9px] font-semibold uppercase tracking-wider ${
        accent ? 'text-emerald-600' : 'text-gray-400'
      }`}>
        {label}
      </p>
    </div>
  );
}

function NavLink({ href, label, icon, isActive, badge }: {
  href: string; label: string; icon: string; isActive?: boolean; badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px]
                  transition-colors w-full
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
    >
      <span className="w-4 text-[11px] flex-shrink-0 text-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
          {badge}
        </span>
      )}
    </Link>
  );
}
