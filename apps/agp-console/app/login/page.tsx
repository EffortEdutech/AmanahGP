import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="panel auth-card stack" style={{ maxWidth: 440, width: "100%" }}>
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #047857, #065f46)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 2 }}>Amanah Governance Platform</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Console</div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
          <h1 className="h1" style={{ fontSize: 22 }}>Sign in</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            Access is restricted to assigned platform staff — reviewers, scholars, and administrators.
          </p>
        </div>

        {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

        <LoginForm />
      </div>
    </div>
  );
}
