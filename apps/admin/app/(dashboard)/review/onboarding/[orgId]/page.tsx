// apps/admin/app/(dashboard)/review/onboarding/[orgId]/page.tsx
// AmanahHub Console — Reviewer: org onboarding detail + decision

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { ReviewDecisionForm } from '@/components/review/review-decision-form';
import { orgOnboardingDecision } from '../../actions';

interface Props { params: Promise<{ orgId: string }> }

export default async function ReviewOrgPage({ params }: Props) {
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
      id, name, legal_name, registration_no, website_url,
      contact_email, address_text, state, summary,
      org_type, oversight_authority, fund_types,
      onboarding_status, onboarding_submitted_at
    `)
    .eq('id', orgId).single();

  if (!org) redirect('/review/onboarding');

  const { data: members } = await supabase
    .from('org_members')
    .select('org_role, users ( display_name, email )')
    .eq('organization_id', orgId)
    .eq('status', 'active');

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a href="/review/onboarding" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← Onboarding queue
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">{org.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Submitted {org.onboarding_submitted_at
            ? new Date(org.onboarding_submitted_at).toLocaleDateString('en-MY')
            : '—'}
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-5">
        <SectionHead>Organization profile</SectionHead>
        <Row label="Legal name"          value={org.legal_name ?? '—'} />
        <Row label="Registration no."    value={org.registration_no ?? '—'} />
        <Row label="State"               value={org.state ?? '—'} />
        <Row label="Website"             value={org.website_url ?? '—'} />
        <Row label="Contact email"       value={org.contact_email ?? '—'} />
        <Row label="Summary"             value={org.summary ?? '—'} />
      </div>

      {/* Classification */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-5">
        <SectionHead>Governance classification</SectionHead>
        <Row label="Type"               value={org.org_type?.replace('_', ' ') ?? '—'} />
        <Row label="Oversight"          value={org.oversight_authority ?? '—'} />
        <Row label="Fund types"
             value={(org.fund_types ?? []).join(', ').toUpperCase() || '—'} />
      </div>

      {/* Members */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <SectionHead>Registered members ({members?.length ?? 0})</SectionHead>
        {members?.map((m, i) => {
          const u = Array.isArray(m.users) ? m.users[0] : m.users;
          return (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">{u?.display_name ?? '—'}</p>
                <p className="text-xs text-gray-400">{u?.email}</p>
              </div>
              <span className="text-xs text-gray-500">{m.org_role?.replace('org_', '')}</span>
            </div>
          );
        })}
      </div>

      {/* Decision form */}
      {org.onboarding_status === 'submitted' && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Reviewer decision
          </h2>
          <ReviewDecisionForm
            hiddenFields={{ orgId }}
            action={orgOnboardingDecision}
            decisions={[
              { value: 'approved',           label: 'Approve',           color: 'emerald' },
              { value: 'changes_requested',  label: 'Request changes',   color: 'amber' },
              { value: 'rejected',           label: 'Reject',            color: 'red' },
            ]}
            commentLabel="Reviewer notes (visible to org admin)"
            successRedirect="/review/onboarding"
          />
        </div>
      )}

      {org.onboarding_status !== 'submitted' && (
        <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
          Decision already recorded: <strong>{org.onboarding_status}</strong>
        </div>
      )}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-3 bg-gray-50">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</h3>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex gap-4">
      <dt className="w-40 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}
