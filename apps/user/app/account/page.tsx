// apps/user/app/account/page.tsx
// AmanahHub — Donor account page

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/badge';

export const metadata = { title: 'My Account | AmanahHub' };

type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  platform_role: string | null;
  created_at: string | null;
};

type RelatedOrg = {
  id: string;
  name: string;
};

type RelatedProject = {
  id: string;
  title: string;
};

type DonationRow = {
  id: string;
  amount: number | string;
  platform_fee_amount: number | string | null;
  currency: string;
  status: string;
  confirmed_at: string | null;
  initiated_at: string | null;
  gateway: string | null;
  organizations: RelatedOrg | RelatedOrg[] | null;
  projects: RelatedProject | RelatedProject[] | null;
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/account');

  const { data: profileData } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role, created_at')
    .eq('auth_provider_user_id', user.id)
    .single();

  const profile = (profileData ?? null) as UserProfile | null;

  const { data: donationsData } = await supabase
    .from('donation_transactions')
    .select(`
      id, amount, platform_fee_amount, currency, status,
      confirmed_at, initiated_at, gateway,
      organizations ( id, name ),
      projects      ( id, title )
    `)
    .eq('donor_user_id', profile?.id ?? '')
    .order('initiated_at', { ascending: false })
    .limit(20);

  const donations = (donationsData ?? []) as DonationRow[];

  const confirmed = donations.filter((d) => d.status === 'confirmed');
  const totalConfirmed = confirmed.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-5">My account</h1>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBlock
          value={`MYR ${totalConfirmed.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          label="Total giving"
          highlight
        />
        <StatBlock value={String(confirmed.length)} label="Confirmed" />
        <StatBlock value={String(donations.length)} label="All donations" />
      </div>

      <div className="card p-4 mb-4">
        <p className="sec-label">Profile</p>
        <div className="space-y-2">
          <ProfileRow label="Name" value={profile?.display_name ?? '—'} />
          <ProfileRow label="Email" value={profile?.email ?? user.email ?? '—'} />
          <ProfileRow
            label="Member since"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-MY', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </div>
      </div>

      <div className="card p-4">
        <p className="sec-label">Donation history</p>

        {donations.length ? (
          <div className="space-y-2">
            {donations.map((d) => {
              const org = Array.isArray(d.organizations) ? d.organizations[0] : d.organizations;
              const project = Array.isArray(d.projects) ? d.projects[0] : d.projects;
              const date = d.confirmed_at ?? d.initiated_at;

              return (
                <Link key={d.id} href={`/donate/receipt/${d.id}`} className="list-item">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      d.status === 'confirmed'
                        ? 'bg-emerald-500'
                        : ['initiated', 'pending'].includes(d.status)
                          ? 'bg-amber-400'
                          : 'bg-gray-300'
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-gray-900 truncate">
                      {org?.name ?? '—'}
                    </p>
                    {project && (
                      <p className="text-[10px] text-gray-400 truncate">{project.title}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-[12px] font-semibold text-gray-900">
                      {d.currency}{' '}
                      {Number(d.amount).toLocaleString('en-MY', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <StatusBadge status={d.status} />
                      {date && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(date).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[12px] text-gray-400 mb-3">No donations yet.</p>
            <Link href="/charities" className="btn-primary text-xs px-4 py-2">
              Browse charities
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-3 ${highlight ? 'bg-emerald-50 border-emerald-100' : ''}`}>
      <div className={`stat-val text-[16px] ${highlight ? 'text-emerald-700' : ''}`}>
        {value}
      </div>
      <div className={`stat-lbl ${highlight ? 'text-emerald-600' : ''}`}>{label}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[11px] text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-[12px] text-gray-800">{value}</span>
    </div>
  );
}