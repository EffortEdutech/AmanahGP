// apps/org/app/(protected)/trust/page.tsx
// amanahOS — Trust score dashboard
// Shows the org's current Amanah Index, pillar breakdown, and improvement tips.
// Reads from amanah_index_history and certification_history (read-only for org).

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Trust score — amanahOS' };

export default async function TrustPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Resolve orgId from query param or user's first org
  let orgId = params.orgId;
  if (!orgId) {
    const { data: m } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    orgId = m?.organization_id;
  }
  if (!orgId) redirect('/dashboard');

  // Load Amanah score history (last 6)
  const { data: history } = await supabase
    .from('amanah_index_history')
    .select('total_score, component_scores, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(6);

  const latest = history?.[0] ?? null;
  const components = latest?.component_scores as Record<string, number> | null;

  // Load certification
  const { data: cert } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load trust events (last 10)
  const { data: events } = await supabase
    .from('trust_events')
    .select('event_type, event_date, description, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  const score = latest?.total_score ?? null;
  const scoreGrade =
    score === null ? 'No score'
    : score >= 80 ? 'Platinum Amanah'
    : score >= 65 ? 'Gold Amanah'
    : score >= 50 ? 'Silver Amanah'
    : 'Developing';

  const gradeColor =
    score === null ? 'text-gray-400'
    : score >= 80 ? 'text-purple-700'
    : score >= 65 ? 'text-amber-700'
    : score >= 50 ? 'text-gray-500'
    : 'text-red-600';

  const COMPONENT_LABELS: Record<string, string> = {
    governance: 'Governance',
    financial: 'Financial',
    project: 'Project delivery',
    impact: 'Impact',
    feedback: 'Stakeholder feedback',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Trust score</h1>
        <p className="text-sm text-gray-500 mt-0.5">Amanah Index · Read-only view for your organisation</p>
      </div>

      {/* Current score */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-900">
            {score !== null ? score.toFixed(1) : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">out of 100</p>
        </div>
        <div className="flex-1">
          <p className={`text-xl font-semibold ${gradeColor}`}>{scoreGrade}</p>
          {cert && (
            <p className="text-sm text-gray-500 mt-1">
              Certification: <span className="font-medium capitalize">{cert.new_status}</span>
              {cert.valid_from && ` · valid from ${cert.valid_from}`}
            </p>
          )}
          {latest && (
            <p className="text-[11px] text-gray-400 mt-1">
              Last computed: {new Date(latest.computed_at).toLocaleDateString('en-MY')}
            </p>
          )}
        </div>
      </div>

      {/* Component breakdown */}
      {components && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Component scores</h2>
          {Object.entries(components).map(([key, val]) => {
            const pct = Math.min(100, Math.round(Number(val)));
            const label = COMPONENT_LABELS[key] ?? key;
            return (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] text-gray-600">{label}</span>
                  <span className="text-[11px] font-medium text-gray-800">{pct}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust events */}
      {events && events.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent trust events</h2>
          </div>
          {events.map((ev) => (
            <div key={(ev as { created_at: string }).created_at} className="px-4 py-3 flex items-start gap-3">
              <span className="text-emerald-500 mt-0.5 text-sm">▲</span>
              <div>
                <p className="text-[12px] font-medium text-gray-800 capitalize">
                  {String((ev as { event_type: string }).event_type).replace(/_/g, ' ')}
                </p>
                {(ev as { description?: string }).description && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {(ev as { description: string }).description}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date((ev as { created_at: string }).created_at).toLocaleDateString('en-MY')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {score === null && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No Amanah score computed yet.</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Submit a verified report or completed certification to generate your first score.
          </p>
        </div>
      )}
    </div>
  );
}
