// apps/admin/app/(dashboard)/orgs/[orgId]/scholar/page.tsx
// AmanahHub Console — Scholar notes for an organization

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScholarNoteForm } from '@/components/review/scholar-note-form';
import { addScholarNote }  from './scholar-actions';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Scholar Notes | AmanahHub Console' };

export default async function ScholarNotesPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('id, platform_role, display_name')
    .eq('auth_provider_user_id', user.id).single();

  const isScholar = ['scholar', 'reviewer', 'super_admin'].includes(me?.platform_role ?? '');
  if (!isScholar) redirect('/dashboard');

  const { data: org } = await supabase
    .from('organizations').select('id, name').eq('id', orgId).single();

  if (!org) redirect('/dashboard');

  const { data: notes } = await supabase
    .from('scholar_notes')
    .select(`id, note_body, is_publishable, published_at, created_at,
             users ( display_name )`)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href={`/orgs/${orgId}`}
           className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← {org.name}
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Scholar notes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Advisory notes visible to the platform reviewer and org admin (if publishable).
        </p>
      </div>

      {/* Add note */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add note</h2>
        <ScholarNoteForm orgId={orgId} action={addScholarNote} />
      </div>

      {/* Existing notes */}
      <div className="space-y-3">
        {notes?.length ? notes.map((note) => {
          const author = Array.isArray(note.users) ? note.users[0] : note.users;
          return (
            <div key={note.id}
              className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-medium text-gray-700">
                    {author?.display_name ?? 'Scholar'}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(note.created_at).toLocaleDateString('en-MY')}
                  </span>
                </div>
                {note.is_publishable && (
                  <span className="text-xs font-medium text-emerald-600
                                   bg-emerald-50 px-2 py-0.5 rounded-full">
                    Publishable
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note_body}</p>
            </div>
          );
        }) : (
          <div className="text-center py-8 text-sm text-gray-400">
            No notes yet.
          </div>
        )}
      </div>
    </div>
  );
}
