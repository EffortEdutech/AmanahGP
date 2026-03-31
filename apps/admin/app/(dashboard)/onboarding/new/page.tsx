// apps/admin/app/(dashboard)/onboarding/new/page.tsx
// AmanahHub Console — New org registration
// Fixed: removed the redirect that sent users away if they already had an org.
// Any authenticated user (including super_admin and org members) can register a new org.

import { redirect }           from 'next/navigation';
import { createClient }       from '@/lib/supabase/server';
import { createOrganization } from '../../orgs/actions';
import { OnboardingForm }     from './onboarding-form';

export const metadata = { title: 'Register Organization | AmanahHub Console' };

export default async function NewOrgPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // No redirect for existing org members — any user may register additional orgs.
  // Super admin can register on behalf of any party.

  return (
    <div className="max-w-xl">
      <h1 className="text-[18px] font-semibold text-gray-900 mb-0.5">
        Register organization
      </h1>
      <p className="text-[11px] text-gray-400 mb-5">
        Step 1 of 3 — Basic profile and Malaysia governance classification
      </p>

      <StepIndicator current={1} />

      <OnboardingForm action={createOrganization} />
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: 'Basic profile',  done: current > 1 },
    { n: 2, label: 'Classification', done: current > 2 },
    { n: 3, label: 'Review',         done: false        },
  ];

  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center
                          text-[10px] font-medium flex-shrink-0 ${
            step.done        ? 'bg-emerald-100 text-emerald-700' :
            step.n === current ? 'bg-emerald-700 text-white'    : 'bg-gray-100 text-gray-400'
          }`}>
            {step.done ? '✓' : step.n}
          </div>
          <span className={`text-[11px] truncate ${
            step.n === current ? 'font-medium text-gray-900' :
            step.done          ? 'text-emerald-700'          : 'text-gray-400'
          }`}>
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px ${step.done ? 'bg-emerald-200' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
