// apps/admin/app/(dashboard)/review/amanah/page.tsx
// AmanahHub Console — Amanah Index recalculation (Sprint 8 UI uplift)
// Fixed: imports manualAmanahRecalc from ../recalculate (delivered Sprint 5)

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { RecalcForm }        from './recalc-form';
// manualAmanahRecalc lives in review/recalculate.ts (delivered Sprint 5)
import { manualAmanahRecalc } from '../recalculate';

export const metadata = { title: 'Amanah Score | AmanahHub Console' };

function tierLabel(score: number) {
  if (score >= 85) return { label: 'Platinum Amanah', cls: 'text-violet-700' };
  if (score >= 70) return { label: 'Gold Amanah',     cls: 'text-amber-600'  };
  if (score >= 55) return { label: 'Silver Amanah',   cls: 'text-gray-600'   };
  return              { label: 'Basic',               cls: 'text-gray-400'   };
}

const TRIGGER_LABELS: Record<string, string> = {
  report_verified:       'trigger: report_verified',
  financial_verified:    'trigger: financial_verified',
  certification_updated: 'trigger: certification_updated',
  donation_confirmed:    'trigger: donation_confirmed',
  manual_recalc:         'trigger: manual_recalc',
  complaint_resolved:    'trigger: complaint_resolved',
};

// Weights from amanah_v1
const WEIGHTS = [
  { label: 'Governance', key: 'governance', weight: 0.30 },
  { label: 'Financial',  key: 'financial',  weight: 0.25 },
  { label: 'Project',    key: 'project',    weight: 0.20 },
  { label: 'Impact',     key: 'impact',     weight: 0.15 },
  { label: 'Feedback',   key: 'feedback',   weight: 0.10 },
];

export default async function AmanahScorePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  // Default to first listed org
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('listing_status', 'listed')
    .order('name')
    .limit(20);

  const firstOrg = orgs?.[0];

  const { data: history } = firstOrg
    ? await supabase
        .from('amanah_index_history')
        .select('id, score_value, score_version, computed_at, breakdown, computed_from_event_id')
        .eq('organization_id', firstOrg.id)
        .order('computed_at', { ascending: false })
        .limit(10)
    : { data: [] };

  const { data: trustEvents } = firstOrg
    ? await supabase
        .from('trust_events')
        .select('id, event_type, occurred_at')
        .eq('organization_id', firstOrg.id)
        .order('occurred_at', { ascending: false })
        .limit(20)
    : { data: [] };

  const eventMap = new Map((trustEvents ?? []).map((e) => [e.id, e]));

  const latest    = history?.[0];
  const score     = latest ? Number(latest.score_value) : null;
  const breakdown = latest?.breakdown as Record<string, number> | null;
  const { label: tierLbl, cls: tierCls } = score !== null
    ? tierLabel(score)
    : { label: '—', cls: 'text-gray-400' };

  return (
    <div className="max-w-4xl">
      <h1 className="text-[18px] font-semibold text-gray-900 mb-4">
        Amanah Index™ — Recalculation
      </h1>

      <div className="grid grid-cols-2 gap-4">

        {/* Left: current score + formula */}
        <div className="space-y-3">
          <div className="card p-4">
            <p className="sec-label">
              Current score{firstOrg ? ` — ${firstOrg.name}` : ''}
            </p>

            {/* Big score */}
            <div className="text-center py-4">
              <div className={`text-[48px] font-semibold leading-none ${
                score !== null ? 'text-emerald-700' : 'text-gray-300'
              }`}>
                {score !== null ? score.toFixed(1) : '—'}
              </div>
              <p className={`text-[12px] font-medium mt-1 ${tierCls}`}>{tierLbl}</p>
              {latest && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {latest.score_version} · Last recalculated{' '}
                  {new Date(latest.computed_at).toLocaleDateString('en-MY', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Formula breakdown table */}
            {breakdown && (
              <>
                <div className="h-px bg-gray-100 mb-3" />
                <p className="sec-label">Formula breakdown</p>
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-1.5 text-left text-gray-400 font-normal">Component</th>
                      <th className="py-1.5 text-right text-gray-400 font-normal">Calculation</th>
                      <th className="py-1.5 text-right text-gray-400 font-normal pl-2">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEIGHTS.map(({ label, key, weight }) => {
                      const raw = breakdown[key] ?? 0;
                      const pts = +(raw * weight).toFixed(2);
                      return (
                        <tr key={key} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-500">
                            {label} ({Math.round(weight * 100)}%)
                          </td>
                          <td className="py-1.5 text-right text-gray-400">
                            {raw.toFixed(0)} × {weight}
                          </td>
                          <td className="py-1.5 text-right font-medium text-gray-800 pl-2">
                            = {pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {score !== null && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[12px] font-medium text-gray-900">Total</span>
                    <span className="text-[18px] font-semibold text-emerald-700">
                      {score.toFixed(1)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: history + recalc */}
        <div className="space-y-3">

          <div className="card p-4">
            <p className="sec-label">Score history (append-only)</p>

            {(history?.length ?? 0) > 0 ? (
              <div className="tl">
                {history!.map((entry, i) => {
                  const s         = Number(entry.score_value);
                  const { label } = tierLabel(s);
                  const event     = entry.computed_from_event_id
                    ? eventMap.get(entry.computed_from_event_id)
                    : null;
                  const eventLabel = event
                    ? TRIGGER_LABELS[event.event_type] ?? event.event_type
                    : 'trigger: system';
                  const opacity = Math.max(0.3, 1 - i * 0.15);

                  return (
                    <div key={entry.id} className="tli" style={{ opacity }}>
                      <p className="text-[12px] font-medium text-gray-900">
                        {s.toFixed(1)} — {label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(entry.computed_at).toLocaleDateString('en-MY', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })} · {eventLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">No score history yet.</p>
            )}
          </div>

          <div className="card p-4">
            <p className="sec-label">Manual recalculation</p>
            <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50
                          rounded-lg p-3 mb-3">
              Amanah score recalculates automatically when: report verified, financial verified,
              certification updated, or donation confirmed. Use manual recalc to force a refresh.
            </p>
            {/* passes manualAmanahRecalc — expects formData.get('organizationId') */}
            <RecalcForm
              orgs={orgs ?? []}
              defaultOrgId={firstOrg?.id}
              defaultOrgName={firstOrg?.name}
              action={manualAmanahRecalc}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
