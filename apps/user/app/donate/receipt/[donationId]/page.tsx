// apps/user/app/donate/receipt/[donationId]/page.tsx
// AmanahHub — Donation receipt page (Sprint 7 UI uplift)
// Data fetching unchanged (service client for anon access) — visual layer replaced

import { createServiceClient } from '@/lib/supabase/server';
import Link                    from 'next/link';

interface Props { params: Promise<{ donationId: string }> }

export const metadata = { title: 'Donation Receipt | AmanahHub' };

export default async function ReceiptPage({ params }: Props) {
  const { donationId } = await params;
  const svc = createServiceClient();

  const { data: donation } = await svc
    .from('donation_transactions')
    .select(`
      id, amount, platform_fee_amount, currency, status,
      confirmed_at, initiated_at, gateway,
      organizations ( id, name ),
      projects      ( id, title )
    `)
    .eq('id', donationId)
    .single();

  if (!donation) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-[13px] text-gray-400 mb-4">Receipt not found.</p>
        <Link href="/charities"
          className="text-[12px] text-emerald-700 hover:underline">
          Browse charities
        </Link>
      </div>
    );
  }

  const org      = Array.isArray(donation.organizations) ? donation.organizations[0] : donation.organizations;
  const project  = Array.isArray(donation.projects)      ? donation.projects[0]      : donation.projects;
  const status   = donation.status;
  const isOk     = status === 'confirmed';
  const isPending = ['initiated', 'pending'].includes(status);

  const statusConfig = {
    bg:    isOk ? 'bg-emerald-700' : isPending ? 'bg-amber-500' : 'bg-gray-400',
    icon:  isOk ? '✓' : isPending ? '⏳' : '✕',
    label: isOk ? 'Donation confirmed' : isPending ? 'Payment pending' : 'Payment not completed',
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card overflow-hidden">

        {/* Status header */}
        <div className={`${statusConfig.bg} px-6 py-6 text-center`}>
          <div className="text-4xl text-white mb-2 leading-none">{statusConfig.icon}</div>
          <h1 className="text-white font-semibold text-[15px]">{statusConfig.label}</h1>
          {isPending && (
            <p className="text-white/70 text-[11px] mt-1">
              Refresh this page after completing payment.
            </p>
          )}
        </div>

        {/* Receipt rows */}
        <div className="divide-y divide-gray-100 px-5">
          <Row label="Organization"          value={org?.name ?? '—'} />
          {project && <Row label="Project"   value={project.title} />}
          <Row
            label="Donation amount"
            value={`${donation.currency} ${Number(donation.amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
            bold
          />
          <Row
            label="Platform contribution (2%)"
            value={`${donation.currency} ${Number(donation.platform_fee_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
            dim
          />
          <Row label="Gateway"    value={donation.gateway.toUpperCase()} />
          <Row label="Reference"  value={donation.id.slice(0, 16).toUpperCase()} mono />
          {donation.confirmed_at && (
            <Row
              label="Confirmed"
              value={new Date(donation.confirmed_at).toLocaleString('en-MY', {
                dateStyle: 'medium', timeStyle: 'short',
              })}
            />
          )}
          <Row
            label="Status"
            value={status.charAt(0).toUpperCase() + status.slice(1)}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 text-center space-y-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Save this page URL as your receipt. Your donation was processed
            directly to {org?.name ?? 'the charity'} via ToyyibPay.
            AmanahHub does not hold any funds.
          </p>
          <Link href={`/charities/${org?.id}`}
            className="text-[12px] text-emerald-700 hover:text-emerald-800 font-medium">
            ← Back to {org?.name ?? 'charity'}
          </Link>
        </div>

      </div>
    </div>
  );
}

function Row({
  label, value, bold, dim, mono,
}: {
  label: string; value: string;
  bold?: boolean; dim?: boolean; mono?: boolean;
}) {
  return (
    <div className="py-3 flex justify-between items-start gap-4">
      <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-[12px] text-right break-all
        ${bold ? 'font-semibold text-gray-900' : dim ? 'text-gray-400' : 'text-gray-700'}
        ${mono ? 'font-mono text-[10px] tracking-wider' : ''}`}>
        {value}
      </span>
    </div>
  );
}
