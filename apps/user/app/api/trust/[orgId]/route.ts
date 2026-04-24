import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canShowTrustScore, type PublicTrustProfile } from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from('v_amanahhub_public_trust_profiles_live_score')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('v_amanahhub_public_trust_events')
      .select('*')
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
  }

  const org = profile as PublicTrustProfile;
  const trustGrade = canShowTrustScore(org) ? getTrustGrade(org.trust_score ?? 0) : null;

  return NextResponse.json({
    organization: {
      id: org.organization_id,
      slug: org.slug,
      name: org.name,
      displayName: org.display_name,
      legalName: org.legal_name,
      registrationNo: org.registration_no,
      orgType: org.org_type,
      websiteUrl: org.website_url,
      contactEmail: org.contact_email,
      contactPhone: org.contact_phone,
      countryCode: org.country_code,
      state: org.state,
      city: org.city,
      address: org.address,
      listingStatus: org.listing_status,
      onboardingStatus: org.onboarding_status,
      complianceStatus: org.compliance_status,
      verificationStatus: org.verification_status,
      governanceStageKey: org.governance_stage_key,
      governanceStageLabel: org.governance_stage_label,
      governanceStageDescription: org.governance_stage_description,
      hasPublishedSnapshot: org.has_published_snapshot,
    },
    trustSnapshot: {
      id: org.snapshot_id,
      status: org.snapshot_status,
      reviewStatus: org.review_status,
      trustScore: org.has_published_snapshot ? org.trust_score : null,
      trustTier: org.has_published_snapshot ? org.trust_tier : null,
      grade: trustGrade?.grade ?? null,
      gradeDescription: trustGrade?.description ?? null,
      summary: org.summary_public ?? org.summary ?? org.description ?? org.governance_stage_description,
      notesPublic: org.notes_public,
      pillarScores: org.pillar_scores,
      signalsPublic: org.signals_public,
      publishedAt: org.published_at,
      effectiveFrom: org.effective_from,
      effectiveTo: org.effective_to,
      lastReviewedAt: org.last_reviewed_at,
    },
    currentCase: org.current_case_id
      ? {
          id: org.current_case_id,
          code: org.current_case_code,
          type: org.current_case_type,
          status: org.current_case_status,
          priority: org.current_case_priority,
          openedAt: org.current_case_opened_at,
        }
      : null,
    publicEvents: events ?? [],
  });
}



