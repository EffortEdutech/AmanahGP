import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrustBadge } from '@/components/ui/trust-badge';
import {
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  orgTypeLabel,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Donate — AmanahHub',
};

type PageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function DonatePage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('v_amanahhub_public_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) notFound();

  const org = profile as PublicTrustProfile;
  const score = Number(org.amanah_index_score ?? 0);
  const hasScore = canShowTrustScore(org);
  const trustGrade = hasScore ? getTrustGrade(score) : null;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';
  const orgLabel = orgTypeLabel(org.org_type) ?? 'Organisation';
  const referenceCode = buildDonationReference(org.name, org.organization_id ?? orgId);
  const placeholderBank = buildPlaceholderBankDetails(org.name, referenceCode);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/charities/${org.organization_id ?? orgId}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            <span aria-hidden="true">&larr;</span> Back to trust profile
          </Link>
          <Link href="/charities" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Browse other charities
          </Link>
        </div>

        <section className="overflow-hidden rounded-[34px] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_390px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${stageMeta.accentClass}`}>
                  {org.governance_stage_label ?? stageMeta.label}
                </span>
                {isCertified ? (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Certified
                  </span>
                ) : null}
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Non-custodial donation
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Give directly to {org.name}
              </h1>

              <p className="mt-4 max-w-3xl text-[15px] leading-8 text-slate-600">
                AmanahHub helps donors see trust signals before giving. The money is sent directly to the charity's verified bank or payment channel, not held by AmanahHub.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{orgLabel}</span>
                {org.state ? <span>&bull; {org.state}</span> : null}
                {org.registration_no ? <span>&bull; Reg. {org.registration_no}</span> : null}
              </div>
            </div>

            <div className="border-t border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Trust card
              </div>
              {trustGrade ? (
                <TrustBadge
                  score={score}
                  grade={trustGrade.grade}
                  gradeLabel={trustGrade.label}
                  gradeSublabel={trustGrade.gradeSublabel}
                  lastUpdated={org.published_at ?? org.public_updated_at}
                  certified={isCertified}
                  size="lg"
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-white shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold">Amanah Index in progress</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-50/80">
                    The full public trust score is still being reviewed. Donors can still give directly using the verified details below.
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-7 text-emerald-50/85 backdrop-blur">
                {summary}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <DonationMethodCard
            title="DuitNow QR"
            label="Fast direct giving"
            description="Scan the QR code with your Malaysian banking app or e-wallet. This placeholder can later be replaced by the charity's verified DuitNow QR image."
          >
            <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-center">
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4 shadow-inner">
                <img
                  src="/images/placeholders/duitnow-qr-placeholder.svg"
                  alt="DuitNow QR placeholder"
                  className="h-auto w-full rounded-2xl bg-white"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-950">Scan to donate directly</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  After payment, keep your bank receipt. In the next phase, donors may upload proof of transfer so the charity can reconcile donations faster.
                </p>

                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Placeholder QR for UI testing</p>
                  <p className="mt-1 leading-6">
                    Replace this image with the organisation's verified DuitNow QR before production use.
                  </p>
                </div>
              </div>
            </div>
          </DonationMethodCard>

          <DonationMethodCard
            title="Bank transfer"
            label="Verified account details"
            description="Use the charity's registered bank details. For clean reconciliation, include the reference code below in your transfer note."
          >
            <div className="space-y-3">
              <BankDetail label="Account name" value={placeholderBank.accountName} />
              <BankDetail label="Bank" value={placeholderBank.bankName} />
              <BankDetail label="Account no." value={placeholderBank.accountNo} mono />
              <BankDetail label="Transfer reference" value={placeholderBank.reference} mono highlight />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              This section is designed for Phase 1: charity-uploaded verified bank account and DuitNow QR. The placeholder data keeps the donor page attractive while the payment-method verification workflow is being completed.
            </div>
          </DonationMethodCard>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Optional external ToyyibPay link</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Some charities may already have their own ToyyibPay donation page. AmanahHub can show that external link without holding funds or registering gateway accounts for every charity.
            </p>
            <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              External ToyyibPay link placeholder. Add the organisation's own verified link when available.
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Before you give</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <TrustStep number="1" title="Check trust" text="Review the Amanah card and public profile." />
              <TrustStep number="2" title="Pay direct" text="Use DuitNow QR, bank transfer, or the charity's own gateway." />
              <TrustStep number="3" title="Keep proof" text="Save your receipt for tax, reconciliation, or follow-up." />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DonationMethodCard({
  title,
  label,
  description,
  children,
}: {
  title: string;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">{label}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
        </div>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          Direct to charity
        </span>
      </div>
      <p className="mb-6 text-sm leading-7 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function BankDetail({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold text-slate-900 ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function TrustStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
        {number}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function buildPlaceholderBankDetails(orgName: string, reference: string) {
  return {
    accountName: orgName,
    bankName: 'Maybank Islamic Berhad',
    accountNo: '5621 0948 7392',
    reference,
  };
}

function buildDonationReference(orgName: string, orgId: string) {
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AGP';

  const idPart = orgId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  return `${initials}-${idPart}-DONATION`;
}
