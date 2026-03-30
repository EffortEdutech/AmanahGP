'use client';
// apps/admin/components/report/evidence-section.tsx
// AmanahHub Console — Evidence list + upload widget for report detail page

import { useState, useRef } from 'react';
import { useRouter }        from 'next/navigation';
import {
  DocumentIcon, PhotoIcon, FilmIcon,
  ArrowUpTrayIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface EvidenceFile {
  id:               string;
  file_name:        string;
  mime_type:        string;
  visibility:       string;
  is_approved_public: boolean;
  created_at:       string;
}

interface Props {
  orgId:     string;
  reportId:  string;
  evidence:  EvidenceFile[];
  canUpload: boolean;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function EvidenceSection({ orgId, reportId, evidence, canUpload }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [localFiles, setLocalFiles]   = useState<EvidenceFile[]>(evidence);
  const fileRef = useRef<HTMLInputElement>(null);
  const router  = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState('uploading');
    setUploadError('');

    try {
      // 1. Get pre-signed upload URL
      const urlRes = await fetch(
        `/api/orgs/${orgId}/reports/${reportId}/evidence/upload-url`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            fileName:      file.name,
            mimeType:      file.type,
            fileSizeBytes: file.size,
          }),
        }
      );

      const urlData = await urlRes.json();
      if (!urlData.ok) throw new Error(urlData.error ?? 'Failed to get upload URL');

      // 2. Upload directly to Supabase Storage
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body:   file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      // 3. Confirm the evidence record
      const confirmRes = await fetch(
        `/api/orgs/${orgId}/reports/${reportId}/evidence/${urlData.evidenceId}/confirm`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ visibility: 'private' }),
        }
      );

      const confirmData = await confirmRes.json();
      if (!confirmData.ok) throw new Error(confirmData.error ?? 'Failed to confirm upload');

      setUploadState('done');
      setLocalFiles((prev) => [
        ...prev,
        {
          id:               urlData.evidenceId,
          file_name:        file.name,
          mime_type:        file.type,
          visibility:       'private',
          is_approved_public: false,
          created_at:       new Date().toISOString(),
        },
      ]);

      // Reset file input
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setUploadState('idle'), 2000);

    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
      setUploadState('error');
    }
  }

  function fileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return <PhotoIcon className="w-5 h-5 text-blue-400" />;
    if (mimeType.startsWith('video/')) return <FilmIcon className="w-5 h-5 text-purple-400" />;
    return <DocumentIcon className="w-5 h-5 text-gray-400" />;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Evidence ({localFiles.length})
        </h2>
        {canUpload && (
          <label className="flex items-center gap-1.5 text-sm font-medium text-emerald-700
                            hover:text-emerald-800 cursor-pointer">
            <ArrowUpTrayIcon className="w-4 h-4" />
            {uploadState === 'uploading' ? 'Uploading…' :
             uploadState === 'done'      ? 'Uploaded ✓' : 'Upload file'}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadState === 'uploading'}
            />
          </label>
        )}
      </div>

      {uploadError && (
        <div className="px-5 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
          {uploadError}
        </div>
      )}

      {localFiles.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {localFiles.map((f) => (
            <li key={f.id} className="px-5 py-3 flex items-center gap-3">
              {fileIcon(f.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{f.file_name}</p>
                <p className="text-xs text-gray-400">
                  {f.visibility === 'public' ? 'Public' : f.visibility === 'reviewer_only' ? 'Reviewer only' : 'Private'}
                  {f.is_approved_public ? ' · Approved public' : ''}
                  {' · '}{new Date(f.created_at).toLocaleDateString('en-MY')}
                </p>
              </div>
              {f.is_approved_public && (
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No evidence uploaded yet.</p>
          {canUpload && (
            <p className="text-xs text-gray-400 mt-1">
              Upload photos, PDFs, or videos to support this report.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
