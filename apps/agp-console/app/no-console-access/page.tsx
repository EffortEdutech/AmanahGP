import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const reasons: Record<string, { title: string; message: string }> = {
  no_console_role: {
    title: "No console role assigned",
    message:
      "Your account is authenticated but does not have a Console role. Contact a super admin to assign one: reviewer, scholar, approver, auditor, or admin.",
  },
  forbidden: {
    title: "Page not permitted",
    message:
      "Your Console role does not include access to the page you requested. Contact your admin if you believe this is incorrect.",
  },
};

export default async function NoConsoleAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const content = reasons[reason ?? ""] ?? {
    title: "Access not available",
    message: "This account does not have permission to open the AGP Console.",
  };

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
          <h1 className="h1" style={{ fontSize: 22 }}>{content.title}</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>{content.message}</p>
        </div>

        <div className="stack">
          <Link className="btn btn-secondary" href="/dashboard">
            Try dashboard
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
