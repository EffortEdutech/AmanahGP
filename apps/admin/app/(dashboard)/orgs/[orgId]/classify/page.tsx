// apps/admin/app/(dashboard)/orgs/[orgId]/classify/page.tsx
// AmanahHub Console — Onboarding step 2: Malaysia governance classification

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { classifyOrganization } from '../actions';
import { ClassifyForm }      from '@/components/org/classify-form';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Classification | AmanahHub Console' };

export default async function ClassifyPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, org_type, oversight_authority, fund_types, onboarding_status')
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{org.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Step 2 of 3 — Malaysia governance classification
        </p>
        <p className="mt-2 text-sm text-gray-500">
          This classification determines which CTCF criteria apply to your organization
          and ensures accurate trust scoring.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <StepBadge number={1} label="Basic profile" done />
        <div className="flex-1 h-px bg-emerald-200" />
        <StepBadge number={2} label="Classification" active />
        <div className="flex-1 h-px bg-gray-200" />
        <StepBadge number={3} label="Review & submit" />
      </div>

      <ClassifyForm
        orgId={orgId}
        action={classifyOrganization}
        defaultValues={{
          orgType:            org.org_type ?? '',
          oversightAuthority: org.oversight_authority ?? '',
          fundTypes:          org.fund_types ?? [],
        }}
      />
    </div>
  );
}

function StepBadge({
  number, label, active, done,
}: {
  number: number; label: string; active?: boolean; done?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
        ${done   ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' :
          active ? 'bg-emerald-700 text-white' :
                   'bg-gray-100 text-gray-400'}`}>
        {done ? '✓' : number}
      </div>
      <span className={`text-sm ${active ? 'text-gray-900 font-medium' : done ? 'text-emerald-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}
