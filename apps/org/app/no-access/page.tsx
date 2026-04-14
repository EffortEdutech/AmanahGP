// apps/org/app/no-access/page.tsx
// amanahOS — No access / error landing page
//
// Used for:
//   ?reason=no_user_record     → public.users row missing (seed not run?)
//   ?reason=no_org_membership  → authenticated but not a member of any org
//   ?reason=platform_role      → reviewer/scholar/super_admin — use Console instead
//   (no reason)                → generic fallback

export const metadata = { title: 'Access not available — amanahOS' };

const REASON_COPY: Record<string, { title: string; body: string }> = {
  no_user_record: {
    title: 'User record not found',
    body:
      'Your account exists in Supabase Auth but has no matching record in the platform database. ' +
      'This usually means the seed data was not applied. Run: npx supabase db reset',
  },
  no_org_membership: {
    title: 'No organisation membership',
    body:
      'Your account is not a member of any organisation. ' +
      'Ask your organisation administrator to invite you, or contact the platform admin.',
  },
  platform_role: {
    title: 'Wrong workspace',
    body:
      'Your account has a platform role (reviewer, scholar, or admin). ' +
      'amanahOS is the workspace for organisation members. ' +
      'Please use AmanahHub Console instead.',
  },
};

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reason?: string }>;
}) {
  const params  = await searchParams;
  const reason  = params.reason ?? '';
  const copy    = REASON_COPY[reason] ?? {
    title: 'Access not available',
    body:  'You do not have access to this workspace. Contact your administrator if you believe this is an error.',
  };
  const consoleUrl = params.redirect ?? process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-6">

        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <span className="text-amber-600 text-2xl">⚠</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-gray-900">{copy.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">{copy.body}</p>
        </div>

        <div className="flex flex-col gap-2">
          {reason === 'platform_role' && (
            <a
              href={consoleUrl}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5
                         bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-medium rounded-md transition-colors"
            >
              Go to AmanahHub Console ↗
            </a>
          )}
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5
                       bg-white border border-gray-200 hover:bg-gray-50 text-gray-700
                       text-sm font-medium rounded-md transition-colors"
          >
            Back to sign in
          </a>
        </div>

        {reason === 'no_user_record' && (
          <div className="rounded-md bg-gray-900 text-green-400 text-xs text-left p-3 font-mono">
            npx supabase db reset
          </div>
        )}

        <p className="text-xs text-gray-400">
          amanahOS · Amanah Governance Platform
        </p>
      </div>
    </div>
  );
}
