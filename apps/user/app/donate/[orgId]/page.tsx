// apps/user/app/donate/[orgId]/page.tsx
// AmanahHub — Donation checkout page

import { notFound }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DonateForm }   from '@/components/donation/donate-form';
import { initiateDonation } from '@/app/actions/donations';

interface Props {
  params:       Promise<{ orgId: string }>;
  searchParams: Promise<{ project?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const { data }  = await supabase
    .from('organizations').select('name').eq('id', orgId).single();
  return { title: `Donate to ${data?.name ?? 'Charity'}` };
}

export default async function DonatePage({ params, searchParams }: Props) {
  const { orgId }   = await params;
  const { project: projectId } = await searchParams;
  const supabase    = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, summary, listing_status')
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  // Optional project context
  const { data: project } = projectId
    ? await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .eq('organization_id', orgId)
        .eq('is_public', true)
        .single()
    : { data: null };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Org card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center
                          text-emerald-700 font-bold text-lg flex-shrink-0">
            {org.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{org.name}</p>
            {project && (
              <p className="text-xs text-gray-400">for: {project.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Non-custodial notice */}
      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100
                      rounded-lg px-4 py-3 mb-6">
        <span className="text-emerald-600 mt-0.5 text-sm flex-shrink-0">ℹ</span>
        <p className="text-xs text-emerald-700">
          Your donation goes <strong>directly to {org.name}</strong> via ToyyibPay.
          AmanahHub does not hold your funds at any point.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-5">
          Make a donation
        </h1>
        <DonateForm
          orgId={org.id}
          orgName={org.name}
          projectId={project?.id}
          action={initiateDonation}
        />
      </div>
    </div>
  );
}
