// =============================================================
// packages/config/src/roles.ts
// Amanah Governance Platform — Role definitions (shared)
// Single source of truth for platform and org roles
//
// Access model v1:
// - super_admin: global owner / emergency access; may enter AmanahHub,
//   amanahOS, and AGP Console.
// - admin: internal platform staff; AGP Console only.
// - reviewer / scholar: specialist platform roles; AGP Console only.
// - donor: public donor role; AmanahHub donor flows.
// =============================================================

// ── Platform Roles ────────────────────────────────────────────
export const PLATFORM_ROLES = {
  DONOR:       'donor',
  ADMIN:       'admin',
  REVIEWER:    'reviewer',
  SCHOLAR:     'scholar',
  SUPER_ADMIN: 'super_admin',
} as const;

export type PlatformRole = typeof PLATFORM_ROLES[keyof typeof PLATFORM_ROLES];

// Explicitly type role groups as PlatformRole[] so TypeScript does not narrow
// `.includes()` to only the literal values in each array. This fixes Vercel
// build errors such as:
// "Argument of type 'PlatformRole' is not assignable to parameter of type
//  'admin' | 'reviewer' | 'scholar' | 'super_admin'".
const CONSOLE_PLATFORM_ROLES: readonly PlatformRole[] = [
  PLATFORM_ROLES.ADMIN,
  PLATFORM_ROLES.REVIEWER,
  PLATFORM_ROLES.SCHOLAR,
  PLATFORM_ROLES.SUPER_ADMIN,
];

const AMANAH_OS_BLOCKED_PLATFORM_ROLES: readonly PlatformRole[] = [
  PLATFORM_ROLES.ADMIN,
  PLATFORM_ROLES.REVIEWER,
  PLATFORM_ROLES.SCHOLAR,
];

// ── Org Roles ─────────────────────────────────────────────────
export const ORG_ROLES = {
  VIEWER:  'org_viewer',
  MANAGER: 'org_manager',
  ADMIN:   'org_admin',
} as const;

export type OrgRole = typeof ORG_ROLES[keyof typeof ORG_ROLES];

// ── Role hierarchy helpers ─────────────────────────────────────
const ORG_ROLE_RANK: Record<OrgRole, number> = {
  org_viewer:  1,
  org_manager: 2,
  org_admin:   3,
};

/**
 * Returns true if `actual` meets or exceeds `minimum` in the org role hierarchy.
 * e.g. orgRoleAtLeast('org_admin', 'org_manager') === true
 */
export function orgRoleAtLeast(actual: OrgRole, minimum: OrgRole): boolean {
  return ORG_ROLE_RANK[actual] >= ORG_ROLE_RANK[minimum];
}

// ── Platform role guards ───────────────────────────────────────
export function isPlatformRole(role: string, expected: PlatformRole): boolean {
  return role === expected;
}

export function isKnownPlatformRole(role: string | null | undefined): role is PlatformRole {
  if (!role) return false;
  return (Object.values(PLATFORM_ROLES) as readonly string[]).includes(role);
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === PLATFORM_ROLES.SUPER_ADMIN;
}

export function isInternalPlatformAdmin(role: string | null | undefined): boolean {
  return role === PLATFORM_ROLES.ADMIN || role === PLATFORM_ROLES.SUPER_ADMIN;
}

export function isConsolePlatformRole(role: string | null | undefined): boolean {
  return isKnownPlatformRole(role) && CONSOLE_PLATFORM_ROLES.includes(role);
}

export function isAmanahOsPlatformBlockedRole(role: string | null | undefined): boolean {
  // super_admin is intentionally NOT blocked: they may impersonate / act as any charity context.
  return isKnownPlatformRole(role) && AMANAH_OS_BLOCKED_PLATFORM_ROLES.includes(role);
}

export function isReviewerOrAbove(role: string): boolean {
  return role === PLATFORM_ROLES.REVIEWER || role === PLATFORM_ROLES.SUPER_ADMIN;
}

