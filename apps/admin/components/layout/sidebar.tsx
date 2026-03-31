'use client';
// apps/admin/components/layout/sidebar.tsx
// AmanahHub Console — Sidebar (Sprint 9d)
//
// Exact nav order per spec:
// ▣ Dashboard
// Platform (super_admin only)
//   ≡ All orgs
//   ♟ All users
//   ≡ Audit logs
// + New org  (org members + super_admin)
// Review (reviewer / super_admin)
//   ≡ All queues
//   ★ CTCF eval
//   ✎ Scholar notes
//   ▲ Amanah score
// Selected org  (when navigating any /orgs/[id] route)
//   ◎ Overview
//   ▦ Projects
//   $ Financials
//   ★ Certification
//   ♟ Members

import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut }    from '@/app/(auth)/actions';

interface OrgEntry {
  organization_id:   string;
  org_name:          string;
  org_role:          string;
  onboarding_status: string;
  listing_status:    string;
}

interface SidebarProps {
  user: { displayName: string; email: string; platformRole: string };
  orgs: OrgEntry[];
}

export function Sidebar({ user, orgs }: SidebarProps) {
  const pathname    = usePathname();
  const role        = user.platformRole;

  const isSuperAdmin = role === 'super_admin';
  const isReviewer   = ['reviewer', 'scholar', 'super_admin'].includes(role);
  const isOrgMember  = !['super_admin', 'reviewer', 'scholar'].includes(role);

  // Detect selected org from URL
  const urlOrgId  = pathname.match(/\/orgs\/([0-9a-f-]{36})/)?.[1];
  const activeOrg = urlOrgId ? orgs.find((o) => o.organization_id === urlOrgId) : null;
  // For org members with no URL org, default to first org for context label only
  const contextOrg = activeOrg ?? (isOrgMember ? orgs[0] : null);
  const orgId      = activeOrg?.organization_id ?? (isOrgMember ? orgs[0]?.organization_id : null);

  function active(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function contextLabel() {
    if (isSuperAdmin) return { title: 'Platform Admin', sub: `${orgs.length} organizations`, cls: 'text-violet-700' };
    if (role === 'reviewer') return { title: 'Reviewer',     sub: `${orgs.length} orgs`,       cls: 'text-amber-700' };
    if (role === 'scholar')  return { title: 'Scholar',      sub: `${orgs.length} orgs`,       cls: 'text-amber-700' };
    if (contextOrg)          return { title: contextOrg.org_name, sub: contextOrg.org_role,    cls: 'text-gray-800' };
    return { title: 'No organization', sub: 'Register one below', cls: 'text-gray-400' };
  }

  const ctx = contextLabel();

  return (
    <aside className="w-[180px] flex-shrink-0 bg-white border-r border-gray-200
                      flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* Brand */}
      <div className="px-3 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-700 flex items-center
                          justify-center text-white text-xs font-medium flex-shrink-0">A</div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-gray-900 truncate">AmanahHub</div>
            <div className="text-[10px] text-gray-400">Console</div>
          </div>
        </div>
      </div>

      {/* Context label */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-50">
        <p className={`text-[11px] font-medium truncate leading-snug ${ctx.cls}`}>{ctx.title}</p>
        <p className="text-[9px] text-gray-400 truncate mt-0.5">{ctx.sub}</p>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">

        {/* Dashboard — always first */}
        <NavLink href="/dashboard" label="Dashboard" icon="▣" active={active('/dashboard')} />

        {/* ── Platform (super_admin only) ── */}
        {isSuperAdmin && (
          <>
            <SectionLabel label="Platform" color="violet" />
            <NavLink href="/admin/organizations" label="All orgs"   icon="≡" active={active('/admin/organizations')} />
            <NavLink href="/admin/users"         label="All users"  icon="♟" active={active('/admin/users')} />
            <NavLink href="/admin/audit"         label="Audit logs" icon="≡" active={active('/admin/audit')} />
          </>
        )}

        {/* ── New org (org members + super_admin) ── */}
        {(isOrgMember || isSuperAdmin) && (
          <div className="pt-1">
            <NavLink href="/onboarding/new" label="New org" icon="+" active={active('/onboarding/new')} />
          </div>
        )}

        {/* ── Review (reviewer + super_admin) ── */}
        {isReviewer && (
          <>
            <SectionLabel label="Review" color="amber" />
            <NavLink href="/review/onboarding"    label="All queues"    icon="≡"
              active={active('/review/onboarding') || active('/review/reports') ||
                      active('/review/certification') || active('/review/amanah') ||
                      active('/review/scholar')} />
            <NavLink href="/review/certification" label="CTCF eval"     icon="★" active={active('/review/certification')} />
            <NavLink href="/review/scholar"       label="Scholar notes"  icon="✎" active={active('/review/scholar')} />
            <NavLink href="/review/amanah"        label="Amanah score"  icon="▲" active={active('/review/amanah')} />
          </>
        )}

        {/* ── Selected org — shown when navigating to /orgs/[id]/... ── */}
        {/* For super_admin + reviewer: appears after Review section      */}
        {/* For org members: always shown with their default org          */}
        {orgId && (
          <>
            <SectionLabel
              label={isOrgMember ? 'Organization' : 'Selected org'}
              color="gray"
            />
            <NavLink
              href={`/orgs/${orgId}`}
              label="Overview" icon="◎"
              active={
                pathname === `/orgs/${orgId}` ||
                (active(`/orgs/${orgId}`) &&
                  !active(`/orgs/${orgId}/projects`) &&
                  !active(`/orgs/${orgId}/members`) &&
                  !active(`/orgs/${orgId}/financials`) &&
                  !active(`/orgs/${orgId}/certification`))
              }
            />
            <NavLink href={`/orgs/${orgId}/projects`}       label="Projects"      icon="▦" active={active(`/orgs/${orgId}/projects`)} />
            <NavLink href={`/orgs/${orgId}/financials`}     label="Financials"    icon="$" active={active(`/orgs/${orgId}/financials`)} />
            <NavLink href={`/orgs/${orgId}/certification`}  label="Certification" icon="★" active={active(`/orgs/${orgId}/certification`)} />
            <NavLink href={`/orgs/${orgId}/members`}        label="Members"       icon="♟" active={active(`/orgs/${orgId}/members`)} />
          </>
        )}

      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0">
        <p className="text-[11px] font-medium text-gray-700 truncate">{user.displayName}</p>
        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
        <p className={`text-[9px] font-medium mt-0.5 mb-2 ${
          isSuperAdmin ? 'text-violet-500' : isReviewer ? 'text-amber-500' : 'text-gray-400'
        }`}>
          {role.replace('_', ' ')}
        </p>
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

function SectionLabel({ label, color }: { label: string; color: 'violet' | 'amber' | 'gray' }) {
  const cls = {
    violet: 'text-violet-400',
    amber:  'text-amber-500',
    gray:   'text-gray-400',
  }[color];
  return (
    <div className="pt-3 pb-0.5">
      <p className={`px-2 text-[9px] font-medium uppercase tracking-wider ${cls}`}>{label}</p>
    </div>
  );
}

function NavLink({
  href, label, icon, active,
}: {
  href: string; label: string; icon: string; active?: boolean;
}) {
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
