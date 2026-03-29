'use client';
// apps/admin/components/layout/sidebar.tsx
// AmanahHub Console — Main sidebar (updated Sprint 4: all links wired)

import Link              from 'next/link';
import { usePathname }   from 'next/navigation';
import { signOut }       from '@/app/(auth)/actions';
import {
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  QueueListIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

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
  return role === 'reviewer' || role === 'super_admin';
}

export function Sidebar({ user, orgs }: SidebarProps) {
  const pathname = usePathname();
  const firstOrg = orgs[0];
  const orgId    = firstOrg?.organization_id;

  // Build nav items dynamically — link to first org if available
  const NAV_ITEMS = [
    { label: 'Dashboard',     href: '/dashboard',                             icon: ChartBarIcon },
    { label: 'Organization',  href: orgId ? `/orgs/${orgId}` : '/onboarding/new', icon: BuildingOffice2Icon },
    { label: 'Projects',      href: orgId ? `/orgs/${orgId}/projects` : '#',   icon: ClipboardDocumentListIcon },
    { label: 'Members',       href: orgId ? `/orgs/${orgId}/members` : '#',    icon: UserGroupIcon },
    { label: 'Financials',    href: orgId ? `/orgs/${orgId}/financials` : '#', icon: BanknotesIcon },
    { label: 'Certification', href: orgId ? `/orgs/${orgId}/certification` : '#', icon: ShieldCheckIcon },
  ];

  const REVIEWER_NAV = [
    { label: 'Onboarding queue', href: '/review/onboarding', icon: QueueListIcon },
    { label: 'Reports queue',    href: '/review/reports',    icon: DocumentChartBarIcon },
  ];

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center
                          text-white text-sm font-bold flex-shrink-0">A</div>
          <div>
            <div className="text-sm font-semibold text-gray-900">AmanahHub</div>
            <div className="text-xs text-gray-400">Console</div>
          </div>
        </div>
      </div>

      {/* Org context */}
      {firstOrg ? (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Organization</p>
          <Link href={`/orgs/${firstOrg.organization_id}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50
                       text-sm font-medium text-gray-800 truncate">
            <BuildingOffice2Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{firstOrg.org_name}</span>
          </Link>
          <Link href="/onboarding/new"
            className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
                       text-emerald-700 hover:bg-emerald-50 font-medium">
            <PlusCircleIcon className="w-4 h-4" />
            Add organization
          </Link>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-gray-100">
          <Link href="/onboarding/new"
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm
                       text-emerald-700 hover:bg-emerald-50 font-medium">
            <PlusCircleIcon className="w-4 h-4" />
            Register organization
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
              ${isActive(item.href)
                ? 'bg-emerald-50 text-emerald-800 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${item.href === '#' ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {isReviewer(user.platformRole) && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-medium text-gray-400
                            uppercase tracking-wider">
              Reviewer
            </div>
            {REVIEWER_NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                  ${isActive(item.href)
                    ? 'bg-emerald-50 text-emerald-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-800 truncate">
            {user.displayName}
          </div>
          <div className="text-xs text-gray-400 truncate">{user.email}</div>
        </div>
        <form action={signOut}>
          <button type="submit"
            className="flex items-center gap-2 text-xs text-gray-500
                       hover:text-gray-700 transition-colors w-full">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
