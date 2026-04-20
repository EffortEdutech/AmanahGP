import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="page-shell">
      <div className="panel auth-card stack">
        <div>
          <div className="kicker">AGP Console</div>
          <h1 className="h1">Platform login</h1>
          <p className="muted">
            Sign in with your platform account. Only users with active Console roles can access this app.
          </p>
        </div>

        {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

        <LoginForm />
      </div>
    </div>
  );
}
