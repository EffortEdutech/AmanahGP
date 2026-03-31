'use client';
// apps/admin/components/documents/document-upload-panel.tsx
// Sprint 12b fix:
//   - Added "Remove" button on each uploaded document
//   - "Replace" now deletes the old record before uploading new one
//   - Approved documents cannot be deleted (blocked server-side + labelled in UI)

import { useState, useRef } from 'react';

export interface DocumentSpec {
  documentType:  string;
  label:         string;
  description:   string;
  required:      boolean;
  acceptedTypes?: string;
}

export interface UploadedDoc {
  id:                 string;
  document_type:      string;
  label:              string;
  file_name:          string;
  file_size_bytes:    number | null;
  mime_type:          string | null;
  is_approved_public: boolean;
  visibility:         string;
  period_year:        number | null;
  uploaded_at:        string;
  created_at:         string;
}

interface Props {
  orgId:             string;
  category:          string;
  title:             string;
  specs:             DocumentSpec[];
  existingDocs:      UploadedDoc[];
  periodYear?:       number;
  readOnly?:         boolean;
  onUploadComplete?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'deleting' | 'done' | 'error';

const FILE_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg':      '🖼',
  'image/png':       '🖼',
  'image/webp':      '🖼',
};

function fmtBytes(n: number | null) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadPanel({
  orgId, category, title, specs, existingDocs,
  periodYear, readOnly, onUploadComplete,
}: Props) {
  const [uploading, setUploading] = useState<Record<string, UploadState>>({});
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [localDocs, setLocalDocs] = useState<UploadedDoc[]>(existingDocs);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function getDocForType(docType: string) {
    return localDocs.filter((d) => d.document_type === docType);
  }

  // ── Delete a document ───────────────────────────────────────
  async function handleDelete(doc: UploadedDoc, docType: string) {
    if (doc.is_approved_public) {
      setErrors((prev) => ({
        ...prev,
        [docType]: 'This document has been approved for public display. Ask a reviewer to revoke approval first.',
      }));
      return;
    }

    if (!confirm(`Remove "${doc.file_name}"? This cannot be undone.`)) return;

    setUploading((prev) => ({ ...prev, [docType]: 'deleting' }));
    setErrors((prev) => ({ ...prev, [docType]: '' }));

    try {
      const res = await fetch(`/api/orgs/${orgId}/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed to delete');

      setLocalDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setUploading((prev) => ({ ...prev, [docType]: 'idle' }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [docType]: err.message ?? 'Delete failed' }));
      setUploading((prev) => ({ ...prev, [docType]: 'error' }));
    }
  }

  // ── Upload (optionally replacing an existing doc) ───────────
  async function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    spec: DocumentSpec,
    existingDocToReplace?: UploadedDoc
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = spec.documentType;
    setUploading((prev) => ({ ...prev, [key]: 'uploading' }));
    setErrors((prev) => ({ ...prev, [key]: '' }));

    try {
      // Step 1: If replacing, delete the old record first
      if (existingDocToReplace) {
        if (existingDocToReplace.is_approved_public) {
          throw new Error('Cannot replace an approved document. Ask a reviewer to revoke approval first.');
        }
        const delRes = await fetch(`/api/orgs/${orgId}/documents/${existingDocToReplace.id}`, {
          method: 'DELETE',
        });
        const delData = await delRes.json();
        if (!delData.ok) throw new Error(delData.error ?? 'Failed to remove old document');

        // Remove from local state immediately
        setLocalDocs((prev) => prev.filter((d) => d.id !== existingDocToReplace.id));
      }

      // Step 2: Get signed upload URL
      const urlRes = await fetch(`/api/orgs/${orgId}/documents/upload-url`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName:         file.name,
          mimeType:         file.type,
          fileSizeBytes:    file.size,
          documentCategory: category,
          documentType:     spec.documentType,
          label:            spec.label,
          periodYear:       periodYear ?? null,
        }),
      });

      const urlData = await urlRes.json();
      if (!urlData.ok) throw new Error(urlData.error ?? 'Failed to get upload URL');

      // Step 3: PUT file to Supabase Storage
      const uploadRes = await fetch(urlData.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`Storage upload failed (${uploadRes.status})`);

      // Step 4: Add to local state
      const newDoc: UploadedDoc = {
        id:                 urlData.documentId,
        document_type:      spec.documentType,
        label:              spec.label,
        file_name:          file.name,
        file_size_bytes:    file.size,
        mime_type:          file.type,
        is_approved_public: false,
        visibility:         'private',
        period_year:        periodYear ?? null,
        uploaded_at:        new Date().toISOString(),
        created_at:         new Date().toISOString(),
      };

      setLocalDocs((prev) => [...prev, newDoc]);
      setUploading((prev) => ({ ...prev, [key]: 'done' }));
      onUploadComplete?.();

    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [key]: err.message ?? 'Upload failed' }));
      setUploading((prev) => ({ ...prev, [key]: 'error' }));
    }

    // Reset file input
    if (fileRefs.current[key]) fileRefs.current[key]!.value = '';
  }

  async function handleView(docId: string) {
    const res  = await fetch(`/api/orgs/${orgId}/documents/${docId}/view`);
    const data = await res.json();
    if (data.ok) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Could not open document: ' + data.error);
    }
  }

  return (
    <div className="card p-4 mb-4">
      <p className="sec-label">{title}</p>

      <div className="space-y-3 mt-1">
        {specs.map((spec) => {
          const docs        = getDocForType(spec.documentType);
          const state       = uploading[spec.documentType] ?? 'idle';
          const errMsg      = errors[spec.documentType] ?? '';
          const isUploading = state === 'uploading';
          const isDeleting  = state === 'deleting';
          const isBusy      = isUploading || isDeleting;
          const hasDoc      = docs.length > 0;
          // For "replace", we replace the most recent doc of this type
          const latestDoc   = hasDoc ? docs[0] : undefined;
          const inputId     = `doc-${orgId}-${spec.documentType}${periodYear ?? ''}`;

          return (
            <div key={spec.documentType}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">

              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12px] font-medium text-gray-800">{spec.label}</p>
                    {spec.required && (
                      <span className="text-[9px] text-red-500 font-medium uppercase">Required</span>
                    )}
                    {hasDoc && (
                      <span className="text-[9px] text-emerald-600 font-medium">✓ Uploaded</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{spec.description}</p>
                </div>

                {/* Upload / Replace button */}
                {!readOnly && (
                  <div className="flex-shrink-0">
                    <input
                      ref={(el) => { fileRefs.current[spec.documentType] = el; }}
                      type="file"
                      id={inputId}
                      className="hidden"
                      accept={spec.acceptedTypes ?? 'application/pdf,image/*'}
                      onChange={(e) => handleFileSelect(e, spec, latestDoc)}
                    />
                    <label htmlFor={inputId}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                                  text-[11px] font-medium cursor-pointer transition-colors border
                                  ${isBusy
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none'
                                    : hasDoc
                                    ? 'bg-white text-gray-600 border-gray-300 hover:border-emerald-300 hover:text-emerald-700'
                                    : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                                  }`}>
                      {isUploading ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border border-gray-400
                                           border-t-transparent rounded-full" />
                          Uploading…
                        </>
                      ) : isDeleting ? (
                        'Removing…'
                      ) : hasDoc ? (
                        '↑ Replace'
                      ) : (
                        '↑ Upload'
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Error */}
              {errMsg && (
                <p className="text-[10px] text-red-600 mb-1.5 bg-red-50 border border-red-200
                              rounded px-2 py-1">
                  {errMsg}
                </p>
              )}

              {/* Uploaded files list */}
              {docs.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {docs.map((doc) => (
                    <div key={doc.id}
                      className="flex items-center gap-2 bg-white border border-gray-200
                                 rounded-md px-3 py-2">
                      <span className="text-sm flex-shrink-0">
                        {FILE_ICON[doc.mime_type ?? ''] ?? '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-800 truncate">
                          {doc.file_name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {fmtBytes(doc.file_size_bytes)}
                          {doc.file_size_bytes ? ' · ' : ''}
                          {new Date(doc.created_at).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Status badge */}
                        {doc.is_approved_public ? (
                          <span className="badge badge-green text-[9px]">Public ✓</span>
                        ) : (
                          <span className="badge badge-gray text-[9px]">Private</span>
                        )}

                        {/* View */}
                        <button type="button" onClick={() => handleView(doc.id)}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900
                                     font-medium underline">
                          View
                        </button>

                        {/* Remove — disabled if approved */}
                        {!readOnly && (
                          doc.is_approved_public ? (
                            <span className="text-[10px] text-gray-300 cursor-not-allowed"
                              title="Revoke reviewer approval before removing">
                              Remove
                            </span>
                          ) : (
                            <button type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(doc, spec.documentType)}
                              className="text-[10px] text-red-500 hover:text-red-700 font-medium
                                         underline disabled:opacity-40 disabled:cursor-not-allowed">
                              Remove
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-400 mt-3">
        Accepted: PDF, JPG, PNG · Max 10MB · Documents are private until a reviewer approves them.
      </p>
    </div>
  );
}
