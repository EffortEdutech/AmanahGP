import { loginAction } from "@/app/login/actions";

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

        <form action={loginAction} className="stack">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required />
          </div>

          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
