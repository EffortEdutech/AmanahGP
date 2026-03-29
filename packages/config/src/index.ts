// packages/config/src/index.ts
// Amanah Governance Platform — Shared config package

export * from './roles';

// ── App URLs ──────────────────────────────────────────────────
export const APP_URLS = {
  USER_APP:   process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200',
  ADMIN_APP:  'http://localhost:3201',
} as const;

// ── Branding ──────────────────────────────────────────────────
export const BRAND = {
  PLATFORM_NAME:   'Amanah Governance Platform',
  USER_APP_NAME:   'AmanahHub',
  ADMIN_APP_NAME:  'AmanahHub Console',
  TAGLINE:         'Trusted Giving. Transparent Governance.',
  FOOTER_LINE:     'AmanahHub is part of Amanah Governance Platform.',
} as const;

// ── Pagination defaults ───────────────────────────────────────
export const PAGINATION = {
  DEFAULT_LIMIT:  20,
  MAX_LIMIT:      100,
} as const;

// ── Score config ──────────────────────────────────────────────
export const SCORE_CONFIG = {
  AMANAH_MAX:           100,
  CTCF_CERT_THRESHOLD:  55,
  CTCF_LAYER2_MIN:      12,
  DEBOUNCE_WINDOW_SECS: 30,
} as const;
