// apps/org/lib/onboarding-state.ts
// Sprint 21 — Onboarding Wizard state checker
//
// Checks REAL database state for each of the 7 wizard steps.
// Called from the wizard page and the dashboard widget.
// No manual checklist — state is derived from actual data.

import { SupabaseClient } from '@supabase/supabase-js';

export interface OnboardingStep {
  id:          string;
  number:      number;
  title:       string;
  description: string;
  done:        boolean;
  emoji:       string;
  cta:         string;
  ctaHref:     string;
  trustEvent?: string;
  trustPts?:   number;
  doneLabel?:  string;
}

export interface OnboardingState {
  orgId:           string;
  orgName:         string;
  steps:           OnboardingStep[];
  completedCount:  number;
  totalSteps:      number;
  pct:             number;
  isComplete:      boolean;
  currentStep:     OnboardingStep | null; // first incomplete
}

export async function getOnboardingState(
  service: SupabaseClient,
  orgId:   string,
): Promise<OnboardingState> {

  // Load everything in parallel
  const [
    orgResult,
    bankResult,
    accountsResult,
    journalResult,
    membersResult,
    policyEventResult,
  ] = await Promise.all([
    service.from('organizations')
      .select('id, name, registration_no, address_text, contact_email, contact_phone, listing_status, onboarding_status, fund_types')
      .eq('id', orgId).single(),

    service.from('bank_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true),

    service.from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('is_active', true)
      .not('account_code', 'in', '(1000,2000,3000,4000,4100,4200,5000,5100,5200,5300,5400)'),

    service.from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    service.from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'active'),

    service.from('trust_events')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('event_type', 'gov_policy_uploaded'),
  ]);

  const org          = orgResult.data;
  const bankCount    = bankResult.count    ?? 0;
  const accountCount = accountsResult.count ?? 0;
  const journalCount = journalResult.count  ?? 0;
  const memberCount  = membersResult.count  ?? 0;
  const policyCount  = policyEventResult.count ?? 0;

  // Step 1 — Profile: name + registration_no + address + contact
  const profileDone = !!(
    org?.name &&
    org?.registration_no &&
    org?.address_text &&
    (org?.contact_email || org?.contact_phone)
  );

  // Step 2 — Bank account linked
  const bankDone = bankCount > 0;

  // Step 3 — Chart of accounts: at least 20 transactional accounts
  const accountsDone = accountCount >= 20;

  // Step 4 — First transaction recorded
  const transactionDone = journalCount > 0;

  // Step 5 — Team: at least 2 active members (enables SoD)
  const teamDone = memberCount >= 2;

  // Step 6 — Policy uploaded (trust event exists)
  const policyDone = policyCount > 0;

  // Step 7 — Public profile: listed or at least approved
  const publicDone = org?.listing_status === 'listed' ||
                     org?.onboarding_status === 'approved';

  const steps: OnboardingStep[] = [
    {
      id:          'profile',
      number:      1,
      title:       'Complete organisation profile',
      description: 'Add your registration number, address, and contact information. This is the foundation of your CTCF Layer 1 gate.',
      done:        profileDone,
      emoji:       '🏢',
      cta:         'Complete profile',
      ctaHref:     `/org/${orgId}/profile`,
      trustEvent:  'org_profile_complete',
      trustPts:    10,
      doneLabel:   'Profile complete',
    },
    {
      id:          'bank',
      number:      2,
      title:       'Link a bank account',
      description: 'Add at least one bank or cash account. This enables fund segregation and reconciliation — your first Financial Integrity trust event.',
      done:        bankDone,
      emoji:       '🏦',
      cta:         'Add bank account',
      ctaHref:     `/org/${orgId}/accounting/bank-accounts`,
      trustEvent:  'fi_bank_account_linked',
      trustPts:    5,
      doneLabel:   `${bankCount} account${bankCount !== 1 ? 's' : ''} linked`,
    },
    {
      id:          'accounts',
      number:      3,
      title:       'Set up chart of accounts',
      description: 'Your Islamic nonprofit chart of accounts (50+ accounts) enables proper fund accounting, income/expense tracking, and CTCF Layer 2 reporting.',
      done:        accountsDone,
      emoji:       '≡',
      cta:         'View chart of accounts',
      ctaHref:     `/org/${orgId}/accounting/chart-of-accounts`,
      trustEvent:  'fi_fund_segregated',
      trustPts:    5,
      doneLabel:   `${accountCount} accounts active`,
    },
    {
      id:          'transaction',
      number:      4,
      title:       'Record your first transaction',
      description: 'Enter any income or expense. This starts your live ledger and makes your accounting real.',
      done:        transactionDone,
      emoji:       '⇄',
      cta:         'Record a transaction',
      ctaHref:     `/org/${orgId}/accounting/transactions/new`,
      trustEvent:  'fi_expense_with_receipt',
      trustPts:    3,
      doneLabel:   `${journalCount} transaction${journalCount !== 1 ? 's' : ''} recorded`,
    },
    {
      id:          'team',
      number:      5,
      title:       'Invite a team member',
      description: 'Add a second person (treasurer, finance officer). Segregation of duties requires at least 2 people — the creator and the approver must be different.',
      done:        teamDone,
      emoji:       '♟',
      cta:         'Invite team member',
      ctaHref:     `/org/${orgId}/members`,
      trustEvent:  'gov_role_segregation_verified',
      trustPts:    7,
      doneLabel:   `${memberCount} member${memberCount !== 1 ? 's' : ''} in team`,
    },
    {
      id:          'policy',
      number:      6,
      title:       'Upload a governance policy',
      description: 'Upload at least one policy document (Financial Control, Procurement, or Conflict of Interest). Auditors always ask for these — +15 Governance trust event.',
      done:        policyDone,
      emoji:       '⊞',
      cta:         'Upload a policy',
      ctaHref:     `/org/${orgId}/policy-kit`,
      trustEvent:  'gov_policy_uploaded',
      trustPts:    15,
      doneLabel:   'Policy uploaded',
    },
    {
      id:          'public',
      number:      7,
      title:       'Enable public profile',
      description: 'Once your onboarding is approved, your organisation will appear on AmanahHub — visible to donors with your trust score and certification status.',
      done:        publicDone,
      emoji:       '◎',
      cta:         'Submit for approval',
      ctaHref:     `/org/${orgId}/profile`,
      trustEvent:  'trn_financial_published',
      trustPts:    12,
      doneLabel:   org?.listing_status === 'listed' ? 'Listed publicly' : 'Approved',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps     = steps.length;
  const pct            = Math.round((completedCount / totalSteps) * 100);
  const isComplete     = completedCount === totalSteps;
  const currentStep    = steps.find((s) => !s.done) ?? null;

  return {
    orgId,
    orgName:  org?.name ?? '',
    steps,
    completedCount,
    totalSteps,
    pct,
    isComplete,
    currentStep,
  };
}
