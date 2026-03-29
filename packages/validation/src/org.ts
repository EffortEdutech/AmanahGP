// packages/validation/src/org.ts
// Amanah Governance Platform — Organization validation schemas (shared)

import { z } from 'zod';

// ── Malaysia classification options ───────────────────────────
export const ORG_TYPE_OPTIONS = [
  { value: 'ngo',              label: 'NGO / Welfare Association' },
  { value: 'mosque_surau',     label: 'Mosque / Surau' },
  { value: 'waqf_institution', label: 'Waqf Institution' },
  { value: 'zakat_body',       label: 'Zakat Body' },
  { value: 'foundation',       label: 'Foundation (Yayasan)' },
  { value: 'cooperative',      label: 'Cooperative' },
  { value: 'other',            label: 'Other' },
] as const;

export const OVERSIGHT_AUTHORITY_OPTIONS = [
  { value: 'SIRC',          label: 'State Islamic Religious Council (SIRC/MAIN)' },
  { value: 'ROS',           label: 'Registrar of Societies (ROS)' },
  { value: 'SSM',           label: 'Companies Commission of Malaysia (SSM)' },
  { value: 'MOE',           label: 'Ministry of Education (MOE)' },
  { value: 'JKM',           label: 'Department of Social Welfare (JKM)' },
  { value: 'trustees',      label: 'Board of Trustees (Private)' },
  { value: 'unregistered',  label: 'Not yet registered' },
  { value: 'other',         label: 'Other' },
] as const;

export const FUND_TYPE_OPTIONS = [
  { value: 'sadaqah', label: 'Sadaqah (General Charity)' },
  { value: 'zakat',   label: 'Zakat (Obligatory Alms)' },
  { value: 'waqf',    label: 'Waqf (Endowment)' },
  { value: 'infaq',   label: 'Infaq (Voluntary Spending)' },
] as const;

export const MALAYSIA_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu',
  'Kuala Lumpur', 'Labuan', 'Putrajaya',
] as const;

// ── Schema: create org (step 1 — basic profile) ───────────────
export const createOrgSchema = z.object({
  name: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(200, 'Name must be 200 characters or less'),
  legalName: z
    .string()
    .max(200)
    .optional()
    .or(z.literal('')),
  registrationNo: z
    .string()
    .max(80)
    .optional()
    .or(z.literal('')),
  websiteUrl: z
    .string()
    .url('Please enter a valid URL (include https://)')
    .optional()
    .or(z.literal('')),
  contactEmail: z
    .string()
    .email('Please enter a valid contact email')
    .optional()
    .or(z.literal('')),
  contactPhone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal('')),
  addressText: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
  state: z
    .enum(MALAYSIA_STATES, { errorMap: () => ({ message: 'Please select a state' }) })
    .optional(),
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(1000, 'Summary must be 1000 characters or less'),
});

// ── Schema: Malaysia classification (step 2) ──────────────────
export const classifyOrgSchema = z.object({
  orgType: z.enum(
    ['ngo','mosque_surau','waqf_institution','zakat_body','foundation','cooperative','other'],
    { errorMap: () => ({ message: 'Please select an organization type' }) }
  ),
  oversightAuthority: z.string().min(1, 'Please select an oversight authority'),
  fundTypes: z
    .array(z.enum(['sadaqah','zakat','waqf','infaq']))
    .min(1, 'Please select at least one fund type'),
});

// ── Schema: update org profile ────────────────────────────────
export const updateOrgSchema = createOrgSchema.partial().merge(
  classifyOrgSchema.partial()
);

// ── Schema: invite member ─────────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  orgRole: z.enum(
    ['org_admin', 'org_manager', 'org_viewer'],
    { errorMap: () => ({ message: 'Please select a role' }) }
  ),
});

export type CreateOrgInput    = z.infer<typeof createOrgSchema>;
export type ClassifyOrgInput  = z.infer<typeof classifyOrgSchema>;
export type UpdateOrgInput    = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
