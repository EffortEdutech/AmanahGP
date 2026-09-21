import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { statusBadgeClass, titleCase } from "@/lib/console/mappers";

export const AUTHORITY_VIEW_SCREENS = [
  { code: "AV-01", title: "Authority Dashboard", href: "/authority" },
  { code: "AV-02", title: "Organisation Registry", href: "/authority/organisations" },
  { code: "AV-03", title: "Organisation Oversight Profile", href: "/authority/organisations" },
  { code: "AV-04", title: "Submission Monitor", href: "/authority/submissions" },
  { code: "AV-05", title: "Obligation Monitor", href: "/authority/obligations" },
  { code: "AV-06", title: "Exception Centre", href: "/authority/exceptions" },
  { code: "AV-07", title: "Governance Review Case Workspace", href: "/authority/cases" },
  { code: "AV-08", title: "Evidence Viewer", href: "/authority/evidence" },
  { code: "AV-09", title: "Corrective Action Tracker", href: "/authority/actions" },
  { code: "AV-10", title: "Reports / Exports", href: "/authority/reports" },
  { code: "AV-11", title: "Policy & Jurisdiction", href: "/authority/policy" },
  { code: "AV-12", title: "Activity / Audit", href: "/authority/activity" },
] as const;

export function AuthorityScreenGrid({ current }: { current: string }) {
  return (
    <section className="panel section stack">
      <div className="row-between">
        <div>
          <div className="h2">Authority View screens</div>
          <div className="muted">MAIN/JAIN oversight surfaces inside AGP Console.</div>
        </div>
        <span className="badge badge-neutral">12 screens</span>
      </div>
      <div className="grid-cards">
        {AUTHORITY_VIEW_SCREENS.map((screen) => (
          <Link key={screen.code} href={screen.href} className="panel-soft stack" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="row-between">
              <span className={current === screen.code ? "badge" : "badge badge-neutral"}>{screen.code}</span>
              <ArrowRight size={15} />
            </div>
            <div style={{ fontWeight: 800 }}>{screen.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EmptyAuthorityState({ label }: { label: string }) {
  return <div className="muted">No {label} in the current authority scope.</div>;
}

export function AuthorityBadge({ value }: { value: string | null | undefined }) {
  return <span className={statusBadgeClass(value)}>{titleCase(value)}</span>;
}
