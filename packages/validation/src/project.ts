// packages/validation/src/project.ts
// Amanah Governance Platform — Project validation schemas

import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(5, 'Project title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or less'),
  objective: z
    .string()
    .min(20, 'Objective must be at least 20 characters')
    .max(1000, 'Objective must be 1000 characters or less'),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .optional()
    .or(z.literal('')),
  locationText: z
    .string()
    .max(200)
    .optional()
    .or(z.literal('')),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  budgetAmount: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null))
    .pipe(z.number().positive('Budget must be a positive number').nullable()),
  beneficiarySummary: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
