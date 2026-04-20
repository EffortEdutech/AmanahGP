export type GovernanceJourneyStage =
  | 'published_trust_profile'
  | 'governance_review_in_progress'
  | 'public_organisation_profile'
  | 'onboarding_with_agp';

export interface PublicTrustProfile {
  organization_id: string;
  slug: string | null;
  name: string;
  display_name: string | null;
  legal_name: string | null;
  registration_no: string | null;
  org_type: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  country_code: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  summary: string | null;
  description: string | null;
  workspace_status: string | null;
  onboarding_status: string | null;
  listing_status: string | null;
  compliance_status: string | null;
  verification_status: string | null;
  oversight_authority: string | null;
  snapshot_id: string | null;
  snapshot_case_id: string | null;
  snapshot_status: string | null;
  review_status: string | null;
  trust_score: number | null;
  trust_tier: string | null;
  summary_public: string | null;
  notes_public: string | null;
  pillar_scores: Record<string, unknown> | null;
  signals_public: Record<string, unknown> | null;
  published_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  last_reviewed_at: string | null;
  current_case_id: string | null;
  current_case_code: string | null;
  current_case_type: string | null;
  current_case_status: string | null;
  current_case_priority: string | null;
  current_case_opened_at: string | null;
  governance_stage_key: GovernanceJourneyStage;
  governance_stage_label: string;
  governance_stage_description: string;
  governance_stage_sort: number;
  has_published_snapshot: boolean;
  has_active_governance_case: boolean;
  public_updated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PublicTrustEvent {
  id: string;
  organization_id: string;
  organization_name: string;
  case_id: string | null;
  case_code: string | null;
  event_type: string;
  event_category: string | null;
  event_source: string | null;
  event_status: string | null;
  event_title: string | null;
  event_summary: string | null;
  occurred_at: string | null;
  published_at: string | null;
  public_payload: Record<string, unknown> | null;
  created_at: string | null;
}

export const DIRECTORY_STAGE_META: Record<GovernanceJourneyStage, {
  label: string;
  description: string;
  accentClass: string;
}> = {
  published_trust_profile: {
    label: 'Published Trust Profile',
    description: 'Full donor-facing trust snapshot available.',
    accentClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  governance_review_in_progress: {
    label: 'Governance Review in Progress',
    description: 'Review and evidence assessment are underway.',
    accentClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  public_organisation_profile: {
    label: 'Public Organisation Profile',
    description: 'Basic public listing is available for donors.',
    accentClass: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  },
  onboarding_with_agp: {
    label: 'Onboarding & Governance Journey',
    description: 'Welcomed into AGP and building governance step by step.',
    accentClass: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  },
};

export function getDirectoryStageMeta(stage: string | null | undefined) {
  return DIRECTORY_STAGE_META[(stage ?? 'public_organisation_profile') as GovernanceJourneyStage]
    ?? DIRECTORY_STAGE_META.public_organisation_profile;
}

export function hasPublishedTrustSnapshot(profile: PublicTrustProfile) {
  return Boolean(profile.has_published_snapshot && profile.snapshot_status === 'published');
}

export function canShowTrustScore(profile: PublicTrustProfile) {
  return hasPublishedTrustSnapshot(profile) && typeof profile.trust_score === 'number' && profile.trust_score > 0;
}

export function getPublicProfileSummary(profile: PublicTrustProfile) {
  return profile.summary_public
    ?? profile.summary
    ?? profile.description
    ?? profile.governance_stage_description
    ?? null;
}

export function groupProfilesByStage(profiles: PublicTrustProfile[]) {
  const grouped: Record<GovernanceJourneyStage, PublicTrustProfile[]> = {
    published_trust_profile: [],
    governance_review_in_progress: [],
    public_organisation_profile: [],
    onboarding_with_agp: [],
  };

  profiles.forEach((profile) => {
    const stage = (profile.governance_stage_key ?? 'public_organisation_profile') as GovernanceJourneyStage;
    if (!grouped[stage]) grouped.public_organisation_profile.push(profile);
    else grouped[stage].push(profile);
  });

  return grouped;
}

export function orgTypeLabel(orgType: string | null | undefined) {
  const map: Record<string, string> = {
    ngo: 'NGO / Welfare',
    mosque_surau: 'Mosque / Surau',
    waqf_institution: 'Waqf Institution',
    zakat_body: 'Zakat Body',
    foundation: 'Foundation',
    cooperative: 'Cooperative',
    other: 'Other',
  };

  if (!orgType) return null;
  return map[orgType] ?? orgType;
}
