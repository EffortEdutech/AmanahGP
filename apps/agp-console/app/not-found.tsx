import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="panel auth-card stack" style={{ maxWidth: 440, width: "100%" }}>
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
          <div className="h2">Page not found</div>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>This console page does not exist. Use the navigation to find what you need.</p>
        </div>
        <Link className="btn btn-secondary" href="/dashboard">Back to dashboard</Link>
      </div>
    </div>
  );
}
