// packages/validation/src/report.ts
// Amanah Governance Platform — Report + Financial + Reviewer validation schemas

import { z } from 'zod';

// ── Project report ────────────────────────────────────────────
export const createReportSchema = z.object({
  title: z
    .string()
    .min(5, 'Report title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or less'),
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  // report_body fields — stored as JSONB
  narrative: z
    .string()
    .min(20, 'Narrative must be at least 20 characters')
    .max(10000),
  beneficiariesReached: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : null))
    .pipe(z.number().int().nonnegative().nullable()),
  spendToDate: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(z.number().nonnegative().nullable()),
  milestonesCompleted: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('')),
  nextSteps: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('')),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ── Financial snapshot ────────────────────────────────────────
export const financialSnapshotSchema = z.object({
  periodYear: z
    .string()
    .regex(/^\d{4}$/, 'Must be a 4-digit year')
    .transform(Number)
    .pipe(
      z.number()
        .min(2000, 'Year must be 2000 or later')
        .max(new Date().getFullYear(), 'Year cannot be in the future')
    ),
  totalIncome: z
    .string()
    .min(1, 'Total income is required')
    .transform(Number)
    .pipe(z.number().nonnegative('Must be zero or positive')),
  totalExpenditure: z
    .string()
    .min(1, 'Total expenditure is required')
    .transform(Number)
    .pipe(z.number().nonnegative()),
  programExpenditure: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(z.number().nonnegative().nullable()),
  adminExpenditure: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(z.number().nonnegative().nullable()),
  auditCompleted: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  auditorName: z
    .string()
    .max(200)
    .optional()
    .or(z.literal('')),
  waqfAssetsValue: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(z.number().nonnegative().nullable()),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal('')),
});

export type FinancialSnapshotInput = z.infer<typeof financialSnapshotSchema>;

// ── Reviewer decision ─────────────────────────────────────────
export const reviewerDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested'], {
    errorMap: () => ({ message: 'Please select a decision' }),
  }),
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .optional()
    .or(z.literal('')),
});

export type ReviewerDecisionInput = z.infer<typeof reviewerDecisionSchema>;

// ── Evidence confirm ──────────────────────────────────────────
export const evidenceConfirmSchema = z.object({
  fileName:   z.string().min(1),
  mimeType:   z.string().min(1),
  storagePath: z.string().min(1),
  fileSizeBytes: z.number().int().positive().optional(),
  capturedAt:  z.string().optional(),
  geoLat:      z.number().min(-90).max(90).optional(),
  geoLng:      z.number().min(-180).max(180).optional(),
  visibility:  z.enum(['private', 'reviewer_only', 'public']).default('private'),
});

export type EvidenceConfirmInput = z.infer<typeof evidenceConfirmSchema>;
