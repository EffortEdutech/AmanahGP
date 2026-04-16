// apps/org/app/(protected)/policy-kit/page.tsx
// amanahOS — Policy Kit
// Sprint 22
//
// 7 governance policy templates with upload workflow.
// Each upload → org_documents record → trust event gov_policy_uploaded (+15 pts)
// CTCF Layer 1 gate requires: coi_policy

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { PolicyCard }          from '@/components/policy-kit/policy-card';
import { POLICY_TEMPLATES }    from '@/lib/policy-templates';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Policy kit — amanahOS' };

export default async function PolicyKitPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId     = membership.organization_id;
  const org       = relationOne<{ id: string; name: string; fund_types: string[] }>(membership.organizations);
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);
  const fundTypes = org?.fund_types ?? [];

  // Load all uploaded governance documents
  const { data: uploadedDocs } = await service
    .from('org_documents')
    .select('id, document_type, label, file_name, created_at, storage_path')
    .eq('organization_id', orgId)
    .eq('document_category', 'governance')
    .in('document_type', POLICY_TEMPLATES.map((t) => t.id))
    .order('created_at', { ascending: false });

  // Map: document_type → most recent upload
  const uploadedMap = new Map<string, typeof uploadedDocs extends (infer T)[] | null ? T : never>();
  for (const doc of (uploadedDocs ?? [])) {
    if (!uploadedMap.has(doc.document_type)) {
      uploadedMap.set(doc.document_type, doc);
    }
  }

  // Filter templates applicable to this org
  const visibleTemplates = POLICY_TEMPLATES.filter((t) => {
    if (!t.appliesToTypes) return true;
    return t.appliesToTypes.some((type) => fundTypes.includes(type));
  });

  const uploadedCount  = visibleTemplates.filter((t) => uploadedMap.has(t.id)).length;
  const requiredDone   = visibleTemplates.filter((t) => t.required && uploadedMap.has(t.id)).length;
  const requiredTotal  = visibleTemplates.filter((t) => t.required).length;
  const totalPtsEarned = visibleTemplates
    .filter((t) => uploadedMap.has(t.id))
    .reduce((s, t) => s + t.trustPts, 0);

  // CTCF Layer 1 gate readiness
  const hasCOI    = uploadedMap.has('coi_policy');
  const layer1Pct = Math.round((requiredDone / Math.max(requiredTotal, 1)) * 100);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Governance Policy Kit</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} Â· Auditors always ask for policies. Most orgs have none. Upload yours.
        </p>
      </div>

      {/* Summary banner */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-gray-800">
              {uploadedCount} of {visibleTemplates.length} policies uploaded
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Each policy earns +15 Governance trust points
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-700">+{totalPtsEarned}</p>
            <p className="text-[10px] text-gray-400">pts earned</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(uploadedCount / visibleTemplates.length) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{uploadedCount} uploaded</span>
            <span>{visibleTemplates.length - uploadedCount} remaining</span>
          </div>
        </div>
      </div>

      {/* CTCF Layer 1 Gate status */}
      <div className={`rounded-lg border p-4 ${
        hasCOI
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{hasCOI ? '✓' : 'âš '}</span>
          <div>
            <p className={`text-[12px] font-semibold ${hasCOI ? 'text-emerald-800' : 'text-amber-800'}`}>
              CTCF Layer 1 Gate — {hasCOI ? 'Conflict of Interest Policy uploaded ✓' : 'Conflict of Interest Policy required'}
            </p>
            <p className={`text-[11px] mt-0.5 ${hasCOI ? 'text-emerald-700' : 'text-amber-700'}`}>
              {hasCOI
                ? 'Your organisation passes the CTCF Layer 1 governance gate requirement for policy documentation.'
                : 'CTCF certification requires a Conflict of Interest Policy. Upload it below to pass the Layer 1 gate.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Trust event note */}
      {isManager && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3">
          <span className="text-blue-500 flex-shrink-0">â–²</span>
          <p className="text-[11px] text-blue-800">
            Each uploaded policy emits a <strong>gov_policy_uploaded</strong> trust event
            (+15 Governance). These are idempotent — uploading the same policy type again
            does not add extra points.
          </p>
        </div>
      )}

      {/* Policy cards — required first */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
          Required for CTCF
        </h2>
        {visibleTemplates
          .filter((t) => t.required)
          .map((template) => (
            <PolicyCard
              key={template.id}
              template={template}
              orgId={orgId}
              uploaded={uploadedMap.get(template.id) as never}
              isManager={isManager} />
          ))}

        <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide pt-2">
          Recommended governance policies
        </h2>
        {visibleTemplates
          .filter((t) => !t.required)
          .map((template) => (
            <PolicyCard
              key={template.id}
              template={template}
              orgId={orgId}
              uploaded={uploadedMap.get(template.id) as never}
              isManager={isManager} />
          ))}
      </div>

      {/* Footer note */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-[11px] font-semibold text-gray-700">How to use this kit</p>
        <div className="text-[11px] text-gray-500 mt-1 space-y-1">
          <p>1. Click <strong>Preview template</strong> to see the pre-written policy.</p>
          <p>2. Copy the template, replace <strong>[placeholders]</strong> with your organisation's details.</p>
          <p>3. Print, sign (Chairman's signature required), and scan to PDF.</p>
          <p>4. Click <strong>Upload signed PDF</strong> to submit.</p>
          <p>5. Each uploaded policy earns +15 Governance trust points and advances your Amanah Ready progress.</p>
        </div>
      </div>

    </div>
  );
}

