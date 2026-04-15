'use client';
// apps/org/components/policy-kit/policy-card.tsx
// Sprint 22 — Individual policy card
// Shows template preview, upload status, and upload button.
// Upload flow: browser → signed URL → Supabase Storage (direct).

import { useState, useRef, useTransition } from 'react';
import type { PolicyTemplate }             from '@/lib/policy-templates';

interface UploadedDoc {
  id:         string;
  label:      string;
  file_name:  string;
  created_at: string;
  storage_path: string;
}

interface Props {
  template:   PolicyTemplate;
  orgId:      string;
  uploaded?:  UploadedDoc;
  isManager:  boolean;
}

export function PolicyCard({ template, orgId, uploaded, isManager }: Props) {
  const [showPreview,  setShowPreview]  = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  const [uploadDone,   setUploadDone]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [isPending,    startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const isUploaded = !!(uploaded || uploadDone);

  const CTCF_COLOR: Record<string, string> = {
    'Layer 1 — Gate': 'bg-red-100 text-red-700 border-red-200',
    'Layer 1':        'bg-red-100 text-red-700 border-red-200',
    'Layer 2':        'bg-blue-100 text-blue-700 border-blue-200',
    'Layer 5':        'bg-purple-100 text-purple-700 border-purple-200',
    'Governance':     'bg-amber-100 text-amber-700 border-amber-200',
  };
  const ctcfColor = CTCF_COLOR[template.ctcfLayer] ?? 'bg-gray-100 text-gray-600';

  async function handleUpload(file: File) {
    setUploadError('');
    setUploading(true);

    try {
      // Step 1: Get signed upload URL
      const urlRes = await fetch('/api/policy-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:        'get_upload_url',
          orgId,
          documentType:  template.id,
          label:         template.title,
          fileName:      file.name,
          mimeType:      file.type,
          fileSizeBytes: file.size,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlData.success) throw new Error(urlData.error ?? 'Failed to get upload URL');

      // Step 2: Upload directly to Supabase Storage via signed URL
      const uploadRes = await fetch(urlData.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.statusText}`);

      // Step 3: Confirm upload + emit trust event
      const confirmRes = await fetch('/api/policy-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:       'confirm_upload',
          orgId,
          documentId:   urlData.documentId,
          documentType: template.id,
          policyTitle:  template.title,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) throw new Error(confirmData.error ?? 'Confirm failed');

      setUploadDone(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!uploaded || !confirm('Remove this policy document?')) return;
    setDeleting(true);
    await fetch('/api/policy-kit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete', orgId,
        documentId:  uploaded.id,
        storagePath: uploaded.storage_path,
      }),
    });
    setDeleting(false);
    window.location.reload();
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isUploaded
        ? 'border-emerald-200 bg-emerald-50/20'
        : template.required
        ? 'border-amber-200 bg-amber-50/10'
        : 'border-gray-200 bg-white'
    }`}>

      {/* Card header */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{template.emoji}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[14px] font-semibold text-gray-900">{template.title}</h3>
                {template.required && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    CTCF Required
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{template.titleBM}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex-shrink-0 text-right space-y-1">
            {isUploaded
              ? <span className="inline-flex items-center gap-1 text-[10px] font-medium
                                 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓ Uploaded
                </span>
              : <span className="text-[10px] text-gray-400">Not uploaded</span>
            }
            <span className={`block text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${ctcfColor}`}>
              {template.ctcfLayer}
            </span>
          </div>
        </div>

        <p className="text-[12px] text-gray-600 leading-relaxed">{template.description}</p>

        <p className="text-[10px] text-gray-400">
          CTCF: {template.ctcfCriterion}
        </p>

        {/* Upload info */}
        {(uploaded || uploadDone) && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200
                          rounded-lg px-3 py-2">
            <div>
              <p className="text-[11px] font-medium text-emerald-800">
                {uploaded?.file_name ?? 'Document uploaded'}
              </p>
              {uploaded?.created_at && (
                <p className="text-[10px] text-emerald-600">
                  {new Date(uploaded.created_at).toLocaleDateString('en-MY', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </div>
            {isManager && uploaded && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] text-red-500 hover:text-red-700 transition-colors disabled:opacity-40">
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
        {/* Preview template */}
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          className="text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors">
          {showPreview ? '▲ Hide template' : '▼ Preview template'}
        </button>

        {/* Upload button */}
        {isManager && !isUploaded && (
          <>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white
                         text-[11px] font-medium rounded-lg transition-colors disabled:opacity-40
                         flex items-center gap-1.5">
              {uploading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Uploading…
                </>
              ) : (
                <>
                  ↑ Upload signed PDF
                  <span className="text-emerald-200">+{template.trustPts}pts</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }} />
          </>
        )}

        {isManager && !isUploaded && (
          <span className="text-[10px] text-gray-400">PDF, JPG or PNG · max 10MB</span>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="mx-5 mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-[11px] text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Template preview */}
      {showPreview && (
        <div className="mx-5 mb-5 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
          <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              Policy template — customise before uploading
            </p>
            <span className="text-[9px] text-gray-400">Replace [placeholders] with your organisation's details</span>
          </div>
          <pre className="px-4 py-4 text-[10px] text-gray-700 font-mono leading-relaxed
                          whitespace-pre-wrap break-words overflow-auto max-h-80">
            {template.template}
          </pre>
          <div className="px-4 py-2.5 bg-gray-100 border-t border-gray-200">
            <p className="text-[10px] text-gray-500">
              Copy this template, fill in your organisation's details, sign the document,
              then upload the signed PDF above. Keep the original on file for your records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
