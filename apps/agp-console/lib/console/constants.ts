export const ORG_TYPE_OPTIONS = [
  { value: "ngo", label: "NGO" },
  { value: "mosque_surau", label: "Mosque / Surau" },
  { value: "waqf_institution", label: "Waqf Institution" },
  { value: "zakat_body", label: "Zakat Body" },
  { value: "foundation", label: "Foundation" },
  { value: "cooperative", label: "Cooperative" },
  { value: "other", label: "Other" },
] as const;

export const ONBOARDING_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export const LISTING_STATUS_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "listed", label: "Listed" },
  { value: "unlisted", label: "Unlisted" },
  { value: "suspended", label: "Suspended" },
] as const;

export const ORG_ROLE_OPTIONS = [
  { value: "org_admin", label: "Org Admin" },
  { value: "org_manager", label: "Org Manager" },
  { value: "org_viewer", label: "Org Viewer" },
] as const;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past Due" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const BILLING_CYCLE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const BILLING_RECORD_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
] as const;

export const PLATFORM_USER_ROLE_OPTIONS = [
  { value: "platform_owner", label: "Platform Owner" },
  { value: "platform_admin", label: "Platform Admin" },
  { value: "platform_auditor", label: "Platform Auditor" },
  { value: "platform_reviewer", label: "Reviewer" },
  { value: "platform_scholar", label: "Scholar" },
  { value: "platform_approver", label: "Approver" },
] as const;

export const GOVERNANCE_CASE_TYPE_OPTIONS = [
  { value: "governance_review", label: "Governance Review" },
  { value: "onboarding_review", label: "Onboarding Review" },
  { value: "periodic_review", label: "Periodic Review" },
  { value: "renewal_review", label: "Renewal Review" },
  { value: "corrective_review", label: "Corrective Review" },
] as const;

export const GOVERNANCE_CASE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "scholar_review", label: "Scholar Review" },
  { value: "approval_pending", label: "Approval Pending" },
  { value: "approved", label: "Approved" },
  { value: "improvement_required", label: "Improvement Required" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
] as const;

export const GOVERNANCE_CASE_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const GOVERNANCE_CASE_OUTCOME_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "conditional", label: "Approved with Conditions" },
  { value: "improvement_required", label: "Improvement Required" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
] as const;

export const GOVERNANCE_ASSIGNMENT_ROLE_OPTIONS = [
  { value: "reviewer", label: "Reviewer" },
  { value: "scholar", label: "Scholar" },
  { value: "approver", label: "Approver" },
] as const;

export const GOVERNANCE_ASSIGNMENT_STATUS_OPTIONS = [
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "removed", label: "Removed" },
] as const;

export const GOVERNANCE_FINDING_TYPE_OPTIONS = [
  { value: "governance", label: "Governance" },
  { value: "finance", label: "Finance" },
  { value: "shariah", label: "Shariah" },
  { value: "operations", label: "Operations" },
  { value: "documentation", label: "Documentation" },
  { value: "risk", label: "Risk" },
] as const;

export const GOVERNANCE_FINDING_SEVERITY_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
] as const;

export const GOVERNANCE_FINDING_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "resolved", label: "Resolved" },
  { value: "waived", label: "Waived" },
] as const;

export const GOVERNANCE_EVIDENCE_TYPE_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "document", label: "Document" },
  { value: "snapshot", label: "Snapshot" },
] as const;

export type ConsolePermission =
  | "organizations.read"
  | "organizations.write"
  | "members.read"
  | "members.write"
  | "apps.read"
  | "apps.write"
  | "billing.read"
  | "billing.write"
  | "roles.read"
  | "roles.write"
  | "audit.read"
  | "notifications.read"
  | "cases.read"
  | "cases.write";
