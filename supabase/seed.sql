-- =============================================================
-- Amanah Governance Platform — supabase/seed.sql
-- Purpose: Dev/staging seed data for local demos
-- Fixed:   All UUIDs now use valid hex chars only (0-9, a-f)
-- =============================================================

do $$
declare
  -- User IDs
  uid_super_admin   uuid := 'a0000001-0000-0000-0000-000000000001';
  uid_reviewer      uuid := 'a0000001-0000-0000-0000-000000000002';
  uid_scholar       uuid := 'a0000001-0000-0000-0000-000000000003';
  uid_org_admin     uuid := 'a0000001-0000-0000-0000-000000000004';
  uid_donor         uuid := 'a0000001-0000-0000-0000-000000000005';

  -- Org IDs
  org_draft_id      uuid := 'b0000001-0000-0000-0000-000000000001';
  org_submitted_id  uuid := 'b0000001-0000-0000-0000-000000000002';
  org_approved_id   uuid := 'b0000001-0000-0000-0000-000000000003';

  -- Project, report, evidence IDs
  project_id        uuid := 'c0000001-0000-0000-0000-000000000001';
  report_id         uuid := 'd0000001-0000-0000-0000-000000000001';
  evidence_id       uuid := 'e0000001-0000-0000-0000-000000000001';

  -- Financial snapshot
  fin_id            uuid := 'f0000001-0000-0000-0000-000000000001';

  -- Certification  (ch→cf, all valid hex)
  cert_app_id       uuid := 'ca000001-0000-0000-0000-000000000001';
  cert_eval_id      uuid := 'ce000001-0000-0000-0000-000000000001';
  cert_hist_id      uuid := 'cf000001-0000-0000-0000-000000000001';

  -- Trust + Amanah  (te→de, ah→ab, all valid hex)
  trust_event_id    uuid := 'de000001-0000-0000-0000-000000000001';
  trust_event2_id   uuid := 'de000001-0000-0000-0000-000000000002';
  amanah_hist_id    uuid := 'ab000001-0000-0000-0000-000000000001';

  -- Donations  (dt→d1, wh→b5, all valid hex)
  donation_init_id  uuid := 'd1000001-0000-0000-0000-000000000001';
  donation_conf_id  uuid := 'd1000001-0000-0000-0000-000000000002';
  webhook_id        uuid := 'b5000001-0000-0000-0000-000000000001';