// ── Onboarding statuses ───────────────────────────────────────
export const ONBOARDING_STATUS = {
  DRAFT:              'draft',
  SUBMITTED:          'submitted',
  CHANGES_REQUESTED:  'changes_requested',
  APPROVED:           'approved',
  REJECTED:           'rejected',
} as const;

export type OnboardingStatus = typeof ONBOARDING_STATUS[keyof typeof ONBOARDING_STATUS];

// ── Listing statuses ──────────────────────────────────────────
export const LISTING_STATUS = {
  PRIVATE:    'private',
  LISTED:     'listed',
  UNLISTED:   'unlisted',
  SUSPENDED:  'suspended',
} as const;

export type ListingStatus = typeof LISTING_STATUS[keyof typeof LISTING_STATUS];

// ── Verification statuses ─────────────────────────────────────
export const VERIFICATION_STATUS = {
  PENDING:            'pending',
  CHANGES_REQUESTED:  'changes_requested',
  VERIFIED:           'verified',
  REJECTED:           'rejected',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

// ── Donation statuses ─────────────────────────────────────────
export const DONATION_STATUS = {
  INITIATED:  'initiated',
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  FAILED:     'failed',
  CANCELED:   'canceled',
} as const;

export type DonationStatus = typeof DONATION_STATUS[keyof typeof DONATION_STATUS];

// ── Trust event types ─────────────────────────────────────────
export const TRUST_EVENT_TYPES = {
  REPORT_VERIFIED:          'report_verified',
  FINANCIAL_SUBMITTED:      'financial_submitted',
  FINANCIAL_VERIFIED:       'financial_verified',
  CERTIFICATION_UPDATED:    'certification_updated',
  DONATION_CONFIRMED:       'donation_confirmed',
  COMPLAINT_LOGGED:         'complaint_logged',
  COMPLAINT_RESOLVED:       'complaint_resolved',
  REPORT_OVERDUE_FLAGGED:   'report_overdue_flagged',
  REPORT_OVERDUE_CLEARED:   'report_overdue_cleared',
  MANUAL_RECALC:            'manual_recalc',
} as const;

export type TrustEventType = typeof TRUST_EVENT_TYPES[keyof typeof TRUST_EVENT_TYPES];

// ── Certification statuses ────────────────────────────────────
export const CERTIFICATION_STATUS = {
  CERTIFIED:      'certified',
  NOT_CERTIFIED:  'not_certified',
  SUSPENDED:      'suspended',
} as const;

// ── Gateway names ─────────────────────────────────────────────
export const PAYMENT_GATEWAYS = {
  TOYYIBPAY: 'toyyibpay',
  BILLPLZ:   'billplz',
} as const;

export type PaymentGateway = typeof PAYMENT_GATEWAYS[keyof typeof PAYMENT_GATEWAYS];

// ── Score versions ────────────────────────────────────────────
export const AMANAH_SCORE_VERSION = 'amanah_v1' as const;
export const CTCF_CRITERIA_VERSION = 'ctcf_v1' as const;

// ── Audit actions ─────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  ORG_SUBMITTED:              'ORG_SUBMITTED',
  ORG_APPROVED:               'ORG_APPROVED',
  ORG_REJECTED:               'ORG_REJECTED',
  REPORT_SUBMITTED:           'REPORT_SUBMITTED',
  REPORT_VERIFIED:            'REPORT_VERIFIED',
  REPORT_REJECTED:            'REPORT_REJECTED',
  EVIDENCE_APPROVED_PUBLIC:   'EVIDENCE_APPROVED_PUBLIC',
  CERTIFICATION_SUBMITTED:    'CERTIFICATION_SUBMITTED',
  CERTIFICATION_APPROVED:     'CERTIFICATION_APPROVED',
  CERTIFICATION_REJECTED:     'CERTIFICATION_REJECTED',
  AMANAH_RECALCULATED:        'AMANAH_RECALCULATED',
  DONATION_INITIATED:         'DONATION_INITIATED',
  DONATION_CONFIRMED:         'DONATION_CONFIRMED',
  WEBHOOK_PROCESSED:          'WEBHOOK_PROCESSED',
  MANUAL_RECALC:              'MANUAL_RECALC',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
