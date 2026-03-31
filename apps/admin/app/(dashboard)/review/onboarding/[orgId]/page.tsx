// apps/admin/app/(dashboard)/review/onboarding/[orgId]/page.tsx
// AmanahHub Console — Org review detail (Sprint 8 UI uplift)
// Fixed: orgOnboardingDecision from '../../actions' (review/actions.ts, Sprint 2)

import { redirect }          from 'next/navigation';
import Link                  from 'next/link';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { StatusBadge, Badge, OrgRoleBadge } from '@/components/ui/badge';
import { ReviewDecisionForm } from '@/components/review/review-decision-form';
// orgOnboardingDecision lives in review/actions.ts — two levels up from [orgId]
import { orgOnboardingDecision } from '../../actions';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Review Organization | AmanahHub Console' };

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO / Welfare', mosque_surau: 'Mosque / Surau',
  waqf_institution: 'Waqf Institution', zakat_body: 'Zakat Body',
  foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function OrgReviewPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, contact_email,
      state, org_type, oversight_authority, fund_types, summary,
      onboarding_status, onboarding_submitted_at
    `)
    .eq('id', orgId).single();

  if (!org) redirect('/review/onboarding');

  const { data: members } = await supabase
    .from('org_members')
    .select(`org_role, status, users ( display_name, email )`)
    .eq('organization_id', orgId)
    .eq('status', 'active');

  const fundTypes = (org.fund_types ?? []) as string[];

  return (
    <div className="max-w-4xl">
      <Link href="/review/onboarding"
        className="text-[11px] text-gray-400 hover:text-emerald-700 mb-4 block">
        ← Onboarding queue
      </Link>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{org.name}</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {org.onboarding_submitted_at
              ? `Submitted ${new Date(org.onboarding_submitted_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Submission date unknown'}
          </p>
        </div>
        <StatusBadge status={org.onboarding_status} />
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Left: profile + members */}
        <div className="space-y-3">
          <div className="card p-4">
            <p className="sec-label">Organization profile</p>
            <table className="w-full text-[12px] border-collapse">
              <tbody>
                <TRow label="Legal name"   value={org.legal_name ?? '—'} />
                <TRow label="Registration" value={org.registration_no ?? '—'} />
                <TRow label="State"        value={org.state ?? '—'} />
                <TRow label="Type"         value={org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : '—'} />
                <TRow label="Oversight"    value={org.oversight_authority ?? '—'} />
              </tbody>
            </table>

            {fundTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {fundTypes.map((f) => (
                  <Badge key={f} variant="blue">{f.toUpperCase()}</Badge>
                ))}
              </div>
            )}

            {org.summary && (
              <>
                <div className="h-px bg-gray-100 my-3" />
                <p className="text-[12px] text-gray-700 leading-relaxed">{org.summary}</p>
              </>
            )}
          </div>

          <div className="card p-4">
            <p className="sec-label">Members ({members?.length ?? 0})</p>
            {members?.length ? (
              <div className="divide-y divide-gray-100">
                {members.map((m, i) => {
                  const u = Array.isArray(m.users) ? m.users[0] : m.users;
                  return (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <span className="text-[12px] text-gray-900">{u?.display_name ?? '—'}</span>
                        <span className="text-[11px] text-gray-400 ml-1">· {m.org_role}</span>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">No active members.</p>
            )}
          </div>
        </div>

        {/* Right: decision */}
        <div>
          <div className="card p-4">
            <p className="sec-label">Reviewer decision</p>
            <ReviewDecisionForm
              action={orgOnboardingDecision}
              hiddenFields={{ orgId }}
              mode="org"
              placeholder="Explain decision or list required changes…"
            />
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
