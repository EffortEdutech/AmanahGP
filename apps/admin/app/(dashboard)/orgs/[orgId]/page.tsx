// apps/admin/app/(dashboard)/orgs/[orgId]/page.tsx
// AmanahHub Console — Org profile (Sprint 8 UI uplift)
// Matches UAT s-a-org: 2-col layout, details table, governance classification, quick links

import { redirect }    from 'next/navigation';
import Link            from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge, Badge }  from '@/components/ui/badge';

interface Props { params: Promise<{ orgId: string }> }

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const { data }  = await supabase
    .from('organizations').select('name').eq('id', orgId).single();
  return { title: `${data?.name ?? 'Organization'} | AmanahHub Console` };
}

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO / Welfare', mosque_surau: 'Mosque / Surau',
  waqf_institution: 'Waqf Institution', zakat_body: 'Zakat Body',
  foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function OrgProfilePage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, contact_email,
      state, org_type, oversight_authority, fund_types, summary,
      onboarding_status, listing_status, approved_at
    `)
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  const { data: isAdmin } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_admin' });

  const { data: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  const fundTypes = (org.fund_types ?? []) as string[];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{org.name}</h1>
          {org.legal_name && org.legal_name !== org.name && (
            <p className="text-[11px] text-gray-400 mt-0.5">{org.legal_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={org.onboarding_status} />
          {org.listing_status === 'listed' && <StatusBadge status="listed" />}
          {isAdmin && (
            <Link href={`/orgs/${orgId}/edit`} className="btn-secondary">
              Edit profile
            </Link>
          )}
        </div>
      </div>

      {/* 2-col body */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left column */}
        <div className="space-y-3">

          {/* Org details */}
          <div className="card p-4">
            <p className="sec-label">Organization details</p>
            <table className="w-full text-[12px] border-collapse">
              <tbody>
                <TRow label="Registration" value={org.registration_no ?? '—'} />
                <TRow label="State"        value={org.state ?? '—'} />
                {org.website_url && (
                  <tr>
                    <td className="py-1.5 text-gray-400 w-[120px]">Website</td>
                    <td className="py-1.5">
                      <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline truncate block max-w-[160px]">
                        {org.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                  </tr>
                )}
                {org.contact_email && (
                  <TRow label="Contact" value={org.contact_email} />
                )}
                {org.approved_at && (
                  <TRow
                    label="Approved"
                    value={new Date(org.approved_at).toLocaleDateString('en-MY', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  />
                )}
              </tbody>
            </table>
          </div>

          {/* Governance classification */}
          <div className="card p-4">
            <p className="sec-label">Governance classification</p>
            <table className="w-full text-[12px] border-collapse">
              <tbody>
                <TRow
                  label="Type"
                  value={org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : '—'}
                />
                <TRow label="Oversight" value={org.oversight_authority ?? '—'} />
              </tbody>
            </table>
            {fundTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {fundTypes.map((f) => (
                  <Badge key={f} variant="blue">
                    {f.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-3">

          {/* Summary */}
          <div className="card p-4">
            <p className="sec-label">Public summary</p>
            <p className="text-[12px] text-gray-700 leading-relaxed">
              {org.summary ?? 'No summary provided yet.'}
            </p>
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <p className="sec-label">Quick links</p>
            <div className="space-y-1.5">
              <Link href={`/orgs/${orgId}/projects`}
                className="btn-secondary w-full justify-start text-xs py-2">
                View projects ({(projectCount as any)?.count ?? 0} active)
              </Link>
              <Link href={`/orgs/${orgId}/financials`}
                className="btn-secondary w-full justify-start text-xs py-2">
                Financial snapshots
              </Link>
              <Link href={`/orgs/${orgId}/certification`}
                className="btn-secondary w-full justify-start text-xs py-2">
                Certification status
              </Link>
              <Link href={`/orgs/${orgId}/members`}
                className="btn-secondary w-full justify-start text-xs py-2">
                Manage members
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-gray-400 w-[120px] align-top">{label}</td>
      <td className="py-1.5 text-gray-800">{value}</td>
    </tr>
  );
}
