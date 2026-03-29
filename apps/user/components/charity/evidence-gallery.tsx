// apps/user/components/charity/evidence-gallery.tsx
// AmanahHub — Public evidence gallery for project pages
// Only shows evidence where is_approved_public=true

import { createClient } from '@/lib/supabase/server';

interface Props {
  reportId:       string;
  organizationId: string;
}

const MIME_ICONS: Record<string, string> = {
  'image/jpeg': '🖼',
  'image/png':  '🖼',
  'image/webp': '🖼',
  'application/pdf': '📄',
  'video/mp4':  '🎬',
};

export async function EvidenceGallery({ reportId, organizationId }: Props) {
  const supabase = await createClient();

  const { data: evidence } = await supabase
    .from('evidence_files')
    .select('id, file_name, mime_type, storage_path, captured_at, geo_lat, geo_lng')
    .eq('project_report_id', reportId)
    .eq('is_approved_public', true)
    .eq('visibility', 'public')
    .order('captured_at', { ascending: false });

  if (!evidence?.length) return null;

  // Generate signed URLs for each evidence file
  const supabaseWithUrls = await createClient();
  const filesWithUrls = await Promise.all(
    evidence.map(async (ev) => {
      const { data } = await supabaseWithUrls.storage
        .from('evidence')
        .createSignedUrl(ev.storage_path, 3600); // 1 hour TTL
      return { ...ev, signedUrl: data?.signedUrl ?? null };
    })
  );

  const images = filesWithUrls.filter(f => f.mime_type.startsWith('image/') && f.signedUrl);
  const docs   = filesWithUrls.filter(f => !f.mime_type.startsWith('image/'));

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-gray-500 mb-2">
        Evidence ({evidence.length} verified file{evidence.length !== 1 ? 's' : ''})
      </p>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img) => (
            <a key={img.id} href={img.signedUrl!} target="_blank" rel="noopener noreferrer"
              className="block aspect-square rounded-lg overflow-hidden bg-gray-100
                         hover:opacity-90 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.signedUrl!}
                alt={img.file_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div className="space-y-1">
          {docs.map((doc) => (
            <a key={doc.id}
              href={doc.signedUrl ?? '#'}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-emerald-700 hover:text-emerald-800
                         hover:underline">
              <span>{MIME_ICONS[doc.mime_type] ?? '📎'}</span>
              <span className="truncate">{doc.file_name}</span>
              {doc.captured_at && (
                <span className="text-gray-400 flex-shrink-0">
                  {new Date(doc.captured_at).toLocaleDateString('en-MY')}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        ✓ All evidence verified and approved by platform reviewer
      </p>
    </div>
  );
}
