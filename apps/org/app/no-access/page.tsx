// apps/org/app/no-access/page.tsx
// amanahOS — No access / live access diagnostic landing page — v5

import { redirect } from 'next/navigation';
import { getAmanahOsAccessContext } from '@/lib/access/amanahos-access';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Access diagnostic — amanahOS' };

const REASON_COPY: Record<string, { title: string; body: string }> = {
  not_authenticated: {
    title: 'Sign in required',
    body: 'The live server-side check cannot see an active Supabase Auth session. Sign in again from amanahOS.',
  },
  no_user_record: {
    title: 'User record not found',
    body: 'Supabase Auth is active, but amanahOS cannot match this session to public.users or platform_user_roles.',
  },
  not_member_of_org: {
    title: 'Access not available',
    body: 'This account is not recognised as super_admin and has no active organisation membership.',
  },
  no_organizations_available: {
    title: 'No organisation rows found',
    body: 'This account is super_admin, but amanahOS did not find any rows in public.organizations using the current database connection. Super admin does not require org_members.',
  },
  platform_role: {
    title: 'Console-only role',
    body: 'This account has an internal console-only role and is blocked from amanahOS. Use AGP Console instead.',
  },
};

function display(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  const text = String(value).trim();
  return text ? text : '-';
}

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect?: string;
    reason?: string;
    auth_id?: string;
    auth_email?: string;
    effective_role?: string;
    public_role?: string;
    platform_roles?: string;
    matched_users?: string;
    org_source?: string;
    org_count?: string;
    supabase_url?: string;
  }>;
}) {
  const params = await searchParams;
  const liveContext = await getAmanahOsAccessContext();

  if (liveContext.ok) {
    redirect('/dashboard');
  }

  const live = liveContext.diagnostic;
  const reason = live.reason || params.reason || '';
  const copy = REASON_COPY[reason] ?? {
    title: 'Access not available',
    body: 'You do not have access to this workspace. Contact your administrator if you believe this is an error.',
  };
  const consoleUrl = params.redirect ?? process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';

  const liveDiagnostics = [
    ['LIVE reason', live.reason],
    ['LIVE auth email', live.authEmail],
    ['LIVE auth user id', live.authUserId],
    ['LIVE effective role', live.effectiveRole],
    ['LIVE public.users role', live.publicUserRole],
    ['LIVE platform roles', live.platformRoles],
    ['LIVE matched public.users rows', live.matchedPublicUsers],
    ['LIVE organisation source', live.orgSource],
    ['LIVE organisation count', live.orgCount],
    ['LIVE Supabase URL', live.supabaseUrl],
  ];

  const redirectDiagnostics = [
    ['redirect reason', params.reason],
    ['redirect auth email', params.auth_email],
    ['redirect auth user id', params.auth_id],
    ['redirect effective role', params.effective_role],
    ['redirect public.users role', params.public_role],
    ['redirect platform roles', params.platform_roles],
    ['redirect matched public.users rows', params.matched_users],
    ['redirect organisation source', params.org_source],
    ['redirect organisation count', params.org_count],
    ['redirect Supabase URL', params.supabase_url],
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <span className="text-2xl text-amber-600">⚠</span>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{copy.title}</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600">{copy.body}</p>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <h2 className="mb-1 text-sm font-semibold text-emerald-950">Live server-side access diagnostic</h2>
          <p className="mb-3 text-xs leading-relaxed text-emerald-800">
            For super_admin, LIVE effective role should be <b>super_admin</b>, organisation source should be <b>public.organizations</b>, and organisation count should be greater than zero.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {liveDiagnostics.map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-white p-3 ring-1 ring-emerald-100">
                <dt className="text-xs font-medium uppercase tracking-wide text-emerald-500">{String(label)}</dt>
                <dd className="mt-1 break-all font-mono text-xs text-gray-900">{display(value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Redirect diagnostic from previous page</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {redirectDiagnostics.map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-white p-3 ring-1 ring-gray-100">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{String(label)}</dt>
                <dd className="mt-1 break-all font-mono text-xs text-gray-800">{display(value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {reason === 'no_organizations_available' && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
            <p className="font-semibold">Run this SQL in the same Supabase project used by amanahOS:</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-xs ring-1 ring-amber-200">select count(*) as organizations_count from public.organizations;</pre>
            <p className="mt-3 text-xs leading-relaxed">
              If this returns 0, the app is connected to a database that has your user role but no organisation seed rows. If it returns more than 0, restart amanahOS and clear <code>.next</code>.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {reason === 'platform_role' && (
            <a
              href={consoleUrl}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Go to AGP Console ↗
            </a>
          )}
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Retry dashboard
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to sign in
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">amanahOS · Amanah Governance Platform</p>
      </div>
    </div>
  );
}
