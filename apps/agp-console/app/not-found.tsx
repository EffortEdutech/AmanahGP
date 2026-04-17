import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="panel auth-card stack">
        <div className="h2">Page not found</div>
        <p className="muted">The requested console page does not exist.</p>
        <Link className="btn btn-secondary" href="/dashboard">Back to dashboard</Link>
      </div>
    </div>
  );
}
