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
  | "notifications.read";
