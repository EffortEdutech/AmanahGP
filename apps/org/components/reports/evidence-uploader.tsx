'use client';
// apps/org/components/reports/evidence-uploader.tsx
// Sprint 27 — Evidence upload widget
//
// Upload flow (ADR-005):
//   1. POST /api/evidence → get signed upload URL + creates evidence_files record
//   2. PUT file directly to Supabase Storage via signed URL
//   3. POST /api/evidence/confirm → mark upload complete
//
// Storage path: org/{orgId}/reports/{reportId}/{uuid}-{filename}
// Bucket: evidence (private)
// All files private by default. Reviewer approves for public visibility.

import { useState, useRef } from 'react';

interface EvidenceFile {
  id:               string;
  file_name:        string;
  mime_type:        string;
  visibility:       string;
  is_approved_public: boolean;
  file_size_bytes:  number | null;
  created_at:       string;
}

interface Props {
  orgId:         string;
  reportId:      string;
  existingFiles: EvidenceFile[];
  canUpload:     boolean;
}

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,application/pdf,video/mp4';
const MAX_SIZE_MB  = 10;

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <span className="text-blue-400">🖼</span>;
  if (mime.startsWith('video/')) return <span className="text-purple-400">🎬</span>;
  return <span className="text-gray-400">📄</span>;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function EvidenceUploader({ orgId, reportId, existingFiles, canUpload }: Props) {
  const [files,      setFiles]      = useState<EvidenceFile[]>(existingFiles);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState('');
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large — maximum ${MAX_SIZE_MB}MB`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Step 1 — get signed upload URL
      const urlRes  = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:        'get_upload_url',
          orgId, reportId,
          fileName:      file.name,
          mimeType:      file.type,
          fileSizeBytes: file.size,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlData.success) throw new Error(urlData.error ?? 'Failed to get upload URL');

      // Step 2 — upload directly to Supabase Storage
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT', body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error(`Storage upload failed: ${uploadRes.statusText}`);

      // Step 3 — confirm
      const confirmRes = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm', evidenceId: urlData.evidenceId,
          orgId, reportId,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) throw new Error(confirmData.error ?? 'Confirm failed');

      // Add to local list
      setFiles((prev) => [...prev, {
        id: urlData.evidenceId, file_name: file.name,
        mime_type: file.type, visibility: 'private',
        is_approved_public: false, file_size_bytes: file.size,
        created_at: new Date().toISOString(),
      }]);
      setUploadDone(true);
      setTimeout(() => setUploadDone(false), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(evidenceId: string) {
    if (!confirm('Remove this evidence file?')) return;
    const res  = await fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', evidenceId, orgId, reportId }),
    });
    const data = await res.json();
    if (data.success) {
      setFiles((prev) => prev.filter((f) => f.id !== evidenceId));
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-gray-700">
          Evidence files ({files.length})
        </p>
        {canUpload && (
          <label className={`flex items-center gap-1.5 text-[11px] font-medium cursor-pointer
            transition-colors ${
              uploading ? 'text-gray-400' : 'text-emerald-600 hover:text-emerald-700'
            }`}>
            {uploading ? (
              <><span className="animate-spin inline-block">⟳</span> Uploading…</>
            ) : uploadDone ? (
              <><span>✓</span> Uploaded!</>
            ) : (
              <><span>↑</span> Upload evidence</>
            )}
            <input ref={fileRef} type="file" accept={ACCEPT_TYPES}
              className="sr-only" disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }} />
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-2.5 bg-red-50 border-b border-red-100">
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 px-5 py-3">
              <FileIcon mime={file.mime_type} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800 truncate">{file.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    file.is_approved_public
                      ? 'bg-emerald-100 text-emerald-700'
                      : file.visibility === 'reviewer_only'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {file.is_approved_public ? 'Public ✓' :
                     file.visibility === 'reviewer_only' ? 'Reviewer only' : 'Private'}
                  </span>
                  {file.file_size_bytes && (
                    <span className="text-[10px] text-gray-400">
                      {formatBytes(file.file_size_bytes)}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(file.created_at).toLocaleDateString('en-MY')}
                  </span>
                </div>
              </div>
              {canUpload && !file.is_approved_public && (
                <button type="button" onClick={() => handleDelete(file.id)}
                  className="text-[10px] text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-[13px] text-gray-400">No evidence uploaded yet</p>
          {canUpload && (
            <p className="text-[11px] text-gray-400 mt-1">
              Upload photos, PDFs, or short videos to support this report.
            </p>
          )}
        </div>
      )}

      {/* Footer note */}
      {canUpload && (
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] text-gray-400">
            JPG, PNG, WebP, PDF, MP4 · Max {MAX_SIZE_MB}MB ·
            All files private by default — reviewer approves for public visibility
          </p>
        </div>
      )}
    </div>
  );
}