begin

  -- ===========================================================
  -- 1. USERS
  -- ===========================================================
  insert into public.users
    (id, auth_provider_user_id, email, display_name, platform_role)
  values
    (uid_super_admin, 'seed-super-admin',  'superadmin@agp.test',  'Super Admin',    'super_admin'),
    (uid_reviewer,    'seed-reviewer',     'reviewer@agp.test',    'Nur Reviewer',   'reviewer'),
    (uid_scholar,     'seed-scholar',      'scholar@agp.test',     'Ustaz Scholar',  'scholar'),
    (uid_org_admin,   'seed-org-admin',    'orgadmin@agp.test',    'Siti Org Admin', 'donor'),
    (uid_donor,       'seed-donor',        'donor@agp.test',       'Ahmad Donor',    'donor')
  on conflict (id) do nothing;

  -- ===========================================================
  -- 2. ORGANIZATIONS
  -- ===========================================================

  -- Org A: draft
  insert into public.organizations
    (id, name, country, state, org_type, fund_types, summary, onboarding_status, listing_status)
  values
    (org_draft_id,
     'Persatuan Kebajikan Sejahtera',
     'MY', 'Selangor', 'ngo', array['sadaqah'],
     'A newly registered welfare association in Selangor. Onboarding in progress.',
     'draft', 'private')
  on conflict (id) do nothing;

  -- Org B: submitted
  insert into public.organizations
    (id, name, registration_no, country, state, org_type, oversight_authority,
     fund_types, summary, onboarding_status, listing_status, onboarding_submitted_at)
  values
    (org_submitted_id,
     'Yayasan Bakti Warga', 'PPM-001-12-12122024',
     'MY', 'Kuala Lumpur', 'foundation', 'ROS',
     array['sadaqah', 'waqf'],
     'A foundation focused on youth education and community empowerment in KL.',
     'submitted', 'private', now() - interval '3 days')
  on conflict (id) do nothing;

  -- Org C: approved + listed
  insert into public.organizations
    (id, name, legal_name, registration_no, website_url, country, state,
     org_type, oversight_authority, fund_types, summary,
     onboarding_status, listing_status, onboarding_submitted_at, approved_at,
     approved_by_user_id)
  values
    (org_approved_id,
     'Masjid Al-Amanah Waqf Trust',
     'Lembaga Wakaf Masjid Al-Amanah',
     'WF-0042-2024',
     'https://demo.amanahwaqf.org.my',
     'MY', 'Pulau Pinang',
     'waqf_institution', 'SIRC',
     array['waqf', 'sadaqah'],
     'A waqf trust managing educational and community assets in Penang since 2019.',
     'approved', 'listed',
     now() - interval '30 days', now() - interval '25 days',
     uid_reviewer)
  on conflict (id) do nothing;

  -- ===========================================================
  -- 3. ORG MEMBERS
  -- ===========================================================
  insert into public.org_members
    (organization_id, user_id, org_role, status, accepted_at)
  values
    (org_draft_id,     uid_org_admin, 'org_admin', 'active', now() - interval '10 days'),
    (org_submitted_id, uid_org_admin, 'org_admin', 'active', now() - interval '10 days'),
    (org_approved_id,  uid_org_admin, 'org_admin', 'active', now() - interval '30 days')
  on conflict (organization_id, user_id) do nothing;

  -- ===========================================================
  -- 4. PROJECT
  -- ===========================================================
  insert into public.projects
    (id, organization_id, title, objective, description,
     location_text, start_date, end_date, budget_amount, currency,
     beneficiary_summary, kpi_targets, status, is_public)
  values
    (project_id,
     org_approved_id,
     'Waqf Library Penang — Phase 1',
     'Establish a community waqf library providing free access to books and digital resources.',
     'A sustainable waqf asset project transforming an existing building into a knowledge hub.',
     'George Town, Pulau Pinang',
     '2025-01-01', '2025-12-31',
     120000.00, 'MYR',
     'Estimated 500 direct beneficiaries — students, families, and seniors in George Town.',
     '{"books_accessible": 2000, "digital_terminals": 10, "weekly_visitors_target": 100}',
     'active', true)
  on conflict (id) do nothing;

  -- ===========================================================
  -- 5. PROJECT REPORT (verified)
  -- ===========================================================
  insert into public.project_reports
    (id, organization_id, project_id, title,
     report_body, report_date,
     submission_status, verification_status,
     submitted_at, verified_at, verified_by_user_id)
  values
    (report_id,
     org_approved_id, project_id,
     'Q1 2025 Progress Report — Waqf Library Penang',
     '{
       "narrative": "Construction of reading rooms completed. 1,200 books catalogued. Digital terminals ordered.",
       "beneficiaries_reached": 180,
       "spend_to_date": 45000,
       "milestones_completed": ["foundation works", "reading room fit-out", "book cataloguing phase 1"],
       "next_steps": ["Install digital terminals", "Launch community orientation sessions"]
     }',
     '2025-04-01',
     'submitted', 'verified',
     now() - interval '15 days', now() - interval '10 days',
     uid_reviewer)
  on conflict (id) do nothing;

  -- ===========================================================
  -- 6. EVIDENCE FILE (public approved)
  -- ===========================================================
  insert into public.evidence_files
    (id, organization_id, project_report_id,
     file_name, mime_type, storage_bucket, storage_path,
     file_size_bytes, captured_at, geo_lat, geo_lng,
     visibility, is_approved_public, approved_by_user_id, approved_at)
  values
    (evidence_id,
     org_approved_id, report_id,
     'reading-room-q1-2025.jpg', 'image/jpeg',
     'evidence',
     'org/b0000001-0000-0000-0000-000000000003/reports/d0000001-0000-0000-0000-000000000001/reading-room-q1-2025.jpg',
     1240000, now() - interval '20 days',
     5.4141, 100.3288,
     'public', true, uid_reviewer, now() - interval '10 days')
  on conflict (id) do nothing;

  -- ===========================================================
  -- 7. FINANCIAL SNAPSHOT (verified)
  -- ===========================================================
  insert into public.financial_snapshots
    (id, organization_id, period_year, currency,
     inputs, submission_status, verification_status,
     submitted_at, verified_at, verified_by_user_id)
  values
    (fin_id,
     org_approved_id, 2024, 'MYR',
     '{
       "total_income": 250000,
       "total_expenditure": 198000,
       "program_expenditure": 162000,
       "admin_expenditure": 36000,
       "waqf_assets_value": 1200000,
       "audit_completed": true,
       "auditor_name": "Messrs. Amanah & Partners",
       "fund_breakdown": {"waqf": 180000, "sadaqah": 70000}
     }',
     'submitted', 'verified',
     now() - interval '20 days', now() - interval '15 days',
     uid_reviewer)
  on conflict (id) do nothing;

  -- ===========================================================
  -- 8. CERTIFICATION APPLICATION + EVALUATION + HISTORY
  -- ===========================================================
  insert into public.certification_applications
    (id, organization_id, status,
     submitted_at, submitted_by_user_id, reviewer_assigned_user_id)
  values
    (cert_app_id, org_approved_id, 'approved',
     now() - interval '25 days', uid_org_admin, uid_reviewer)
  on conflict (id) do nothing;

  insert into public.certification_evaluations
    (id, organization_id, certification_application_id,
     criteria_version, total_score, score_breakdown, computed_by_user_id)
  values
    (cert_eval_id, org_approved_id, cert_app_id,
     'ctcf_v1', 78.00,
     '{
       "layer1_gate":      {"passed": true,  "notes": "All governance docs verified"},
       "layer2_financial": {"score": 16, "max": 20, "notes": "Audit completed; program ratio 81.8%"},
       "layer3_project":   {"score": 20, "max": 25, "notes": "Geo-verified reports; before/after docs provided"},
       "layer4_impact":    {"score": 15, "max": 20, "notes": "KPIs defined; sustainability plan partially complete"},
       "layer5_shariah":   {"score": 10, "max": 15, "notes": "Named advisor confirmed; written policy present"},
       "grade": "Gold Amanah",
       "normalized_total": 78
     }',
     uid_reviewer)
  on conflict (id) do nothing;

  insert into public.certification_history
    (id, organization_id, certification_application_id, evaluation_id,
     previous_status, new_status, valid_from, valid_to,
     decided_by_user_id, decision_reason)
  values
    (cert_hist_id, org_approved_id, cert_app_id, cert_eval_id,
     null, 'certified',
     current_date - interval '20 days',
     current_date + interval '345 days',
     uid_reviewer,
     'All CTCF criteria met. Gold Amanah grade awarded.')
  on conflict (id) do nothing;

  -- ===========================================================
  -- 9. TRUST EVENTS
  -- ===========================================================
  insert into public.trust_events
    (id, organization_id, event_type, event_ref_table, event_ref_id,
     payload, occurred_at, actor_user_id, source, idempotency_key)
  values
    (trust_event_id,
     org_approved_id,
     'report_verified', 'project_reports', report_id,
     '{"report_title": "Q1 2025 Progress Report — Waqf Library Penang"}',
     now() - interval '10 days',
     uid_reviewer, 'reviewer',
     'report_verified_d0000001-0000-0000-0000-000000000001'),
    (trust_event2_id,
     org_approved_id,
     'certification_updated', 'certification_history', cert_hist_id,
     '{"new_status": "certified", "grade": "Gold Amanah", "score": 78}',
     now() - interval '8 days',
     uid_reviewer, 'reviewer',
     'cert_updated_cf000001-0000-0000-0000-000000000001')
  on conflict (organization_id, idempotency_key) do nothing;

  -- ===========================================================
  -- 10. AMANAH INDEX HISTORY
  -- ===========================================================
  insert into public.amanah_index_history
    (id, organization_id, score_version, score_value,
     computed_at, computed_from_event_id, breakdown, public_summary)
  values
    (amanah_hist_id,
     org_approved_id, 'amanah_v1', 74.50,
     now() - interval '8 days', trust_event2_id,
     '{
       "governance_score": 80,
       "financial_transparency_score": 75,
       "project_transparency_score": 78,
       "impact_efficiency_score": 65,
       "feedback_score": 70,
       "weights": {"governance": 0.30, "financial": 0.25, "project": 0.20, "impact": 0.15, "feedback": 0.10}
     }',
     'Certification updated to Gold Amanah. Q1 2025 verified report added.')
  on conflict (id) do nothing;

  -- ===========================================================
  -- 11. DONATIONS
  -- ===========================================================

  -- Initiated
  insert into public.donation_transactions
    (id, organization_id, project_id, donor_user_id, donor_email,
     amount, platform_fee_amount, currency,
     status, gateway, gateway_checkout_id, initiated_at)
  values
    (donation_init_id,
     org_approved_id, project_id, uid_donor, 'donor@agp.test',
     100.00, 2.00, 'MYR',
     'initiated', 'toyyibpay', 'TPY-CHECKOUT-SEED-001',
     now() - interval '2 hours')
  on conflict (id) do nothing;

  -- Confirmed
  insert into public.donation_transactions
    (id, organization_id, project_id, donor_user_id, donor_email,
     amount, platform_fee_amount, currency,
     status, gateway, gateway_checkout_id, gateway_transaction_id,
     initiated_at, confirmed_at)
  values
    (donation_conf_id,
     org_approved_id, project_id, uid_donor, 'donor@agp.test',
     50.00, 1.00, 'MYR',
     'confirmed', 'toyyibpay',
     'TPY-CHECKOUT-SEED-002', 'TPY-TXN-SEED-002',
     now() - interval '5 days',
     now() - interval '5 days' + interval '3 minutes')
  on conflict (id) do nothing;

  -- Webhook event
  insert into public.payment_webhook_events
    (id, gateway, event_id, donation_transaction_id,
     payload, signature_valid, processed, processed_at)
  values
    (webhook_id,
     'toyyibpay', 'TPY-EVENT-SEED-001', donation_conf_id,
     '{"billcode": "TPY-TXN-SEED-002", "status_id": "1", "amount": "50.00", "transaction_id": "TPY-TXN-SEED-002"}',
     true, true,
     now() - interval '5 days' + interval '2 minutes')
  on conflict (id) do nothing;

  -- Trust event for confirmed donation
  insert into public.trust_events
    (organization_id, event_type, event_ref_table, event_ref_id,
     payload, occurred_at, source, idempotency_key)
  values
    (org_approved_id,
     'donation_confirmed', 'donation_transactions', donation_conf_id,
     '{"amount": 50.00, "currency": "MYR", "gateway": "toyyibpay"}',
     now() - interval '5 days' + interval '3 minutes',
     'webhook',
     'donation_confirmed_d1000001-0000-0000-0000-000000000002')
  on conflict (organization_id, idempotency_key) do nothing;

  -- ===========================================================
  -- 12. AUDIT LOGS
  -- ===========================================================
  insert into public.audit_logs
    (actor_user_id, actor_role, organization_id,
     action, entity_table, entity_id, metadata)
  values
    (uid_reviewer, 'reviewer', org_approved_id,
     'REPORT_VERIFIED', 'project_reports', report_id,
     '{"verification_status": "verified", "previous_status": "pending"}'),
    (uid_reviewer, 'reviewer', org_approved_id,
     'CERTIFICATION_APPROVED', 'certification_history', cert_hist_id,
     '{"new_status": "certified", "grade": "Gold Amanah", "score": 78}'),
    (uid_reviewer, 'reviewer', org_approved_id,
     'ORG_APPROVED', 'organizations', org_approved_id,
     '{"onboarding_status": "approved", "listing_status": "listed"}');

end $$;
