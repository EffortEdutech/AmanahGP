// apps/org/app/setup/page.tsx
// amanahOS — Setup required page
// Shown when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.
// This means apps/org/.env.local has not been created yet.

export const metadata = { title: 'Setup required — amanahOS' };

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-6">

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <span className="text-amber-600 text-xl">⚙</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Setup required</h1>
          <p className="text-sm text-gray-500">
            The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">apps/org/.env.local</code> file
            is missing. amanahOS needs your Supabase credentials to start.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">
            Step 1 — Get your local Supabase keys
          </h2>
          <p className="text-xs text-gray-500">Open a PowerShell window in your repo root and run:</p>
          <pre className="bg-gray-900 text-green-400 text-xs rounded-md p-3 overflow-x-auto">
            npx supabase status
          </pre>
          <p className="text-xs text-gray-500">
            Copy the <strong>API URL</strong> and <strong>anon key</strong> from the output.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">
            Step 2 — Create <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">apps/org/.env.local</code>
          </h2>
          <p className="text-xs text-gray-500">Create this file in your repo and paste in your values:</p>
          <pre className="bg-gray-900 text-green-400 text-xs rounded-md p-3 overflow-x-auto whitespace-pre">{`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key-here

NEXT_PUBLIC_APP_NAME=amanahOS
NEXT_PUBLIC_APP_FULL_NAME=amanahOS — Governance Workspace
NEXT_PUBLIC_PLATFORM_NAME=Amanah Governance Platform
NEXT_PUBLIC_APP_URL=http://localhost:3302
NEXT_PUBLIC_HUB_URL=http://localhost:3300
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3301`}</pre>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">Step 3 — Restart the dev server</h2>
          <p className="text-xs text-gray-500">
            Stop the current process (Ctrl+C) then restart:
          </p>
          <pre className="bg-gray-900 text-green-400 text-xs rounded-md p-3">
            pnpm -C apps/org dev -- -p 3302
          </pre>
        </div>

        <p className="text-center text-xs text-gray-400">
          amanahOS · Amanah Governance Platform
        </p>
      </div>
    </div>
  );
}
