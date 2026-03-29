// apps/user/app/donate/receipt/[donationId]/page.tsx
// AmanahHub — Donation receipt page
// Accessible via URL after ToyyibPay redirect (no auth required — ADR-004)

import { createClient } from '@/lib/supabase/server';
import Link             from 'next/link';

interface Props { params: Promise<{ donationId: string }> }

export const metadata = { title: 'Donation Receipt' };

export default async function ReceiptPage({ params }: Props) {
  const { donationId } = await params;
  const supabase = await createClient();

  // Read via service role so anon donors can view their own receipt by ID
  // RLS allows anon insert but not select — receipt URL is the "token"
  const { data: donation } = await supabase
    .from('donation_transactions')
    .select(`
      id, amount, platform_fee_amount, currency, status,
      confirmed_at, initiated_at, gateway,
      organizations ( id, name ),
      projects ( id, title )
    `)
    .eq('id', donationId)
    .single();

  if (!donation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-sm">Receipt not found.</p>
        <Link href="/charities" className="mt-4 inline-block text-emerald-700 text-sm hover:underline">
          Browse charities
        </Link>
      </div>
    );
  }

  const org     = Array.isArray(donation.organizations) ? donation.organizations[0] : donation.organizations;
  const project = Array.isArray(donation.projects)      ? donation.projects[0]      : donation.projects;
  const isConfirmed = donation.status === 'confirmed';
  const isPending   = ['initiated', 'pending'].includes(donation.status);

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Status header */}
        <div className={`px-6 py-5 text-center ${
          isConfirmed ? 'bg-emerald-700' :
          isPending   ? 'bg-amber-500' : 'bg-gray-400'
        }`}>
          <div className="text-3xl mb-2">
            {isConfirmed ? '✓' : isPending ? '⏳' : '✗'}
          </div>
          <h1 className="text-white font-semibold text-lg">
            {isConfirmed ? 'Donation confirmed' :
             isPending   ? 'Payment pending' : 'Payment not completed'}
          </h1>
          {isPending && (
            <p className="text-amber-100 text-xs mt-1">
              Refresh this page after completing payment.
            </p>
          )}
        </div>

        {/* Receipt details */}
        <div className="px-6 py-5 divide-y divide-gray-100">
          <Row label="Organization" value={org?.name ?? '—'} />
          {project && <Row label="Project" value={project.title} />}
          <Row
            label="Amount"
            value={`${donation.currency} ${Number(donation.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          />
          <Row
            label="Platform contribution"
            value={`${donation.currency} ${Number(donation.platform_fee_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
          />
          <Row label="Gateway" value={donation.gateway.toUpperCase()} />
          <Row label="Reference" value={donation.id.slice(0, 16).toUpperCase()} />
          {donation.confirmed_at && (
            <Row
              label="Confirmed"
              value={new Date(donation.confirmed_at).toLocaleString('en-MY')}
            />
          )}
          <Row label="Status" value={donation.status.toUpperCase()} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-400 mb-3">
            Save this page URL as your receipt reference.
          </p>
          <Link href={`/charities/${org?.id}`}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
            ← Back to {org?.name ?? 'charity'}
          </Link>
        </div>
      </div>

      {/* Non-custodial reminder */}
      <p className="text-xs text-center text-gray-400 mt-4">
        Your donation was processed directly to {org?.name ?? 'the charity'} via ToyyibPay.
        AmanahHub does not hold any funds.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 flex justify-between gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right break-all">{value}</span>
    </div>
  );
}
