// apps/user/app/account/page.tsx
// AmanahHub — Donor account page (requires auth via middleware)

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link             from 'next/link';

export const metadata = { title: 'My Account' };

export default async function AccountPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email, platform_role, created_at')
    .eq('auth_provider_user_id', user.id)
    .single();

  // Donation history for this donor
  const { data: donations } = await supabase
    .from('donation_transactions')
    .select(`
      id, amount, platform_fee_amount, currency, status,
      confirmed_at, initiated_at, gateway,
      organizations ( id, name ),
      projects ( id, title )
    `)
    .eq('donor_user_id', profile?.id ?? '')
    .order('initiated_at', { ascending: false })
    .limit(20);

  const totalConfirmed = (donations ?? [])
    .filter((d) => d.status === 'confirmed')
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My account</h1>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Profile
        </h2>
        <div className="space-y-3">
          <Row label="Name"   value={profile?.display_name ?? '—'} />
          <Row label="Email"  value={profile?.email ?? user.email ?? '—'} />
          <Row label="Member since"
               value={profile?.created_at
                 ? new Date(profile.created_at).toLocaleDateString('en-MY', {
                     year: 'numeric', month: 'long',
                   })
                 : '—'} />
        </div>
      </div>

      {/* Giving summary */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide mb-1">
          Total giving
        </h2>
        <p className="text-3xl font-bold text-emerald-700">
          MYR {totalConfirmed.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Across {(donations ?? []).filter(d => d.status === 'confirmed').length} confirmed donation{(donations ?? []).filter(d => d.status === 'confirmed').length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Donation history */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Donation history
        </h2>

        {donations?.length ? (
          <div className="space-y-3">
            {donations.map((d) => {
              const org     = Array.isArray(d.organizations) ? d.organizations[0] : d.organizations;
              const project = Array.isArray(d.projects)      ? d.projects[0]      : d.projects;
              const isOk    = d.status === 'confirmed';

              return (
                <Link key={d.id} href={`/donate/receipt/${d.id}`}
                  className="flex items-center justify-between px-5 py-4 bg-white
                             rounded-xl border border-gray-200 hover:border-emerald-200
                             transition-colors group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-800 truncate">
                      {org?.name ?? '—'}
                    </p>
                    {project && (
                      <p className="text-xs text-gray-400 truncate">{project.title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(d.initiated_at).toLocaleDateString('en-MY')}
                      {' · '}{d.gateway.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end ml-4 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {d.currency} {Number(d.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs font-medium mt-1 ${
                      isOk ? 'text-emerald-600' :
                      d.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="text-sm text-gray-400 mb-3">No donations yet.</p>
            <Link href="/charities"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                         text-white bg-emerald-700 hover:bg-emerald-800 transition-colors">
              Browse charities
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-32 text-sm text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
