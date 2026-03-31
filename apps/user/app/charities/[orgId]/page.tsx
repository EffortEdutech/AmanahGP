// apps/user/app/charities/[orgId]/page.tsx
// AmanahHub — Public charity profile (Sprint 7 UI uplift)
// Data fetching unchanged — visual layer replaced to match UAT s-profile

import { notFound }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { AmanahScorePanel }    from '@/components/charity/amanah-score-panel';
import { CertPanel }           from '@/components/charity/cert-panel';
import { StatusBadge, Badge }  from '@/components/ui/badge';

interface Props { params: Promise<{ orgId: string }> }

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const { data }  = await supabase
    .from('organizations').select('name, summary').eq('id', orgId).single();
  return {
    title: data?.name ? `${data.name} | AmanahHub` : 'Charity Profile | AmanahHub',
    description: data?.summary ?? '',
  };
}

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo:              'NGO / Welfare',
  mosque_surau:     'Mosque / Surau',
  waqf_institution: 'Waqf Institution',
  zakat_body:       'Zakat Body',
  foundation:       'Foundation',
  cooperative:      'Cooperative',
  other:            'Other',
};

export default async function CharityProfilePage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, state,
      org_type, oversight_authority, fund_types, summary
    `)
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  const { data: scoreHistory } = await supabase
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, public_summary, breakdown')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(5);

  const { data: certHistory } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(3);

  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('total_score, score_breakdown, criteria_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, objective, location_text, status, start_date, end_date')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const fundTypes = (org.fund_types ?? []) as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">

      {/* Breadcrumb */}
      <Link href="/charities"
        className="text-[11px] text-gray-400 hover:text-emerald-700 transition-colors mb-4 block">
        ← Charity directory
      </Link>

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 leading-snug">{org.name}</h1>
          {org.legal_name && org.legal_name !== org.name && (
            <p className="text-[11px] text-gray-400 mt-0.5">{org.legal_name}</p>
          )}
          <p className="text-[11px] text-gray-500 mt-0.5">
            {org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : ''}
            {org.state ? ` · ${org.state}` : ''}
            {org.registration_no ? ` · Reg: ${org.registration_no}` : ''}
          </p>
        </div>
        <Link
          href={`/donate/${org.id}`}
          className="btn-primary text-sm px-5 py-2"
        >
          Donate now
        </Link>
      </div>

      {/* Body: main (1fr) + sidebar (220px) */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 220px' }}>

        {/* ── Left: main content ── */}
        <div className="space-y-3">

          {/* About */}
          {(org.summary || org.website_url || org.oversight_authority || fundTypes.length > 0) && (
            <div className="card p-4">
              <p className="sec-label">About</p>

              {org.summary && (
                <p className="text-[12px] text-gray-700 leading-relaxed mb-3">
                  {org.summary}
                </p>
              )}

              <div className="space-y-1.5 text-[11px]">
                {org.oversight_authority && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 flex-shrink-0">Oversight</span>
                    <span className="text-gray-700">{org.oversight_authority}</span>
                  </div>
                )}
                {org.website_url && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 flex-shrink-0">Website</span>
                    <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline truncate">
                      {org.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {fundTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {fundTypes.map((f) => (
                    <Badge key={f} variant="green">
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active projects */}
          <div className="card p-4">
            <p className="sec-label">
              Active projects ({projects?.length ?? 0})
            </p>

            {projects?.length ? (
              <div className="space-y-2">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/charities/${orgId}/projects/${p.id}`}
                    className="list-item"
                  >
                    {/* Status dot */}
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-gray-900 truncate">
                        {p.title}
                      </p>
                      {p.location_text && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{p.location_text}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <StatusBadge status={p.status} />
                      {(p.start_date || p.end_date) && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {p.start_date
                            ? new Date(p.start_date).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
                            : ''}
                          {p.end_date
                            ? ` – ${new Date(p.end_date).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}`
                            : ''}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 py-2">No public projects yet.</p>
            )}
          </div>

        </div>

        {/* ── Right: sidebar ── */}
        <div className="space-y-3">
          <AmanahScorePanel scoreHistory={scoreHistory as any} />
          <CertPanel
            certHistory={certHistory as any}
            latestEval={latestEval as any}
          />

          {/* Quick donate card */}
          <div className="card p-4 bg-emerald-50 border-emerald-100">
            <p className="text-[11px] font-medium text-emerald-800 mb-2">
              Support this organization
            </p>
            <p className="text-[10px] text-emerald-600 mb-3 leading-relaxed">
              Donations go directly to {org.name}. AmanahHub is non-custodial.
            </p>
            <Link href={`/donate/${org.id}`} className="btn-primary w-full justify-center text-xs py-2">
              Donate now
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
