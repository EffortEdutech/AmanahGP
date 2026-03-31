'use client';
// apps/admin/components/documents/document-review-panel.tsx
// AmanahHub Console — Reviewer: view org documents and approve/revoke public visibility
// Used on review pages (onboarding review, certification review).

import { useActionState } from 'react';
import { approveDocumentPublic } from '@/app/(dashboard)/review/document-actions';

interface Doc {
  id:                 string;
  document_category:  string;
  document_type:      string;
  label:              string;
  file_name:          string;
  file_size_bytes:    number | null;
  mime_type:          string | null;
  is_approved_public: boolean;
  period_year:        number | null;
  created_at:         string;
}

interface Props {
  orgId:     string;
  documents: Doc[];
}

const DOC_CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance docs — CTCF Layer 1',
  financial:  'Financial docs — CTCF Layer 2',
  shariah:    'Shariah docs — CTCF Layer 5',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  registration_cert:            'Registration certificate',
  governing_doc:                'Governing document',
  board_resolution:             'Board list / resolution',
  coi_policy:                   'Conflict of interest policy',
  bank_account_proof:           'Bank account proof',
  annual_report:                'Annual report',
  financial_statement:          'Annual financial statement',
  audit_report:                 'Audit report',
  bank_reconciliation:          'Bank reconciliation',
  management_accounts:          'Program expense breakdown',
  shariah_policy:               'Written Shariah policy',
  shariah_advisor_credentials:  'Shariah advisor credentials',
  zakat_authorization:          'Zakat authorization',
  waqf_deed:                    'Waqf asset deed',
  fatwa_doc:                    'Fatwa / Shariah ruling',
};

function fmtBytes(n: number | null) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ApproveButton({ docId, orgId, isApproved }: {
  docId: string; orgId: string; isApproved: boolean;
}) {
  const [state, formAction, isPending] = useActionState(approveDocumentPublic, null);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="docId"  value={docId} />
      <input type="hidden" name="orgId"  value={orgId} />
      <input type="hidden" name="action" value={isApproved ? 'revoke' : 'approve'} />

      {state?.error && (
        <span className="text-[9px] text-red-600">{state.error}</span>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors
                    border ${
          isApproved
            ? 'text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600'
            : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
        }`}
      >
        {isPending
          ? '…'
          : isApproved
          ? 'Revoke public'
          : 'Approve public'}
      </button>
    </form>
  );
}

export function DocumentReviewPanel({ orgId, documents }: Props) {
  if (!documents.length) {
    return (
      <div className="card p-4">
        <p className="sec-label">Documents</p>
        <p className="text-[12px] text-gray-400 mt-1">
          No documents uploaded yet by this organization.
        </p>
      </div>
    );
  }

  // Group by category
  const byCategory: Record<string, Doc[]> = {};
  for (const doc of documents) {
    byCategory[doc.document_category] = [...(byCategory[doc.document_category] ?? []), doc];
  }

  async function viewDoc(docId: string) {
    const res = await fetch(`/api/orgs/${orgId}/documents/${docId}/view`);
    const data = await res.json();
    if (data.ok) window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="card p-4">
      <p className="sec-label mb-3">Documents for review</p>

      {Object.entries(byCategory).map(([cat, docs]) => (
        <div key={cat} className="mb-5">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
            {DOC_CATEGORY_LABELS[cat] ?? cat}
          </p>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id}
                className="flex items-center gap-3 border border-gray-200 rounded-lg
                           px-3 py-2.5 bg-gray-50/40">

                <span className="text-sm flex-shrink-0">📄</span>

                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800">
                    {DOC_TYPE_LABELS[doc.document_type] ?? doc.label}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {doc.file_name}
                    {doc.file_size_bytes ? ` · ${fmtBytes(doc.file_size_bytes)}` : ''}
                    {doc.period_year ? ` · ${doc.period_year}` : ''}
                    {` · Uploaded ${new Date(doc.created_at).toLocaleDateString('en-MY')}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.is_approved_public && (
                    <span className="badge badge-green text-[9px]">Public</span>
                  )}

                  {/* View button */}
                  <button
                    type="button"
                    onClick={() => viewDoc(doc.id)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900
                               font-medium underline"
                  >
                    View
                  </button>

                  {/* Approve / revoke */}
                  <ApproveButton
                    docId={doc.id}
                    orgId={orgId}
                    isApproved={doc.is_approved_public}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[9px] text-gray-400 mt-3">
        Approved documents become publicly visible to donors on AmanahHub once marked as Public.
        Revoking removes them from public view immediately.
      </p>
    </div>
  );
}
