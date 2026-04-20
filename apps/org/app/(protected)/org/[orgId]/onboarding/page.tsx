// apps/org/app/(protected)/onboarding/page.tsx
// amanahOS — Onboarding Wizard: "Amanah Ready"
// Sprint 21
//
// The most critical UX moment in the NGO journey.
// "Let's help you become Amanah Ready."
//
// Progress bar: 0 → 100% Trust Readiness
// 7 steps — each checks real database state.

import { redirect }              from 'next/navigation';
import Link                      from 'next/link';
import { createClient }          from '@/lib/supabase/server';
import { createServiceClient }   from '@/lib/supabase/service';
import { getOnboardingState }    from '@/lib/onboarding-state';

export const metadata = { title: 'Amanah Ready — amanahOS' };

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id, display_name')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name)')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');
  const state = await getOnboardingState(service, orgId);

  const gradeLabel =
    state.pct === 100 ? 'Amanah Ready ✓' :
    state.pct >= 70   ? 'Almost there' :
    state.pct >= 40   ? 'Good progress' :
                        'Just starting';

  const gradeColor =
    state.pct === 100 ? 'text-emerald-700' :
    state.pct >= 70   ? 'text-blue-700' :
    state.pct >= 40   ? 'text-amber-700' :
                        'text-gray-600';

  const firstName = platformUser.display_name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-emerald-50 border border-emerald-200 text-emerald-700
                          text-[11px] font-semibold uppercase tracking-widest">
            Amanah Ready Program
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Assalamualaikum, {firstName}
          </h1>
          <p className="text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed">
            Let's help <span className="font-semibold text-gray-700">{state.orgName}</span> become
            Amanah Ready — trusted, audit-ready, and visible to donors.
          </p>
        </div>

        {/* ── Progress bar ─────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-gray-700">Trust Readiness</p>
              <p className={`text-[11px] font-medium mt-0.5 ${gradeColor}`}>{gradeLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-gray-900">{state.pct}%</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {state.completedCount} of {state.totalSteps} complete
              </p>
            </div>
          </div>

          {/* Segmented progress bar */}
          <div className="flex gap-1">
            {state.steps.map((step) => (
              <div key={step.id} className="flex-1 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full w-full rounded-full transition-all duration-500 ${
                  step.done ? 'bg-emerald-500' : 'bg-gray-100'
                }`} />
              </div>
            ))}
          </div>

          {/* Trust score note */}
          {state.pct > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-emerald-500 text-sm">▲</span>
              <p className="text-[11px] text-gray-500">
                Each step emits a trust event and updates your Amanah Index score in real time.
              </p>
              <Link href={`/org/${orgId}/trust`}
                className="text-[11px] text-emerald-600 hover:underline flex-shrink-0">
                View score →
              </Link>
            </div>
          )}
        </div>

        {/* ── Steps ─────────────────────────────────────────── */}
        <div className="space-y-3">
          {state.steps.map((step, idx) => {
            const isPrev    = idx < state.steps.findIndex((s) => !s.done);
            const isCurrent = step === state.currentStep;

            return (
              <div key={step.id}
                className={`rounded-xl border transition-all duration-200 ${
                  step.done
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isCurrent
                    ? 'border-blue-300 bg-blue-50/30 shadow-sm'
                    : 'border-gray-200 bg-white opacity-70'
                }`}>

                <div className="flex items-start gap-4 p-5">
                  {/* Step indicator */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    flex-shrink-0 text-sm font-bold transition-all
                    ${step.done
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}>
                    {step.done ? '✓' : step.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-medium">
                            Step {step.number}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full
                                            bg-blue-100 text-blue-700">
                              Next →
                            </span>
                          )}
                        </div>
                        <p className={`text-[14px] font-semibold mt-0.5 ${
                          step.done ? 'text-emerald-800' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </p>
                      </div>

                      {/* Trust points badge */}
                      {step.trustPts && (
                        <span className={`
                          text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0
                          ${step.done
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                          }
                        `}>
                          +{step.trustPts} pts
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Done label or CTA */}
                    <div className="mt-3">
                      {step.done ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-500 text-sm">✓</span>
                          <span className="text-[12px] font-medium text-emerald-700">
                            {step.doneLabel}
                          </span>
                          {step.trustEvent && (
                            <span className="text-[9px] text-gray-400 font-mono ml-1">
                              · {step.trustEvent}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Link href={step.ctaHref}
                          className={`
                            inline-flex items-center gap-1.5 px-4 py-2 rounded-lg
                            text-[12px] font-medium transition-colors
                            ${isCurrent
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }
                          `}>
                          {step.cta}
                          <span className="text-[10px] opacity-70">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Complete state ───────────────────────────────── */}
        {state.isComplete && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-800">
              Alhamdulillah — You are Amanah Ready!
            </h2>
            <p className="text-[14px] text-emerald-700 leading-relaxed max-w-md mx-auto">
              {state.orgName} has completed all onboarding steps.
              Your trust score is live and your organisation is moving toward
              Silver → Gold → Platinum certification.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={`/org/${orgId}/trust`}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white
                           text-sm font-medium rounded-lg transition-colors">
                View trust score →
              </Link>
              <Link href={`/org/${orgId}/certification`}
                className="px-6 py-2.5 border border-emerald-300 text-emerald-700
                           text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors">
                Apply for certification →
              </Link>
            </div>
          </div>
        )}

        {/* ── What happens after completion ────────────────── */}
        {!state.isComplete && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-3">
            <p className="text-[12px] font-semibold text-gray-700">
              What happens when you complete all steps
            </p>
            <div className="space-y-2">
              {[
                { icon: '▲', text: 'Your Amanah Trust Score becomes active and rises with every action' },
                { icon: '★', text: 'You become eligible to apply for Amanah Certification (Silver → Gold → Platinum)' },
                { icon: '◎', text: 'Your organisation appears on AmanahHub — visible to donors' },
                { icon: '💰', text: 'Donors see your trust badge — financial transparency reduces giving hesitation' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-emerald-500 flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-[12px] text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Back to dashboard ────────────────────────────── */}
        <div className="text-center">
          <Link href={`/org/${orgId}/dashboard`}
            className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
            ← Back to dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
