// apps/user/lib/trust-grade.ts
// Extracted from the API route — Next.js route files cannot export
// non-HTTP-method functions. This utility is imported wherever needed.

export type TrustGrade = 'platinum' | 'gold' | 'silver' | 'building' | 'none';

export interface TrustGradeResult {
  grade:       TrustGrade;
  label:       string;
  sublabel:    string;
  color:       string;
}

export function getTrustGrade(score: number): TrustGradeResult {
  if (score >= 85) return { grade: 'platinum', label: 'Platinum', sublabel: 'Exceptional Amanah', color: '#64748b' };
  if (score >= 70) return { grade: 'gold',     label: 'Gold',     sublabel: 'Highly Trusted',    color: '#b45309' };
  if (score >= 55) return { grade: 'silver',   label: 'Silver',   sublabel: 'Trusted',            color: '#475569' };
  if (score >= 30) return { grade: 'building', label: 'Building', sublabel: 'Developing',          color: '#6b7280' };
  return              { grade: 'none',     label: 'New',      sublabel: 'Getting started',    color: '#9ca3af' };
}
