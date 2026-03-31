// apps/admin/app/(dashboard)/review/scholar/page.tsx
// AmanahHub Console — Scholar notes (Sprint 8 UI uplift)
// Fixed: addScholarNote imported from correct existing actions file

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';
import { ScholarNoteForm }   from './scholar-note-form';
// addScholarNote lives in orgs/[orgId]/scholar/scholar-actions.ts (delivered Sprint 5)
import { addScholarNote }    from '../../orgs/[orgId]/scholar/scholar-actions';

export const metadata = { title: 'Scholar Notes | AmanahHub Console' };

export default async function ScholarNotesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('id, display_name, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || !isReviewerOrAbove(me.platform_role)) redirect('/dashboard');

  // Load listed orgs so reviewer can pick one
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('listing_status', 'listed')
    .order('name')
    .limit(20);

  const firstOrgId   = orgs?.[0]?.id ?? '';
  const firstOrgName = orgs?.[0]?.name ?? '—';

  // Notes for the first listed org
  const { data: notes } = firstOrgId
    ? await supabase
        .from('scholar_notes')
        .select(`
          id, note_body, is_publishable, published_at, created_at,
          users ( display_name, platform_role )
        `)
        .eq('organization_id', firstOrgId)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-2xl">
      <h1 className="text-[18px] font-semibold text-gray-900 mb-4">Scholar notes</h1>

      {/* Add note form */}
      <div className="card p-4 mb-4">
        <p className="sec-label">Add note — {firstOrgName}</p>
        <ScholarNoteForm orgId={firstOrgId} action={addScholarNote} />
      </div>

      {/* Existing notes */}
      <p className="sec-label">Existing notes</p>

      {notes?.length ? (
        <div className="space-y-3">
          {notes.map((note) => {
            const author = Array.isArray(note.users) ? note.users[0] : note.users;
            const isOld  = !note.is_publishable;

            return (
              <div key={note.id} className={`card p-4 ${isOld ? 'opacity-70' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[12px] font-medium text-gray-900">
                    {author?.display_name ?? '—'}
                    {author?.platform_role && (
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        ({author.platform_role})
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(note.created_at).toLocaleDateString('en-MY', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>

                <p className="text-[12px] text-gray-700 leading-relaxed mb-2">
                  {note.note_body}
                </p>

                {note.is_publishable ? (
                  <span className="badge badge-green">Publishable</span>
                ) : (
                  <span className="badge badge-gray">Internal only</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-[12px] text-gray-400">No notes yet for this organization.</p>
        </div>
      )}
    </div>
  );
}
