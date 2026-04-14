// apps/org/app/no-access/page.tsx
// amanahOS — No access page
// Shown when a reviewer / scholar / super_admin tries to access amanahOS.
// They should use AmanahHub Console instead.

export const metadata = {
  title: 'Access not available — amanahOS',
};

export default async function NoAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const consoleUrl =
    params.redirect ??
    process.env.NEXT_PUBLIC_CONSOLE_URL ??
    '#';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-6">

        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <span className="text-amber-600 text-2xl">⚠</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-gray-900">
            This workspace is for organisations
          </h1>
          <p className="text-sm text-gray-500">
            amanahOS is the governance workspace for organisation members.
            Your account has a platform role (reviewer, scholar, or admin)
            that belongs in AmanahHub Console.
          </p>
        </div>

        <a
          href={consoleUrl}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700
                     text-white text-sm font-medium rounded-md transition-colors"
        >
          Go to AmanahHub Console
          <span>↗</span>
        </a>

        <p className="text-xs text-gray-400">
          If you believe this is an error, contact your platform administrator.
        </p>
      </div>
    </div>
  );
}
