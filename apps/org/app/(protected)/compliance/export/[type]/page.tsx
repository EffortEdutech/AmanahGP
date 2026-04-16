// apps/org/app/(protected)/compliance/export/[type]/page.tsx
// amanahOS — Compliance Export Page (Sprint 26)
//
// Server-rendered print-optimized page for each compliance pack.
// User clicks "Print / Save as PDF" → browser PDF dialog → professional PDF.
// This is the Notion/Linear approach — zero dependencies, vector text, searchable.
//
// Supported types: ros | main | donor

import { redirect, notFound }  from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { PrintButton }         from '@/components/compliance/print-button';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Export report — amanahOS' };

const PACK_CONFIG = {
  ros:   { title: 'ROS Annual Return',         subtitle: 'Registrar of Societies (ROS) Annual Reporting Pack' },
  main:  { title: 'MAIN / JAKIM Reporting Pack', subtitle: 'Zakat, Waqf & Mosque Regulatory Reporting Pack' },
  donor: { title: 'Donor Transparency Report',  subtitle: 'Annual Transparency Report for Donors and Stakeholders' },
};

export default async function ComplianceExportPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!['ros', 'main', 'donor'].includes(type)) notFound();

  const supabase = await createClient();
  const service  = createServiceClient();
  const pack     = PACK_CONFIG[type as keyof typeof PACK_CONFIG];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, organizations(id, name, legal_name, registration_no, org_type, state, oversight_authority, fund_types, contact_email, contact_phone, website_url, address_text, summary)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId = membership.organization_id;
  const orgRaw = membership.organizations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as {
    id: string; name: string; legal_name: string | null; registration_no: string | null | undefined;
    org_type: string | null; state: string | null; oversight_authority: string | null;
    fund_types: string[]; contact_email: string | null; contact_phone: string | null;
    website_url: string | null; address_text: string | null; summary: string | null;
  } | null;
  const fundTypes = org?.fund_types ?? [];

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const yearStr = String(now.getFullYear());

  // â”€â”€ Load all data in parallel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [
    membersResult,
    closesResult,
    snapshotResult,
    reportsResult,
    projectsResult,
    policyResult,
    certResult,
    scoreResult,
    eventResult,
    zakatResult,
  ] = await Promise.all([
    service.from('org_members')
      .select('org_role, users(display_name, email)')
      .eq('organization_id', orgId).eq('status', 'active')
      .order('org_role'),

    service.from('fund_period_closes')
      .select('period_year, period_month, total_income, total_expense, closed_at')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(12),

    service.from('financial_snapshots')
      .select('period_year, inputs, submission_status')
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted')
      .order('period_year', { ascending: false })
      .limit(1).maybeSingle(),

    service.from('project_reports')
      .select('title, submission_status, verification_status, report_date, report_body')
      .eq('organization_id', orgId)
      .eq('submission_status', 'submitted')
      .order('report_date', { ascending: false })
      .limit(10),

    service.from('projects')
      .select('title, objective, status, start_date, end_date, budget_amount')
      .eq('organization_id', orgId)
      .in('status', ['active', 'completed'])
      .order('status')
      .limit(20),

    service.from('org_documents')
      .select('document_type, label, created_at')
      .eq('organization_id', orgId)
      .eq('document_category', 'governance')
      .order('created_at'),

    service.from('certification_history')
      .select('new_status, valid_from, valid_to, decision_reason, decided_at')
      .eq('organization_id', orgId)
      .order('decided_at', { ascending: false })
      .limit(3),

    service.from('amanah_index_history')
      .select('score_value, score_version, computed_at, breakdown')
      .eq('organization_id', orgId)
      .order('computed_at', { ascending: false })
      .limit(1).maybeSingle(),

    service.from('trust_events')
      .select('event_type, pillar, score_delta, occurred_at')
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(10),

    // Zakat utilisation from accounting views
    service.from('journal_entries')
      .select('period_year, period_month')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .limit(1).maybeSingle(),
  ]);

  const members   = membersResult.data ?? [];
  const closes    = closesResult.data ?? [];
  const snapshot  = snapshotResult.data;
  const reports   = reportsResult.data ?? [];
  const projects  = projectsResult.data ?? [];
  const policies  = policyResult.data ?? [];
  const certs     = certResult.data ?? [];
  const score     = scoreResult.data;
  const events    = eventResult.data ?? [];
  const latestCert = certs[0];

  // Aggregate financial totals from closes
  const totalIncome  = closes.reduce((s, c) => s + Number(c.total_income),  0);
  const totalExpense = closes.reduce((s, c) => s + Number(c.total_expense), 0);
  const net          = totalIncome - totalExpense;

  const snapshotInputs = (snapshot?.inputs ?? {}) as Record<string, number | boolean | null>;
  const hasZakat = fundTypes.includes('zakat');
  const hasWaqf  = fundTypes.includes('waqf');

  const fmt  = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  const cap  = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  const roleLabel = (r: string) =>
    r === 'org_admin' ? 'Admin' : r === 'org_manager' ? 'Manager' : 'Viewer';

  return (
    <>
      {/* Print CSS injected inline */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; color: #111827; background: white; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
          .page-break { page-break-before: always; }
          @page { margin: 20mm 15mm; size: A4 portrait; }
          a { color: inherit; text-decoration: none; }
        }
        @media screen {
          body { background: #f9fafb; }
          .report-wrapper { max-width: 794px; margin: 0 auto; padding: 24px; }
          .report-body { background: white; padding: 40px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        }
        h1 { font-size: 22pt; font-weight: 700; margin: 0 0 4px; color: #111827; }
        h2 { font-size: 13pt; font-weight: 600; margin: 24px 0 10px; color: #111827; border-bottom: 1.5px solid #059669; padding-bottom: 5px; }
        h3 { font-size: 11pt; font-weight: 600; margin: 16px 0 6px; color: #374151; }
        p  { font-size: 10pt; line-height: 1.6; margin: 0 0 8px; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 9.5pt; }
        th { background: #ecfdf5; color: #065f46; font-weight: 600; padding: 8px 10px; text-align: left; border: 1px solid #d1fae5; }
        td { padding: 7px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8.5pt; font-weight: 600; }
        .badge-green  { background: #d1fae5; color: #065f46; }
        .badge-blue   { background: #dbeafe; color: #1e40af; }
        .badge-amber  { background: #fef3c7; color: #92400e; }
        .badge-gray   { background: #f3f4f6; color: #374151; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0 20px; }
        .summary-box  { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
        .summary-box .label { font-size: 8.5pt; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-box .value { font-size: 16pt; font-weight: 700; margin-top: 2px; }
        .income  .value { color: #059669; }
        .expense .value { color: #dc2626; }
        .net     .value { color: #1d4ed8; }
        .header-bar { background: #059669; color: white; padding: 20px 40px 16px; margin: -40px -40px 24px; border-radius: 12px 12px 0 0; }
        .header-bar h1 { color: white; font-size: 18pt; }
        .header-bar .sub { color: #a7f3d0; font-size: 9.5pt; margin-top: 4px; }
        .org-detail { font-size: 9pt; color: #d1fae5; margin-top: 2px; }
        .print-bar { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .print-btn { background: #059669; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .print-btn:hover { background: #047857; }
        .back-link { font-size: 12px; color: #6b7280; text-decoration: none; }
        .back-link:hover { color: #111827; }
        .watermark { font-size: 8pt; color: #9ca3af; margin-top: 24px; padding-top: 12px; border-top: 1px solid #f3f4f6; text-align: center; }
        .check-row { display: flex; align-items: center; gap: 8px; margin: 5px 0; font-size: 9.5pt; }
        .check-ok   { color: #059669; }
        .check-no   { color: #9ca3af; }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="print-bar no-print">
        <a href="/compliance" className="back-link">← Back to Compliance</a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Print this page → Save as PDF
          </span>
          <PrintButton />
        </div>
      </div>

      <div className="report-wrapper">
        <div className="report-body">

          {/* Header */}
          <div className="header-bar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="sub">Amanah Governance Platform</p>
                <h1>{pack.title}</h1>
                <p className="org-detail">{org?.name} · {dateStr}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {latestCert?.new_status === 'certified' && (
                  <span className="badge" style={{ background: '#a7f3d0', color: '#064e3b', fontSize: '8.5pt' }}>
                    ★ CTCF Certified
                  </span>
                )}
                {score && (
                  <p style={{ color: '#a7f3d0', fontSize: '9pt', marginTop: '6px' }}>
                    Amanah Score: {Number(score.score_value).toFixed(1)}/100
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* â”€â”€ Section 1: Organisation Profile â”€â”€ */}
          <h2>1. Organisation Profile</h2>
          <table>
            <tbody>
              {[
                ['Organisation name',    org?.name],
                ['Legal / registered name', org?.legal_name ?? org?.name],
                ['Registration number', org?.registration_no ?? '—'],
                ['Organisation type',   org?.org_type ? cap(org.org_type) : '—'],
                ['State',               org?.state ?? '—'],
                ['Oversight authority', org?.oversight_authority ?? '—'],
                ['Fund types',          fundTypes.map(cap).join(', ') || '—'],
                ['Contact email',       org?.contact_email ?? '—'],
                ['Contact phone',       org?.contact_phone ?? '—'],
                ['Website',             org?.website_url ?? '—'],
                ['Address',             org?.address_text ?? '—'],
              ].map(([k, v]) => (
                <tr key={k as string}>
                  <td style={{ width: '38%', fontWeight: 500, color: '#4b5563' }}>{k}</td>
                  <td>{v || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {org?.summary && (
            <>
              <h3>Mission statement</h3>
              <p>{org.summary}</p>
            </>
          )}

          {/* â”€â”€ Section 2: Committee / Members â”€â”€ */}
          <h2>2. Committee Members</h2>
          {members.length > 0 ? (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const u = relationOne<{ display_name: string | null; email: string }>(m.users);
                  return (
                    <tr key={i}>
                      <td>{u?.display_name ?? '—'}</td>
                      <td>{u?.email}</td>
                      <td><span className={`badge badge-${m.org_role === 'org_admin' ? 'blue' : 'gray'}`}>{roleLabel(m.org_role)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <p>No active members recorded.</p>}

          {/* â”€â”€ Section 3: Financial Summary â”€â”€ */}
          <h2>3. Financial Summary — {yearStr}</h2>

          {closes.length > 0 ? (
            <>
              <div className="summary-grid">
                <div className="summary-box income">
                  <div className="label">Total income</div>
                  <div className="value">{fmt(totalIncome)}</div>
                </div>
                <div className="summary-box expense">
                  <div className="label">Total expenditure</div>
                  <div className="value">{fmt(totalExpense)}</div>
                </div>
                <div className="summary-box net">
                  <div className="label">Net movement</div>
                  <div className="value">{net >= 0 ? '' : '-'}{fmt(net)}</div>
                </div>
              </div>

              <h3>Monthly close records</h3>
              <table>
                <thead>
                  <tr><th>Period</th><th>Income</th><th>Expenditure</th><th>Net</th><th>Closed</th></tr>
                </thead>
                <tbody>
                  {closes.slice(0, 12).map((c, i) => {
                    const mo = new Date(c.closed_at).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
                    const n  = Number(c.total_income) - Number(c.total_expense);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>M{c.period_month}/{c.period_year}</td>
                        <td style={{ color: '#059669' }}>{fmt(Number(c.total_income))}</td>
                        <td style={{ color: '#dc2626' }}>{fmt(Number(c.total_expense))}</td>
                        <td style={{ color: n >= 0 ? '#1d4ed8' : '#dc2626' }}>{n >= 0 ? '' : '-'}{fmt(n)}</td>
                        <td>{mo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : <p>No financial periods closed. Please close at least one financial period to generate this section.</p>}

          {/* Programme / admin ratio — shown in ROS and donor */}
          {(type === 'ros' || type === 'donor') && snapshotInputs.programme_admin_ratio != null && (
            <p>
              Programme vs Administration ratio:{' '}
              <strong>{String(snapshotInputs.programme_admin_ratio)}% programme</strong>{' '}
              / {String(100 - Number(snapshotInputs.programme_admin_ratio))}% admin
            </p>
          )}

          {/* â”€â”€ Zakat section — MAIN pack only â”€â”€ */}
          {type === 'main' && hasZakat && (
            <>
              <div className="page-break" />
              <h2>4. Zakat Fund — Utilisation Summary</h2>
              <p>
                This organisation is registered to handle Zakat funds.
                Zakat receipts and distributions are tracked in a dedicated restricted fund account,
                separate from general operating funds, in compliance with MAIN/JAKIM requirements.
              </p>
              <table>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Fund type</td>
                    <td>Zakat (restricted)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Segregation</td>
                    <td>Dedicated fund ledger — no commingling with general funds</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Distribution basis</td>
                    <td>Eight asnaf categories per Shariah principles</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Detailed Zakat utilisation data is available in the Zakat Utilisation Report
                generated from the fund accounting module.
              </p>
            </>
          )}

          {/* â”€â”€ Waqf section â”€â”€ */}
          {type === 'main' && hasWaqf && (
            <>
              <h2>{hasZakat ? '5.' : '4.'} Waqf Assets — Summary</h2>
              <p>
                This organisation administers Waqf assets. All Waqf assets are maintained
                in a dedicated endowment fund, with the principal preserved in perpetuity
                and income applied in accordance with the Waqf deed and SIRC guidelines.
              </p>
              <table>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Fund type</td><td>Waqf (endowment)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>Asset register</td><td>Maintained in fund accounting system</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 500 }}>SIRC reference</td><td>{org?.registration_no ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* â”€â”€ Section: Programmes / Activity Report â”€â”€ */}
          <div className="page-break" />
          <h2>{type === 'main' ? (hasZakat || hasWaqf ? '6.' : '4.') : type === 'donor' ? '4.' : '4.'} Programme Activity</h2>

          {projects.length > 0 ? (
            <table>
              <thead>
                <tr><th>Programme</th><th>Objective</th><th>Status</th><th>Budget</th></tr>
              </thead>
              <tbody>
                {projects.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                    <td style={{ color: '#4b5563' }}>{p.objective}</td>
                    <td><span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-blue'}`}>{cap(p.status)}</span></td>
                    <td>{p.budget_amount ? fmt(Number(p.budget_amount)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No active programmes recorded.</p>}

          {/* Progress reports */}
          {reports.length > 0 && (
            <>
              <h3>Progress reports submitted</h3>
              <table>
                <thead>
                  <tr><th>Report title</th><th>Date</th><th>Status</th><th>Beneficiaries</th></tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => {
                    const b = relationOne<{ beneficiaries_reached?: number }>(r.report_body);
                    const vc = r.verification_status;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{r.title}</td>
                        <td>{r.report_date ?? '—'}</td>
                        <td>
                          <span className={`badge ${vc === 'verified' ? 'badge-green' : vc === 'pending' ? 'badge-amber' : 'badge-gray'}`}>
                            {vc === 'verified' ? 'Verified' : vc === 'pending' ? 'Pending' : cap(vc)}
                          </span>
                        </td>
                        <td>{b?.beneficiaries_reached ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* â”€â”€ Section: Governance & Compliance â”€â”€ */}
          <h2>5. Governance &amp; Compliance</h2>

          <h3>Policies on file</h3>
          {policies.length > 0 ? (
            <table>
              <thead><tr><th>Policy / Document</th><th>Uploaded</th></tr></thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={i}>
                    <td>{p.label}</td>
                    <td>{new Date(p.created_at).toLocaleDateString('en-MY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No governance policies uploaded.</p>}

          <h3>Certification status</h3>
          {certs.length > 0 ? (
            <table>
              <thead><tr><th>Status</th><th>Valid from</th><th>Valid to</th><th>Decided</th></tr></thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${c.new_status === 'certified' ? 'badge-green' : 'badge-gray'}`}>{cap(c.new_status)}</span></td>
                    <td>{c.valid_from ?? '—'}</td>
                    <td>{c.valid_to ?? 'Ongoing'}</td>
                    <td>{new Date(c.decided_at).toLocaleDateString('en-MY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No certification history recorded.</p>}

          {/* Trust score — donor pack */}
          {type === 'donor' && score && (
            <>
              <h3>Amanah Trust Score</h3>
              <p>
                <strong>{Number(score.score_value).toFixed(1)}/100</strong> —
                computed by the Amanah Governance Platform from operational accounting
                records and governance activities. Score version: {score.score_version}.
                Last computed: {new Date(score.computed_at).toLocaleDateString('en-MY')}.
              </p>
            </>
          )}

          {/* â”€â”€ Declaration â”€â”€ */}
          <div className="page-break" />
          <h2>6. Declaration</h2>
          <p>
            I, the undersigned, declare that the information contained in this{' '}
            <strong>{pack.title}</strong> is accurate and complete to the best of
            my knowledge, and that the organisation is in compliance with its governing
            documents and applicable Malaysian regulations.
          </p>
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {[['Authorised signatory', 'Chairman / President'], ['Finance officer', 'Treasurer / Finance Manager']].map(([title, role]) => (
              <div key={title}>
                <p style={{ fontWeight: 600, marginBottom: '40px' }}>{title}</p>
                <div style={{ borderTop: '1.5px solid #374151', paddingTop: '6px' }}>
                  <p style={{ fontSize: '8.5pt', color: '#6b7280' }}>Signature &amp; date</p>
                  <p style={{ fontSize: '8.5pt', color: '#6b7280' }}>{role}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px' }}>
            <p style={{ fontSize: '8.5pt', color: '#374151', fontWeight: 600, marginBottom: '4px' }}>
              Official stamp / Chop rasmi
            </p>
            <div style={{ height: '60px', border: '1.5px dashed #d1d5db', borderRadius: '6px', marginTop: '4px' }} />
          </div>

          {/* Watermark */}
          <div className="watermark">
            Generated by Amanah Governance Platform · {dateStr} ·
            This document is auto-generated from verified operational data. ·
            amanahgp.com
          </div>
        </div>
      </div>
    </>
  );
}

