// apps/org/app/(protected)/dashboard/page.tsx
// amanahOS — Dashboard entry redirect
//
// There is no sidebar on /dashboard because sidebar lives under /org/[orgId]/layout.tsx.
// Therefore successful login always redirects to /org/[firstOrgId]/dashboard.

import { redirect } from 'next/navigation';
import { listAccessibleOrgsForAmanahOs } from '@/lib/access/org-access';

export const metadata = { title: 'amanahOS' };

export default async function DashboardRedirectPage() {
  const { orgs } = await listAccessibleOrgsForAmanahOs();

  if (!orgs.length) {
    redirect('/no-access?reason=no_org_membership');
  }

  redirect(`/org/${orgs[0].organization_id}/dashboard`);
}
