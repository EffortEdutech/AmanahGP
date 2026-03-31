// apps/admin/app/(dashboard)/orgs/[orgId]/page.tsx
// AmanahHub Console — Organization profile (Sprint 12b)
// Reviewers see the DocumentReviewPanel here, regardless of org status.

import { redirect }             from 'next/navigation';
import Link                     from 'next/link';
import { createClient,
         createServiceClient }  from '@/lib/supabase/server';
import { isReviewerOrAbove }    from '@agp/config';
import { StatusBadge }          from '@/components/ui/badge';
import { DocumentUploadPanel }  from '@/components/documents/document-upload-panel';
import { DocumentReviewPanel }  from '@/components/documents/document-review-panel';
import type { DocumentSpec }    from '@/components/documents/document-upload-panel';

const GOVERNANCE_SPECS: DocumentSpec[] = [
  {
    documentType:  'registration_cert',
    label:         'Registration certificate',
    description:   'Official certificate from ROS, JAKIM, SIRC, or relevant authority.',
    required:      true,
    acceptedTypes: 'application/pdf,image/*',
  },
  {
    documentType:  'governing_doc',
    label:         'Governing document',
    description:   'Constitution, trust deed, or bylaws naming the organization\'s purpose and governance.',
    required:      true,
    acceptedTypes: 'application/pdf',
  },
  {
    documentType:  'board_resolution',
    label:         'Board list / resolution',
    description:   'Current list of board members (min 3). Meeting minutes showing appointment acceptable.',
    required:      true,
    acceptedTypes: 'application/pdf,image/*',
  },
  {
    documentType:  'coi_policy',
    label:         'Conflict of interest policy',
    description:   'Signed CoI policy — can be a single-page declaration or embedded in governing doc.',
    required:      true,
    acceptedTypes: 'application/pdf',
  },
  {
    documentType:  'bank_account_proof',
    label:         'Organizational bank account proof',
    description:   'Bank statement header or account opening letter showing the organization name.',
    required:      true,
    acceptedTypes: 'application/pdf,image/*',
  },
  {
    documentType:  'annual_report',
    label:         'Annual report',
    description:   'Most recent published annual report (if available).',
    required:      false,
    acceptedTypes: 'application/pdf',
  },
];

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO / Welfare', mosque_surau: 'Mosque / Surau',
  waqf_institution: 'Waqf Institution', zakat_body: 'Zakat Body',
  foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const svc       = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me) redirect('/login');

  const isReviewer  = isReviewerOrAbove(me.platform_role);
  const isOrgMember = !isReviewer;

  // For org members, verify membership
  if (isOrgMember) {
    const { data: isMember } = await supabase.rpc('is_org_member', { org_id: orgId });
    if (!isMember) redirect('/dashboard');
  }

  const { data: canEdit } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  const { data: org } = await svc
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, contact_email,
      state, org_type, oversight_authority, fund_types, summary,
      onboarding_status, listing_status, onboarding_submitted_at, approved_at
    `)
    .eq('id', orgId).single();

  if (!org) redirect('/dashboard');

  // All documents for this org
  const { data: allDocs } = await svc
    .from('org_documents')
    .select(`
      id, document_type, label, file_name, file_size_bytes, mime_type,
      is_approved_public, visibility, period_year, created_at
    `)
    .eq('organization_id', orgId)
    .order('document_category')
    .order('created_at', { ascending: false });

  // Governance docs for upload panel (org admin view)
  const govDocs = (allDocs ?? []).filter((d) => (d as any).document_category === 'governance'
    || !['financial','shariah'].includes((d as any).document_category ?? ''));

  // For upload panel — governance only
  const { data: govDocsOnly } = await svc
    .from('org_documents')
    .select(`
      id, document_type, label, file_name, file_size_bytes, mime_type,
      is_approved_public, visibility, period_year, created_at
    `)
    .eq('organization_id', orgId)
    .eq('document_category', 'governance')
    .order('created_at', { ascending: false });

  const fundTypes = (org.fund_types ?? []) as string[];
  const uploadedTypes = new Set((govDocsOnly ?? []).map((d) => d.document_type));
  const missingRequired = GOVERNANCE_SPECS
    .filter((s) => s.required && !uploadedTypes.has(s.documentType))
    .map((s) => s.label);
  const layer1Complete = missingRequired.length === 0;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-[18px] font-semibold text-gray-900">{org.name}</h1>
          {org.legal_name && org.legal_name !== org.name && (
            <p className="text-[11px] text-gray-400 mt-0.5">{org.legal_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={org.onboarding_status} />
          {org.listing_status === 'listed' && <StatusBadge status="listed" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Profile */}
        <div>
          <div className="card p-4 mb-4">
            <p className="sec-label">Profile</p>
            <table className="w-full text-[12px]">
              <tbody>
                <TRow label="Registration"  value={org.registration_no ?? '—'} />
                <TRow label="Type"          value={org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : '—'} />
                <TRow label="State"         value={org.state ?? '—'} />
                <TRow label="Oversight"     value={org.oversight_authority ?? '—'} />
                <TRow label="Website"       value={org.website_url ?? '—'} />
                <TRow label="Contact"       value={org.contact_email ?? '—'} />
              </tbody>
            </table>
            {fundTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {fundTypes.map((f) => (
                  <span key={f} className="badge badge-blue">{f.toUpperCase()}</span>
                ))}
              </div>
            )}
            {org.summary && (
              <p className="text-[12px] text-gray-600 mt-3 leading-relaxed border-t
                            border-gray-100 pt-3">
                {org.summary}
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <p className="sec-label">Sections</p>
            <div className="space-y-1">
              {[
                [`/orgs/${orgId}/projects`,      'Projects'],
                [`/orgs/${orgId}/financials`,    'Financial snapshots'],
                [`/orgs/${orgId}/certification`, 'Certification'],
                [`/orgs/${orgId}/members`,       'Members'],
              ].map(([href, label]) => (
                <Link key={href} href={href}
                  className="flex items-center justify-between py-1.5 text-[12px]
                             text-emerald-700 hover:underline">
                  {label} <span className="text-gray-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Layer 1 status */}
        <div>
          <div className={`rounded-xl border p-4 mb-4 ${
            layer1Complete
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{layer1Complete ? '✅' : '⚠️'}</span>
              <p className={`text-[12px] font-semibold ${
                layer1Complete ? 'text-emerald-800' : 'text-amber-800'
              }`}>
                CTCF Layer 1 — Governance Gate
              </p>
            </div>
            {layer1Complete ? (
              <p className="text-[11px] text-emerald-700">
                All required governance documents uploaded.
              </p>
            ) : (
              <>
                <p className="text-[11px] text-amber-700 mb-1">
                  {missingRequired.length} required document{missingRequired.length !== 1 ? 's' : ''} missing:
                </p>
                <ul className="text-[10px] text-amber-700 space-y-0.5 list-disc list-inside">
                  {missingRequired.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── REVIEWER: shows all documents with approve buttons ── */}
      {isReviewer && (
        <div className="mb-4">
          <DocumentReviewPanel
            orgId={orgId}
            documents={(allDocs ?? []) as any}
          />
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-1
                          text-[11px] text-blue-800">
            Click <strong>"Approve public"</strong> on each document to make it
            visible to donors on AmanahHub. Revoke anytime if needed.
          </div>
        </div>
      )}

      {/* ── ORG ADMIN: upload governance documents ── */}
      {!isReviewer && (
        <DocumentUploadPanel
          orgId={orgId}
          category="governance"
          title="Layer 1 — Governance documents"
          specs={GOVERNANCE_SPECS}
          existingDocs={(govDocsOnly ?? []).map((d) => ({
            ...d,
            uploaded_at: d.created_at,
          }))}
          readOnly={!canEdit}
        />
      )}
    </div>
  );
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 text-gray-400 w-[100px] align-top">{label}</td>
      <td className="py-1.5 text-gray-800">{value}</td>
    </tr>
  );
}
