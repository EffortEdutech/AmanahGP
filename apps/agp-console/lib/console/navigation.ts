import {
  Bell,
  BookCheck,
  Building2,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  MessageSquareQuote,
  Radio,
  Rocket,
  ScrollText,
  Send,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export const CONSOLE_NAV_GROUPS = [
  {
    title: "Platform Control",
    description: "Core platform administration and organisation governance.",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/organisations", label: "Organisations", icon: Building2 },
      { href: "/plans", label: "Plans & Billing", icon: Wallet },
      { href: "/roles", label: "Roles & Access", icon: Users },
    ],
  },
  {
    title: "Governance Review Workflow",
    description: "From incoming signals to review, response, and scholarly approval.",
    items: [
      { href: "/events", label: "Trust Events", icon: Radio },
      { href: "/cases", label: "Governance Cases", icon: Gavel },
      { href: "/review-workbench", label: "Review Workbench", icon: ClipboardList },
      { href: "/my-reviews", label: "My Reviews", icon: ClipboardList },
      { href: "/clarifications", label: "Clarifications", icon: MessageSquareQuote },
      { href: "/approval-board", label: "Scholar Approval", icon: BookCheck },
    ],
  },
  {
    title: "Publication Workflow",
    description: "Final control before donor-facing trust output is released.",
    items: [{ href: "/publication-command", label: "Publication Command", icon: Send }],
  },
  {
    title: "Oversight & Ops",
    description: "Assurance, evidence, alerts, and launch readiness.",
    items: [
      { href: "/compliance", label: "Compliance Center", icon: ShieldCheck },
      { href: "/audit", label: "Audit Log", icon: ScrollText },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/production-readiness", label: "Production Readiness", icon: Rocket },
    ],
  },
] as const;

export const CONSOLE_NAV_ITEMS = CONSOLE_NAV_GROUPS.flatMap((group) => group.items);

export const CONSOLE_CRITICAL_FLOW = [
  { label: "Dashboard", href: "/dashboard", purpose: "Entry point for the AGP Console control plane." },
  { label: "Organisations", href: "/organisations", purpose: "Manage organisation lifecycle and workspace readiness." },
  { label: "Trust Events", href: "/events", purpose: "Receive governance-triggering signals from AmanahOS and platform actions." },
  { label: "Governance Cases", href: "/cases", purpose: "Open, track, assign, and inspect governance review cases." },
  { label: "Review Workbench", href: "/review-workbench", purpose: "Operational queue for active review and triage." },
  { label: "My Reviews", href: "/my-reviews", purpose: "Personal inbox for reviewer, scholar, and approver tasks." },
  { label: "Clarifications", href: "/clarifications", purpose: "Review organisation responses and follow-up submissions." },
  { label: "Scholar Approval", href: "/approval-board", purpose: "Shariah and scholarly routing before final approval." },
  { label: "Publication Command", href: "/publication-command", purpose: "Final release control for donor-facing trust information." },
  { label: "Compliance Center", href: "/compliance", purpose: "Oversight status, readiness, and compliance signal monitoring." },
  { label: "Audit Log", href: "/audit", purpose: "Evidence trail for platform actions and governance decisions." },
  { label: "Notifications", href: "/notifications", purpose: "Operational alerts that need attention." },
  { label: "Production Readiness", href: "/production-readiness", purpose: "Final UAT and launch-readiness verification page." },
] as const;

export const CONSOLE_UAT_CHECKLIST = [
  "All major console pages are reachable from the left side nav without typing URLs.",
  "The left sidebar can collapse and expand without breaking layout.",
  "Organisation lifecycle pages load and save correctly.",
  "Trust event intake opens and can create review cases.",
  "Governance cases can be assigned, reviewed, escalated, and decided.",
  "Organisation clarifications can be reviewed and updated.",
  "Scholar Approval opens from side nav and routes to the approval board.",
  "Publication command center opens approved items for donor-facing publication.",
  "Audit, notification, and readiness pages load without runtime or hydration errors.",
  "All app routes run on canonical database references only.",
  "No duplicate organization / organisation entity tables are used anywhere in AGP Console.",
  "Local run on port 3303 passes smoke test before production deploy.",
] as const;
