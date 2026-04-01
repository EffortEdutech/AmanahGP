// apps/admin/app/(dashboard)/admin/audit/page.tsx
// AmanahHub Console — Super Admin: platform-wide audit logs

import { redirect }             from 'next/navigation';
import { createClient,
         createServiceClient }  from '@/lib/supabase/server';

export const metadata = { title: 'Audit Logs | AmanahHub Console' };

const ACTION_LABELS: Record<string, string> = {
  ORG_APPROVED:           'Organization approved',
  ORG_REJECTED:           'Organization rejected',
  ORG_SUBMITTED:          'Onboarding submitted',
  PROJECT_CREATED:        'Project created',
  PROJECT_ARCHIVED:       'Project archived',
  REPORT_CREATED:         'Report draft created',
  REPORT_SUBMITTED:       'Report submitted',
  REPORT_VERIFIED:        'Report verified',
  REPORT_REJECTED:        'Report rejected',
  CERTIFICATION_APPROVED: 'Certification approved',
  CERTIFICATION_REJECTED: 'Certification rejected',
  CTCF_EVALUATED:         'CTCF evaluation submitted',
  MEMBER_INVITED:         'Member invited',
  MEMBER_JOINED:          'Member joined',
  MANUAL_RECALC:          'Amanah score recalculated',
};

const ACTOR_ROLE_BADGE: Record<string, string> = {
  super_admin: 'badge badge-purple',
  reviewer:    'badge badge-amber',
  scholar:     'badge badge-blue',
  org_admin:   'badge badge-green',
  org_manager: 'badge badge-gray',
};

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const svc      = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('users')
    .select('platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  const me = data as { platform_role: string } | null;
  if (!me || me.platform_role !== 'super_admin') redirect('/dashboard');

  // Latest 100 audit events via service client
  const { data: logs } = await svc
    .from('audit_logs')
    .select(`
      id, action, actor_role, occurred_at, metadata,
      entity_table, entity_id,
      users:actor_user_id ( display_name, email ),
      organizations:organization_id ( name )
    `)
    .order('occurred_at', { ascending: false })
    .limit(100);

  // Group by date
  const byDate: Record<string, typeof logs> = {};
  for (const log of logs ?? []) {
    const day = new Date(log.occurred_at).toLocaleDateString('en-MY', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    byDate[day] = [...(byDate[day] ?? []), log];
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-gray-900">Audit logs</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Latest {logs?.length ?? 0} platform events — append-only
        </p>
      </div>

      {Object.entries(byDate).map(([day, dayLogs]) => (
        <div key={day} className="mb-5">
          <p className="sec-label">{day}</p>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {dayLogs!.map((log) => {
                const actor = Array.isArray(log.users) ? log.users[0] : log.users;
                const org   = Array.isArray(log.organizations) ? log.organizations[0] : log.organizations;
                const roleCls = ACTOR_ROLE_BADGE[log.actor_role ?? ''] ?? 'badge badge-gray';
                const label = ACTION_LABELS[log.action]
                  ?? log.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

                return (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-4">
                    {/* Time */}
                    <span className="text-[10px] text-gray-400 w-[60px] flex-shrink-0 pt-0.5">
                      {new Date(log.occurred_at).toLocaleTimeString('en-MY', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>

                    {/* Event */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-900">{label}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {org?.name && (
                          <span className="text-[10px] text-gray-500">{org.name}</span>
                        )}
                        {actor?.display_name && (
                          <span className="text-[10px] text-gray-400">
                            by {actor.display_name}
                          </span>
                        )}
                        {log.entity_table && (
                          <span className="text-[9px] text-gray-300 font-mono">
                            {log.entity_table}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role badge */}
                    {log.actor_role && (
                      <span className={`${roleCls} flex-shrink-0`}>
                        {log.actor_role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {(!logs || logs.length === 0) && (
        <div className="card p-8 text-center">
          <p className="text-[12px] text-gray-400">No audit events recorded yet.</p>
        </div>
      )}
    </div>
  );
}
