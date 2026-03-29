// apps/admin/app/(dashboard)/orgs/[orgId]/edit/page.tsx
// AmanahHub Console — Edit organization profile (Sprint 1 gap)

import { redirect }         from 'next/navigation';
import { createClient }     from '@/lib/supabase/server';
import { updateOrgProfile } from '../../actions';
import { EditOrgForm }      from '@/components/org/edit-org-form';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Edit Profile | AmanahHub Console' };

export default async function EditOrgPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url,
      contact_email, contact_phone, address_text, state, summary
    `)
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  const { data: canEdit } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  if (!canEdit) redirect(`/orgs/${orgId}`);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <a href={`/orgs/${orgId}`}
           className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← {org.name}
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Edit organization profile</h1>
      </div>

      <EditOrgForm
        orgId={orgId}
        action={updateOrgProfile}
        defaultValues={{
          name:           org.name,
          legalName:      org.legal_name      ?? '',
          registrationNo: org.registration_no ?? '',
          websiteUrl:     org.website_url      ?? '',
          contactEmail:   org.contact_email    ?? '',
          contactPhone:   org.contact_phone    ?? '',
          addressText:    org.address_text     ?? '',
          state:          org.state            ?? '',
          summary:        org.summary          ?? '',
        }}
      />
    </div>
  );
}
