import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

const reasonMessages: Record<string, string> = {
  no_console_role:
    "Your login is valid, but this user does not have an active AGP Console role yet. Ask a super admin to assign platform_admin, platform_reviewer, platform_scholar, platform_auditor, platform_approver, or set public.users.platform_role to super_admin/admin.",
  forbidden:
    "Your account has an AGP Console role, but it does not include permission for the page you tried to open.",
};

export default async function NoConsoleAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = reasonMessages[reason ?? ""] ?? "This account is not allowed to open AGP Console.";

  return (
    <div className="page-shell">
      <div className="panel auth-card stack">
        <div>
          <div className="kicker">AGP Console</div>
          <h1 className="h1">Console access not available</h1>
          <p className="muted">{message}</p>
        </div>

        <div className="notice notice-warning">
          This page prevents the previous redirect loop and lets you safely sign out or return to dashboard after fixing the role.
        </div>

        <div className="stack">
          <Link className="btn btn-secondary" href="/dashboard">
            Try dashboard again
          </Link>

          <form action={logoutAction}>
            <button className="btn btn-primary" type="submit">
              Sign out and use another account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
