// apps/user/app/donate/[orgId]/page.tsx
// AmanahHub — Donation checkout page (Sprint 7 UI uplift)

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DonateForm } from '@/components/donation/donate-form';
import { initiateDonation } from '@/app/actions/donations';

interface Props {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ project?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  return {
    title: `Donate to ${data?.name ?? 'Charity'} | AmanahHub`,
  };
}

export default async function DonatePage({ params, searchParams }: Props) {
  const { orgId } = await params;
  const { project: projectId } = await searchParams;

  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, summary, listing_status')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  const { data: project } = projectId
    ? await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .eq('is_public', true)
        .single()
    : { data: null };

  async function donateAction(formData: FormData): Promise<void> {
    'use server';

    const amount = Number(formData.get('amount') ?? 0);
    const donorEmailRaw = formData.get('email');
    const donorEmail =
      typeof donorEmailRaw === 'string' && donorEmailRaw.trim() !== ''
        ? donorEmailRaw.trim()
        : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid donation amount');
    }

    const platformFeeAmount = Number((amount * 0.02).toFixed(2));

    const result = await initiateDonation({
      organizationId: orgId,
      projectId: project?.id,
      amount,
      platformFeeAmount,
      currency: 'MYR',
      donorEmail,
    });

    if (!result.ok || !result.checkoutUrl) {
      throw new Error(result.error ?? 'Failed to initiate donation');
    }

    redirect(result.checkoutUrl);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <a
          href={`/charities/${org.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {org.name}
        </a>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0 select-none">
            {org.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">
              {org.name}
            </p>

            {project && (
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                for: {project.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 mb-4">
        <svg
          className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 16 16"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 7v5M8 5.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        <p className="text-[11px] text-emerald-700 leading-relaxed">
          Your donation goes <strong>directly to {org.name}</strong> via ToyyibPay.
          AmanahHub does not hold your funds at any point.
        </p>
      </div>

      <div className="card p-5">
        <h1 className="text-[15px] font-semibold text-gray-900 mb-4">
          Make a donation
        </h1>

        <DonateForm
          orgId={org.id}
          orgName={org.name}
          projectId={project?.id}
          action={donateAction}
        />
      </div>
    </div>
  );
}