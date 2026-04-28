// apps/org/app/(protected)/org/[orgId]/layout.tsx
// amanahOS — Org-scoped layout (URL-based org context)
//
// super_admin is NOT required to be an org_members row.
// The layout lists all organizations and wraps every /org/[orgId]/... page with sidebar navigation.

import { redirect } from 'next/navigation';
import { OrgShell } from '@/components/layout/org-shell';
import { listAccessibleOrgsForAmanahOs } from '@/lib/access/org-access';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { platformUser, orgs } = await listAccessibleOrgsForAmanahOs();

  if (orgs.length === 0) {
    redirect('/no-access?reason=no_org_membership');
  }

  const currentOrg = orgs.find((o) => o.organization_id === orgId);
  if (!currentOrg) {
    redirect(`/org/${orgs[0].organization_id}/dashboard`);
  }

  return (
    <OrgShell
      currentOrgId={orgId}
      user={{
        displayName: platformUser.display_name ?? platformUser.email ?? 'User',
        email: platformUser.email ?? '',
        platformRole: platformUser.platform_role ?? '',
      }}
      orgs={orgs}
    >
      {children}
    </OrgShell>
  );
}
