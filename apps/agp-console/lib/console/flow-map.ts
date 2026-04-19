export type ConsoleFlowEntry = {
  label: string;
  href: string;
  note: string;
};

export type ConsoleFlowSection = {
  title: string;
  description: string;
  entries: ConsoleFlowEntry[];
};

export const CONSOLE_FLOW_SECTIONS: ConsoleFlowSection[] = [
  {
    title: "1. Platform control plane",
    description: "Start here for platform administration, organisation governance, billing control, and access governance.",
    entries: [
      {
        label: "Dashboard",
        href: "/dashboard",
        note: "Main control-plane landing page. From here you can jump to the flow map, review workbench, and publication command.",
      },
      {
        label: "Organisations",
        href: "/organisations",
        note: "Use the Open button in each row to reach organisation detail, then Members, Apps, and Billing.",
      },
      {
        label: "Plans & Billing",
        href: "/plans",
        note: "Reusable platform plan catalog and billing reference for organisation subscriptions.",
      },
      {
        label: "Roles & Access",
        href: "/roles",
        note: "Platform role assignment, access governance, and reviewer/scholar/approver control.",
      },
    ],
  },
  {
    title: "2. Governance intake and case routing",
    description: "This is where AmanahOS and platform actions become review work inside AGP Console.",
    entries: [
      {
        label: "Trust Events",
        href: "/events",
        note: "Incoming governance signals. From here open a governance case when review is required.",
      },
      {
        label: "Governance Cases",
        href: "/cases",
        note: "Master case register. Each case row should lead to detail, assignments, dossier, and organisation pages.",
      },
      {
        label: "Review Workbench",
        href: "/review-workbench",
        note: "Operational queue to triage active case work quickly.",
      },
      {
        label: "My Reviews",
        href: "/my-reviews",
        note: "Personal inbox for assigned reviewer, scholar, and approver tasks.",
      },
    ],
  },
  {
    title: "3. Review, clarification, scholar, and decision workspaces",
    description: "These pages drive the actual governance review journey from evidence to final decision.",
    entries: [
      {
        label: "Clarifications",
        href: "/clarifications",
        note: "Review organisation responses, clarification requests, and additional evidence submissions.",
      },
      {
        label: "Scholar Approval",
        href: "/scholar-approval",
        note: "Used for scholarly routing, recommendation, and approval readiness before final outcome.",
      },
      {
        label: "Case detail",
        href: "/cases",
        note: "Open a case row first, then use case-level links for assignments, recommendations, decision, remediation, and dossier.",
      },
      {
        label: "Assignments board",
        href: "/cases",
        note: "Reached from case actions to assign reviewer, scholar, or approver.",
      },
      {
        label: "Recommendation workspace",
        href: "/my-reviews",
        note: "Reached from My Reviews or case actions for reviewer and scholar recommendations.",
      },
      {
        label: "Decision workspace",
        href: "/my-reviews",
        note: "Reached from My Reviews or case actions for final approver decision.",
      },
      {
        label: "Case dossier",
        href: "/review-workbench",
        note: "Reached from Review Workbench or case actions to open the full review pack.",
      },
    ],
  },
  {
    title: "4. Publication and donor trust output",
    description: "After approval, Console controls what becomes donor-visible trust information.",
    entries: [
      {
        label: "Publication Command",
        href: "/publication-command",
        note: "Final publish / unpublish control for donor-facing trust release.",
      },
      {
        label: "Trust Snapshots",
        href: "/trust-snapshots",
        note: "Generated trust summary records ready for publication control.",
      },
      {
        label: "Publication Readiness",
        href: "/publication-readiness",
        note: "Checks whether an organisation is safe and ready for public release.",
      },
      {
        label: "Public Trust Profiles",
        href: "/public-trust-profiles",
        note: "Preview the trust profile output that donor-facing surfaces will consume.",
      },
      {
        label: "Trust Events Ledger",
        href: "/trust-events",
        note: "Outbound event ledger showing what Console emitted to the broader trust layer.",
      },
    ],
  },
  {
    title: "5. Oversight, assurance, and launch readiness",
    description: "These pages help govern quality, monitoring, auditability, and safe release of the console itself.",
    entries: [
      {
        label: "Compliance Center",
        href: "/compliance",
        note: "Internal oversight dashboard for compliance and governance status.",
      },
      {
        label: "Audit Log",
        href: "/audit",
        note: "Canonical evidence trail of platform actions and review activity.",
      },
      {
        label: "Notifications",
        href: "/notifications",
        note: "Operational alerts for invites, billing, compliance, security, and queue signals.",
      },
      {
        label: "Production Readiness",
        href: "/production-readiness",
        note: "Final UAT checkpoint and route lock verification for AGP Console before deploy.",
      },
      {
        label: "Console Flow Map",
        href: "/flow-map",
        note: "Reference page explaining how the full mission workflow is reached through UI.",
      },
    ],
  },
];
