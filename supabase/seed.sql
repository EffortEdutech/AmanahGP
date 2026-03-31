-- =============================================================
-- Amanah Governance Platform — supabase/seed.sql
-- Sprint 9: Rich multi-org seed data for platform evaluation
-- 5 orgs · 8 projects · 10 reports · 13 users · 8 donations
-- All UUIDs use valid hex chars only (0-9, a-f)
-- =============================================================

do $$
declare
  -- ── PLATFORM USERS ──────────────────────────────────────────
  uid_super     uuid := 'a0a00001-0000-0000-0000-000000000001';
  uid_rev1      uuid := 'a0a00001-0000-0000-0000-000000000002';  -- Nur Azreen (Reviewer)
  uid_rev2      uuid := 'a0a00001-0000-0000-0000-000000000003';  -- Hafiz Reviewer
  uid_scholar   uuid := 'a0a00001-0000-0000-0000-000000000004';  -- Ustaz Ahmad Fiqh

  -- ── ORG ADMINS / MANAGERS ────────────────────────────────────
  uid_o1_admin  uuid := 'a0a00001-0000-0000-0000-000000000005';  -- Siti (Org 1 admin)
  uid_o1_mgr    uuid := 'a0a00001-0000-0000-0000-000000000006';  -- Ahmad (Org 1 manager)
  uid_o2_admin  uuid := 'a0a00001-0000-0000-0000-000000000007';  -- Farid (Org 2 admin)
  uid_o3_admin  uuid := 'a0a00001-0000-0000-0000-000000000008';  -- Rosmah (Org 3 admin)
  uid_o4_admin  uuid := 'a0a00001-0000-0000-0000-000000000009';  -- Ahmad Mosque
  uid_o5_admin  uuid := 'a0a00001-0000-0000-0000-00000000000a';  -- Halimah (Org 5 admin)

  -- ── DONORS ───────────────────────────────────────────────────
  uid_donor1    uuid := 'a0a00001-0000-0000-0000-00000000000b';  -- Amirul Hakim
  uid_donor2    uuid := 'a0a00001-0000-0000-0000-00000000000c';  -- Suria Binti Azman
  uid_donor3    uuid := 'a0a00001-0000-0000-0000-00000000000d';  -- Zainab Mohamed

  -- ── ORGANIZATIONS ────────────────────────────────────────────
  -- Org 1: Waqf Institution — Platinum Amanah (approved + listed)
  org1          uuid := 'b0b00001-0000-0000-0000-000000000001';
  -- Org 2: Foundation      — Gold Amanah     (approved + listed)
  org2          uuid := 'b0b00001-0000-0000-0000-000000000002';
  -- Org 3: NGO/Welfare     — Silver Amanah   (approved + listed)
  org3          uuid := 'b0b00001-0000-0000-0000-000000000003';
  -- Org 4: Mosque/Surau    — Submitted (under review)
  org4          uuid := 'b0b00001-0000-0000-0000-000000000004';
  -- Org 5: NGO             — Draft (just started onboarding)
  org5          uuid := 'b0b00001-0000-0000-0000-000000000005';

  -- ── PROJECTS ─────────────────────────────────────────────────
  -- Org 1
  p1a           uuid := 'c0c00001-0000-0000-0000-000000000001'; -- Waqf Student Hostel Phase 2
  p1b           uuid := 'c0c00001-0000-0000-0000-000000000002'; -- Community Medical Clinic
  p1c           uuid := 'c0c00001-0000-0000-0000-000000000003'; -- Waqf Market Renovation (archived)
  -- Org 2
  p2a           uuid := 'c0c00001-0000-0000-0000-000000000004'; -- Education Scholarship Fund
  p2b           uuid := 'c0c00001-0000-0000-0000-000000000005'; -- Digital Learning Centre
  -- Org 3
  p3a           uuid := 'c0c00001-0000-0000-0000-000000000006'; -- B40 Food Aid Programme
  p3b           uuid := 'c0c00001-0000-0000-0000-000000000007'; -- Skills Training Initiative
  -- Org 4
  p4a           uuid := 'c0c00001-0000-0000-0000-000000000008'; -- Renovation Fund (draft)

  -- ── REPORTS ──────────────────────────────────────────────────
  r1a1          uuid := 'd0d00001-0000-0000-0000-000000000001'; -- Org1/p1a Q1 2025 (verified)
  r1a2          uuid := 'd0d00001-0000-0000-0000-000000000002'; -- Org1/p1a Q2 2025 (verified)
  r1a3          uuid := 'd0d00001-0000-0000-0000-000000000003'; -- Org1/p1a Q3 2025 (verified)
  r1a4          uuid := 'd0d00001-0000-0000-0000-000000000004'; -- Org1/p1a Q4 2025 (submitted/pending)
  r1b1          uuid := 'd0d00001-0000-0000-0000-000000000005'; -- Org1/p1b Progress (verified)
  r2a1          uuid := 'd0d00001-0000-0000-0000-000000000006'; -- Org2/p2a Annual 2024 (verified)
  r2a2          uuid := 'd0d00001-0000-0000-0000-000000000007'; -- Org2/p2a Q1 2025 (submitted)
  r2b1          uuid := 'd0d00001-0000-0000-0000-000000000008'; -- Org2/p2b Inception (verified)
  r3a1          uuid := 'd0d00001-0000-0000-0000-000000000009'; -- Org3/p3a Jan 2025 (verified)
  r3a2          uuid := 'd0d00001-0000-0000-0000-00000000000a'; -- Org3/p3a Feb 2025 (submitted)

  -- ── FINANCIALS ───────────────────────────────────────────────
  fin1          uuid := 'f0f00001-0000-0000-0000-000000000001'; -- Org1 2024
  fin2          uuid := 'f0f00001-0000-0000-0000-000000000002'; -- Org2 2024
  fin3          uuid := 'f0f00001-0000-0000-0000-000000000003'; -- Org3 2024

  -- ── CERTIFICATION ────────────────────────────────────────────
  ca1           uuid := 'a1a00001-0000-0000-0000-000000000001'; -- Org1 app (approved)
  ca2           uuid := 'a1a00001-0000-0000-0000-000000000002'; -- Org2 app (approved)
  ca3           uuid := 'a1a00001-0000-0000-0000-000000000003'; -- Org3 app (approved)
  ca4           uuid := 'a1a00001-0000-0000-0000-000000000004'; -- Org4 app (submitted)
  ce1           uuid := 'a2a00001-0000-0000-0000-000000000001'; -- Org1 eval
  ce2           uuid := 'a2a00001-0000-0000-0000-000000000002'; -- Org2 eval
  ce3           uuid := 'a2a00001-0000-0000-0000-000000000003'; -- Org3 eval
  ch1           uuid := 'a3a00001-0000-0000-0000-000000000001'; -- Org1 cert history
  ch2           uuid := 'a3a00001-0000-0000-0000-000000000002'; -- Org2 cert history
  ch3           uuid := 'a3a00001-0000-0000-0000-000000000003'; -- Org3 cert history

  -- ── TRUST EVENTS ─────────────────────────────────────────────
  te1           uuid := 'a4a00001-0000-0000-0000-000000000001';
  te2           uuid := 'a4a00001-0000-0000-0000-000000000002';
  te3           uuid := 'a4a00001-0000-0000-0000-000000000003';
  te4           uuid := 'a4a00001-0000-0000-0000-000000000004';
  te5           uuid := 'a4a00001-0000-0000-0000-000000000005';
  te6           uuid := 'a4a00001-0000-0000-0000-000000000006';

  -- ── AMANAH HISTORY ───────────────────────────────────────────
  ah1           uuid := 'a5a00001-0000-0000-0000-000000000001'; -- Org1 86.0 (current)
  ah2           uuid := 'a5a00001-0000-0000-0000-000000000002'; -- Org1 82.5
  ah3           uuid := 'a5a00001-0000-0000-0000-000000000003'; -- Org1 74.5
  ah4           uuid := 'a5a00001-0000-0000-0000-000000000004'; -- Org2 74.5 (current)
  ah5           uuid := 'a5a00001-0000-0000-0000-000000000005'; -- Org2 68.0
  ah6           uuid := 'a5a00001-0000-0000-0000-000000000006'; -- Org3 61.0 (current)

  -- ── DONATIONS ────────────────────────────────────────────────
  don1          uuid := 'da000001-0000-0000-0000-000000000001';
  don2          uuid := 'da000001-0000-0000-0000-000000000002';
  don3          uuid := 'da000001-0000-0000-0000-000000000003';
  don4          uuid := 'da000001-0000-0000-0000-000000000004';
  don5          uuid := 'da000001-0000-0000-0000-000000000005';
  don6          uuid := 'da000001-0000-0000-0000-000000000006';
  don7          uuid := 'da000001-0000-0000-0000-000000000007';
  don8          uuid := 'da000001-0000-0000-0000-000000000008';

  -- ── WEBHOOKS ─────────────────────────────────────────────────
  wh1           uuid := 'b5b00001-0000-0000-0000-000000000001';
  wh2           uuid := 'b5b00001-0000-0000-0000-000000000002';
  wh3           uuid := 'b5b00001-0000-0000-0000-000000000003';

  -- ── SCHOLAR NOTES ────────────────────────────────────────────
  sn1           uuid := 'a6a00001-0000-0000-0000-000000000001';
  sn2           uuid := 'a6a00001-0000-0000-0000-000000000002';

begin

-- ================================================================
-- 1. USERS
-- ================================================================
insert into public.users
  (id, auth_provider_user_id, email, display_name, platform_role, is_active)
values
  (uid_super,   'seed-super-admin',  'superadmin@agp.test',       'Platform Admin',      'super_admin', true),
  (uid_rev1,    'seed-reviewer-1',   'nurreviewer@agp.test',      'Nur Azreen',          'reviewer',    true),
  (uid_rev2,    'seed-reviewer-2',   'hafizreviewer@agp.test',    'Hafiz Reviewer',      'reviewer',    true),
  (uid_scholar, 'seed-scholar',      'scholar@agp.test',          'Ustaz Ahmad Fiqh',   'scholar',     true),
  (uid_o1_admin,'seed-org1-admin',   'siti@wakafar.org.my',       'Siti Org Admin',      'donor',       true),
  (uid_o1_mgr,  'seed-org1-mgr',     'ahmad@wakafar.org.my',      'Ahmad Manager',       'donor',       true),
  (uid_o2_admin,'seed-org2-admin',   'farid@alfalah.org.my',      'Farid Foundation',    'donor',       true),
  (uid_o3_admin,'seed-org3-admin',   'rosmah@sejahtera.org.my',   'Rosmah NGO Admin',   'donor',       true),
  (uid_o4_admin,'seed-org4-admin',   'ahmad.masjid@sultan.org.my','Ahmad Mosque Admin', 'donor',       true),
  (uid_o5_admin,'seed-org5-admin',   'halimah@draft.org.my',      'Halimah Admin',       'donor',       true),
  (uid_donor1,  'seed-donor-1',      'amirul@email.com',          'Amirul Hakim',        'donor',       true),
  (uid_donor2,  'seed-donor-2',      'suria@email.com',           'Suria Binti Azman',  'donor',       true),
  (uid_donor3,  'seed-donor-3',      'zainab@email.com',          'Zainab Mohamed',      'donor',       true)
on conflict (id) do nothing;

-- ================================================================
-- 2. ORGANIZATIONS
-- ================================================================

-- Org 1: Wakaf Masjid Ar-Rahman — Waqf Institution, Pulau Pinang
insert into public.organizations
  (id, name, legal_name, registration_no, website_url, contact_email,
   state, org_type, oversight_authority, fund_types, summary,
   onboarding_status, listing_status, onboarding_submitted_at, approved_at, approved_by_user_id)
values (
  org1,
  'Wakaf Masjid Ar-Rahman',
  'Lembaga Wakaf Masjid Ar-Rahman Penang',
  'WF-0021-2019',
  'https://wakafar.org.my',
  'admin@wakafar.org.my',
  'Pulau Pinang',
  'waqf_institution',
  'SIRC (MAINPP)',
  array['waqf', 'sadaqah'],
  'Managing 3 community waqf assets in George Town since 2018. All proceeds reinvested into community programs. Overseen by MAINPP.',
  'approved', 'listed',
  now() - interval '180 days',
  now() - interval '170 days',
  uid_rev1
) on conflict (id) do nothing;

-- Org 2: Yayasan Pendidikan Al-Falah — Foundation, Kuala Lumpur
insert into public.organizations
  (id, name, legal_name, registration_no, website_url, contact_email,
   state, org_type, oversight_authority, fund_types, summary,
   onboarding_status, listing_status, onboarding_submitted_at, approved_at, approved_by_user_id)
values (
  org2,
  'Yayasan Pendidikan Al-Falah',
  'Yayasan Pendidikan Al-Falah Berhad',
  'PPT-0234-2020',
  'https://alfalah.org.my',
  'contact@alfalah.org.my',
  'Kuala Lumpur',
  'foundation',
  'ROS',
  array['sadaqah'],
  'Education scholarships and digital learning programmes for underprivileged Muslim youth across KL and Selangor. Established 2020.',
  'approved', 'listed',
  now() - interval '120 days',
  now() - interval '110 days',
  uid_rev1
) on conflict (id) do nothing;

-- Org 3: Persatuan Kebajikan Sejahtera — NGO, Selangor
insert into public.organizations
  (id, name, legal_name, registration_no, contact_email,
   state, org_type, oversight_authority, fund_types, summary,
   onboarding_status, listing_status, onboarding_submitted_at, approved_at, approved_by_user_id)
values (
  org3,
  'Persatuan Kebajikan Sejahtera',
  'Persatuan Kebajikan Sejahtera Shah Alam',
  'PPM-012-10-06102021',
  'sejahtera@welfare.org.my',
  'Selangor',
  'ngo',
  'ROS',
  array['sadaqah'],
  'Community welfare association serving B40 families in Shah Alam and Klang Valley. Providing food aid, skills training, and crisis support since 2021.',
  'approved', 'listed',
  now() - interval '90 days',
  now() - interval '80 days',
  uid_rev2
) on conflict (id) do nothing;

-- Org 4: Masjid Sultan Ahmad Shah — Mosque/Surau, Pahang
insert into public.organizations
  (id, name, legal_name, registration_no, contact_email,
   state, org_type, oversight_authority, fund_types, summary,
   onboarding_status, listing_status, onboarding_submitted_at)
values (
  org4,
  'Masjid Sultan Ahmad Shah Welfare Fund',
  'Tabung Kebajikan Masjid Sultan Ahmad Shah',
  'MAJ-BNT-2022-0041',
  'admin@msas.org.my',
  'Pahang',
  'mosque_surau',
  'JAKIM',
  array['sadaqah', 'zakat'],
  'Welfare fund of Masjid Sultan Ahmad Shah managing zakat-eligible assistance programmes for the local community in Bentong, Pahang.',
  'submitted', 'private',
  now() - interval '5 days'
) on conflict (id) do nothing;

-- Org 5: Pertubuhan Kebajikan Anak Yatim Johor — NGO, Johor (new/draft)
insert into public.organizations
  (id, name, contact_email,
   state, org_type, fund_types, summary,
   onboarding_status, listing_status)
values (
  org5,
  'Rumah Kasih Anak Yatim Johor',
  'halimah@rumahkasih.org.my',
  'Johor',
  'ngo',
  array['sadaqah'],
  'Orphan welfare home providing education, shelter, and personal development for underprivileged children in Johor Bahru.',
  'draft', 'private'
) on conflict (id) do nothing;

-- ================================================================
-- 3. ORG MEMBERS
-- ================================================================
insert into public.org_members
  (organization_id, user_id, org_role, status, accepted_at)
values
  -- Org 1
  (org1, uid_o1_admin, 'org_admin',   'active', now() - interval '170 days'),
  (org1, uid_o1_mgr,   'org_manager', 'active', now() - interval '160 days'),
  -- Org 2
  (org2, uid_o2_admin, 'org_admin',   'active', now() - interval '110 days'),
  -- Org 3
  (org3, uid_o3_admin, 'org_admin',   'active', now() - interval '80 days'),
  -- Org 4
  (org4, uid_o4_admin, 'org_admin',   'active', now() - interval '5 days'),
  -- Org 5
  (org5, uid_o5_admin, 'org_admin',   'active', now() - interval '2 days')
on conflict (organization_id, user_id) do nothing;

-- ================================================================
-- 4. PROJECTS
-- ================================================================
-- Org 1 Projects
insert into public.projects
  (id, organization_id, title, objective, description,
   location_text, start_date, end_date, budget_amount, currency,
   beneficiary_summary, status, is_public)
values
  (p1a, org1,
   'Waqf Student Hostel — Phase 2',
   'Construct an additional 40-room student hostel block on waqf land to expand affordable accommodation for university students.',
   'Phase 2 expansion of the waqf student hostel adjacent to the existing Phase 1 building. Construction commenced January 2025.',
   'George Town, Pulau Pinang',
   '2025-01-01', '2025-12-31', 180000, 'MYR',
   'University students from B40 families; targeting 120 beneficiaries upon completion.',
   'active', true),

  (p1b, org1,
   'Community Medical Clinic Renovation',
   'Renovate the waqf-owned community medical clinic to improve patient facilities and expand consultation capacity.',
   'Full interior renovation including new consultation rooms, updated medical equipment, and accessibility improvements.',
   'Jelutong, Pulau Pinang',
   '2025-03-01', '2025-08-31', 65000, 'MYR',
   'Low-income community members in Jelutong and surrounding areas; 250+ patients per month.',
   'active', true),

  (p1c, org1,
   'Waqf Market Renovation 2024',
   'Restore and modernise the waqf market building to increase rental income for community programmes.',
   'Completed renovation of the original waqf market building built in 1989. New electrical, plumbing, and structural work completed.',
   'George Town, Pulau Pinang',
   '2024-01-01', '2024-12-31', 120000, 'MYR',
   'Market vendors and surrounding community; generates sustainable waqf income stream.',
   'archived', true)
on conflict (id) do nothing;

-- Org 2 Projects
insert into public.projects
  (id, organization_id, title, objective, description,
   location_text, start_date, end_date, budget_amount, currency,
   beneficiary_summary, status, is_public)
values
  (p2a, org2,
   'Education Scholarship Fund 2025',
   'Provide annual education scholarships to top-performing Muslim students from underprivileged households in KL and Selangor.',
   'Annual scholarship programme covering tuition fees, books, and living allowance for 50 qualifying students at public universities.',
   'Kuala Lumpur and Selangor',
   '2025-01-01', '2025-12-31', 250000, 'MYR',
   '50 university students per cohort from B40 families; priority given to orphans and single-parent households.',
   'active', true),

  (p2b, org2,
   'Digital Learning Centre — Setapak',
   'Establish a community digital learning centre equipped with computers, internet access, and coding courses for youth.',
   'Converted a donated shophouse in Setapak into a fully equipped digital learning space with 30 computer stations and certified trainers.',
   'Setapak, Kuala Lumpur',
   '2024-09-01', '2025-09-30', 80000, 'MYR',
   'Youth aged 15-25 from B40 families; targeting 200 trainees in first year.',
   'active', true)
on conflict (id) do nothing;

-- Org 3 Projects
insert into public.projects
  (id, organization_id, title, objective, description,
   location_text, start_date, end_date, budget_amount, currency,
   beneficiary_summary, status, is_public)
values
  (p3a, org3,
   'B40 Food Aid Programme',
   'Provide weekly food basket deliveries to B40 families in Shah Alam and Klang identified through social welfare referrals.',
   'Weekly food baskets containing staple goods delivered to registered beneficiary households every Saturday morning.',
   'Shah Alam and Klang, Selangor',
   '2024-06-01', null, 48000, 'MYR',
   '80 registered B40 households; approximately 320 individuals including children and elderly.',
   'active', true),

  (p3b, org3,
   'Skills Training Initiative — Batch 2',
   'Provide vocational training in baking, tailoring, and basic electrical work to unemployed adults from B40 households.',
   'Three-month intensive training programme held at the association premises. Trainees receive certification and job placement support.',
   'Shah Alam, Selangor',
   '2025-02-01', '2025-05-31', 32000, 'MYR',
   '25 trainees per batch; adults aged 18-50 from B40 households in Selangor.',
   'active', false)
on conflict (id) do nothing;

-- Org 4 Project (draft)
insert into public.projects
  (id, organization_id, title, objective, description,
   location_text, budget_amount, currency, status, is_public)
values
  (p4a, org4,
   'Masjid Community Hall Renovation',
   'Renovate the masjid community hall to accommodate social welfare programmes and Quran classes.',
   'Draft project pending org approval.',
   'Bentong, Pahang',
   45000, 'MYR', 'draft', false)
on conflict (id) do nothing;

-- ================================================================
-- 5. PROJECT REPORTS
-- ================================================================
insert into public.project_reports
  (id, organization_id, project_id, title, report_body, report_date,
   submission_status, verification_status,
   submitted_at, verified_at, verified_by_user_id)
values

  -- Org1 / p1a: Q1 2025 (verified)
  (r1a1, org1, p1a,
   'Q1 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"Foundation and ground floor structural works completed on schedule. All materials sourced from approved contractors. MAINPP inspection conducted on 28 March 2025 with no major findings.","beneficiary_count":0,"total_spend":42000,"completion_pct":23,"milestones":["Foundation completed","Ground floor columns poured","Building permit renewed"]}',
   '2025-03-31',
   'submitted', 'verified',
   now() - interval '85 days', now() - interval '80 days', uid_rev1),

  -- Org1 / p1a: Q2 2025 (verified)
  (r1a2, org1, p1a,
   'Q2 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"First and second floor structural works completed. Brick laying and plastering commenced. External scaffolding installed. Sub-contractor delays on electrical conduit resolved mid-June.","beneficiary_count":0,"total_spend":89000,"completion_pct":49,"milestones":["Floors 1-2 structure complete","Brickwork 60% done","Electrical conduit installation started"]}',
   '2025-06-30',
   'submitted', 'verified',
   now() - interval '55 days', now() - interval '50 days', uid_rev1),

  -- Org1 / p1a: Q3 2025 (verified)
  (r1a3, org1, p1a,
   'Q3 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"All structural works complete. Internal plastering, tiling, and bathroom fittings installed on floors 1-3. Electrical first-fix completed. Building shell 85% complete. On track for handover in Q4 2025.","beneficiary_count":0,"total_spend":138000,"completion_pct":77,"milestones":["Structural works complete","Internal finishes 70%","Electrical first-fix done","Plumbing installed"]}',
   '2025-09-30',
   'submitted', 'verified',
   now() - interval '25 days', now() - interval '20 days', uid_rev1),

  -- Org1 / p1a: Q4 2025 (submitted, pending review)
  (r1a4, org1, p1a,
   'Q4 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"Final finishing works underway. Painting completed on all floors. Furniture procurement in progress. Certificate of Completion expected by end of December 2025. First batch of 30 student tenants confirmed for January 2026 intake.","beneficiary_count":30,"total_spend":165000,"completion_pct":92,"milestones":["Painting complete","Furniture ordered","30 tenants confirmed for Jan 2026"]}',
   '2025-12-31',
   'submitted', 'pending',
   now() - interval '3 days', null, null),

  -- Org1 / p1b: Medical Clinic (verified)
  (r1b1, org1, p1b,
   'Mid-Project Report — Community Medical Clinic Renovation',
   '{"narrative":"Demolition and structural reinforcement complete. New consultation rooms fitted. Accessibility ramp installed at entrance. Electrical rewiring 90% done. Equipment installation scheduled for July 2025.","beneficiary_count":0,"total_spend":38000,"completion_pct":58,"milestones":["Demolition done","New consultation rooms fitted","Accessibility ramp installed","Rewiring near complete"]}',
   '2025-05-31',
   'submitted', 'verified',
   now() - interval '60 days', now() - interval '55 days', uid_rev2),

  -- Org2 / p2a: Annual 2024 (verified)
  (r2a1, org2, p2a,
   'Annual Scholarship Report 2024',
   '{"narrative":"50 scholars selected through rigorous means-testing and academic merit review. All scholarship payments disbursed in two tranches (January and July 2024). 94% of scholars maintained CGPA above 3.0. Two scholars withdrew due to personal reasons and funds reallocated.","beneficiary_count":50,"total_spend":215000,"completion_pct":100,"milestones":["50 scholars selected","Academic monitoring Q1-Q4","94% retention rate","End-year impact report submitted to ROS"]}',
   '2024-12-31',
   'submitted', 'verified',
   now() - interval '70 days', now() - interval '65 days', uid_rev1),

  -- Org2 / p2a: Q1 2025 (submitted, pending)
  (r2a2, org2, p2a,
   'Q1 2025 Scholarship Disbursement Report',
   '{"narrative":"New 2025 cohort of 50 scholars selected and onboarded. First tranche payments disbursed to all 50 scholars by 15 February 2025. Orientation programme conducted 8 February 2025 with 48 scholars attending in person.","beneficiary_count":50,"total_spend":67500,"completion_pct":27,"milestones":["50 scholars selected for 2025","Orientation completed","First tranche disbursed"]}',
   '2025-03-31',
   'submitted', 'pending',
   now() - interval '8 days', null, null),

  -- Org2 / p2b: Digital Centre Inception (verified)
  (r2b1, org2, p2b,
   'Digital Learning Centre — Inception Report',
   '{"narrative":"Premises renovation completed September 2024. 30 computer stations installed and configured. Three certified trainers recruited. First batch of 25 trainees enrolled for October 2024 cohort. All trainees from B40 households in Setapak.","beneficiary_count":25,"total_spend":72000,"completion_pct":40,"milestones":["Premises ready","30 computers installed","3 trainers recruited","First batch enrolled"]}',
   '2024-10-31',
   'submitted', 'verified',
   now() - interval '110 days', now() - interval '105 days', uid_rev2),

  -- Org3 / p3a: January Report (verified)
  (r3a1, org3, p3a,
   'January 2025 Food Aid Report',
   '{"narrative":"Food baskets distributed to 80 registered households every Saturday in January 2025. Total 4 distribution days, 320 baskets delivered. New beneficiary registration form introduced to improve tracking. Two families referred by Jabatan Kebajikan Masyarakat this month.","beneficiary_count":320,"total_spend":4200,"completion_pct":null,"milestones":["80 households served","320 baskets delivered","2 new families registered","JKM referral system established"]}',
   '2025-01-31',
   'submitted', 'verified',
   now() - interval '45 days', now() - interval '40 days', uid_rev2),

  -- Org3 / p3a: February Report (submitted, pending)
  (r3a2, org3, p3a,
   'February 2025 Food Aid Report',
   '{"narrative":"February distribution completed across 4 Saturdays. 82 households served (2 new additions). Total 328 baskets delivered. Volunteer count increased to 12 following social media campaign. Community kitchen event held on 15 February with 60 attendees.","beneficiary_count":328,"total_spend":4350,"completion_pct":null,"milestones":["82 households served (+2 new)","328 baskets delivered","12 volunteers","Community kitchen event"]}',
   '2025-02-28',
   'submitted', 'pending',
   now() - interval '10 days', null, null)

on conflict (id) do nothing;

-- ================================================================
-- 6. FINANCIAL SNAPSHOTS
-- ================================================================
insert into public.financial_snapshots
  (id, organization_id, period_year, currency, inputs,
   submission_status, verification_status, submitted_at, verified_at)
values

  (fin1, org1, 2024, 'MYR',
   '{"total_income":420000,"waqf_income":280000,"donation_income":140000,"program_expenses":315000,"admin_expenses":42000,"surplus":63000,"is_audited":true,"has_annual_report":true,"audit_firm":"Azman & Associates (AF0892)","notes":"Waqf income from market and hostel rentals. External audit completed March 2025."}',
   'submitted', 'verified',
   now() - interval '75 days', now() - interval '70 days'),

  (fin2, org2, 2024, 'MYR',
   '{"total_income":310000,"donation_income":285000,"grant_income":25000,"program_expenses":255000,"admin_expenses":35000,"surplus":20000,"is_audited":true,"has_annual_report":true,"audit_firm":"Rashdan Partners (AF1024)","notes":"Grant from Yayasan Pendidikan Malaysia received Q3 2024. External audit filed with ROS."}',
   'submitted', 'verified',
   now() - interval '55 days', now() - interval '50 days'),

  (fin3, org3, 2024, 'MYR',
   '{"total_income":95000,"donation_income":95000,"program_expenses":78000,"admin_expenses":12000,"surplus":5000,"is_audited":false,"has_annual_report":true,"audit_firm":null,"notes":"Annual report prepared but external audit not yet commissioned. Planning to engage auditor for 2024 accounts."}',
   'submitted', 'pending',
   now() - interval '30 days', null)

on conflict (id) do nothing;

-- ================================================================
-- 7. CERTIFICATION APPLICATIONS + EVALUATIONS + HISTORY
-- ================================================================

-- Applications
insert into public.certification_applications
  (id, organization_id, status, submitted_at, submitted_by_user_id,
   reviewer_assigned_user_id, reviewer_comment)
values
  (ca1, org1, 'approved', now() - interval '85 days', uid_o1_admin, uid_rev1, 'Excellent governance, verified financials, and strong waqf compliance. Platinum Amanah awarded.'),
  (ca2, org2, 'approved', now() - interval '65 days', uid_o2_admin, uid_rev1, 'Solid project reporting and financial transparency. Gold Amanah awarded.'),
  (ca3, org3, 'approved', now() - interval '40 days', uid_o3_admin, uid_rev2, 'Good community impact. Financial audit pending but governance sound. Silver Amanah awarded.'),
  (ca4, org4, 'submitted', now() - interval '4 days', uid_o4_admin, null, null)
on conflict (id) do nothing;

-- Evaluations
insert into public.certification_evaluations
  (id, organization_id, certification_application_id, criteria_version,
   total_score, score_breakdown, computed_at, computed_by_user_id)
values
  (ce1, org1, ca1, 'ctcf_v1', 88.5,
   '{"governance":{"score":20,"max":20,"gate_passed":true},"financial":{"score":20,"max":20},"project":{"score":22,"max":25},"impact":{"score":16,"max":20},"shariah":{"score":15,"max":15,"normalized":15},"total":88.5}',
   now() - interval '80 days', uid_rev1),

  (ce2, org2, ca2, 'ctcf_v1', 76.0,
   '{"governance":{"score":20,"max":20,"gate_passed":true},"financial":{"score":18,"max":20},"project":{"score":20,"max":25},"impact":{"score":14,"max":20},"shariah":{"score":8,"max":8,"normalized":14},"total":76.0}',
   now() - interval '60 days', uid_rev1),

  (ce3, org3, ca3, 'ctcf_v1', 63.0,
   '{"governance":{"score":20,"max":20,"gate_passed":true},"financial":{"score":12,"max":20},"project":{"score":18,"max":25},"impact":{"score":10,"max":20},"shariah":{"score":5,"max":8,"normalized":9},"total":63.0}',
   now() - interval '35 days', uid_rev2)
on conflict (id) do nothing;

-- Certification history
insert into public.certification_history
  (id, organization_id, certification_application_id, evaluation_id,
   previous_status, new_status, valid_from, valid_to,
   decided_by_user_id, decision_reason, decided_at)
values
  (ch1, org1, ca1, ce1, null, 'certified',
   '2025-03-01', '2026-02-28',
   uid_rev1, 'Full governance compliance, verified financials, and strong waqf documentation. Platinum Amanah awarded.',
   now() - interval '79 days'),

  (ch2, org2, ca2, ce2, null, 'certified',
   '2025-04-01', '2026-03-31',
   uid_rev1, 'Strong scholarship impact reporting and financial transparency. Gold Amanah awarded.',
   now() - interval '59 days'),

  (ch3, org3, ca3, ce3, null, 'certified',
   '2025-05-01', '2026-04-30',
   uid_rev2, 'Community impact verified, governance solid. Financial audit recommended for next cycle. Silver Amanah awarded.',
   now() - interval '34 days')
on conflict (id) do nothing;

-- ================================================================
-- 8. TRUST EVENTS
-- ================================================================
insert into public.trust_events
  (id, organization_id, event_type, event_ref_table, event_ref_id,
   payload, occurred_at, actor_user_id, source, idempotency_key)
values
  (te1, org1, 'report_verified', 'project_reports', r1a3,
   '{"report_title":"Q3 2025 Progress Report","project":"Waqf Student Hostel Phase 2"}',
   now() - interval '20 days', uid_rev1, 'reviewer', 'report_verified_' || r1a3::text),

  (te2, org1, 'certification_updated', 'certification_history', ch1,
   '{"new_status":"certified","grade":"Platinum Amanah","score":88.5}',
   now() - interval '79 days', uid_rev1, 'reviewer', 'cert_updated_' || ch1::text),

  (te3, org2, 'certification_updated', 'certification_history', ch2,
   '{"new_status":"certified","grade":"Gold Amanah","score":76.0}',
   now() - interval '59 days', uid_rev1, 'reviewer', 'cert_updated_' || ch2::text),

  (te4, org2, 'report_verified', 'project_reports', r2a1,
   '{"report_title":"Annual Scholarship Report 2024","project":"Education Scholarship Fund"}',
   now() - interval '65 days', uid_rev1, 'reviewer', 'report_verified_' || r2a1::text),

  (te5, org3, 'certification_updated', 'certification_history', ch3,
   '{"new_status":"certified","grade":"Silver Amanah","score":63.0}',
   now() - interval '34 days', uid_rev2, 'reviewer', 'cert_updated_' || ch3::text),

  (te6, org3, 'report_verified', 'project_reports', r3a1,
   '{"report_title":"January 2025 Food Aid Report","project":"B40 Food Aid Programme"}',
   now() - interval '40 days', uid_rev2, 'reviewer', 'report_verified_' || r3a1::text)
on conflict (idempotency_key) do nothing;

-- ================================================================
-- 9. AMANAH INDEX HISTORY
-- ================================================================
insert into public.amanah_index_history
  (id, organization_id, score_version, score_value,
   computed_at, computed_from_event_id, breakdown, public_summary)
values
  -- Org 1: History (oldest to newest)
  (ah3, org1, 'amanah_v1', 74.5,
   now() - interval '300 days', te2,
   '{"governance":100,"financial":80,"project":75,"impact":65,"feedback":60}',
   'Initial certification score. Strong governance foundation with growing project impact.'),

  (ah2, org1, 'amanah_v1', 82.5,
   now() - interval '79 days', te2,
   '{"governance":100,"financial":90,"project":80,"impact":70,"feedback":70}',
   'Score improved following certification renewal. Financial reporting strengthened with external audit.'),

  (ah1, org1, 'amanah_v1', 86.0,
   now() - interval '20 days', te1,
   '{"governance":100,"financial":90,"project":80,"impact":75,"feedback":70}',
   'Platinum Amanah trust score. Consistent report verification and strong waqf governance.'),

  -- Org 2: History
  (ah5, org2, 'amanah_v1', 68.0,
   now() - interval '200 days', te3,
   '{"governance":95,"financial":75,"project":70,"impact":60,"feedback":55}',
   'Initial score. Good governance, scholarship programme establishing track record.'),

  (ah4, org2, 'amanah_v1', 74.5,
   now() - interval '59 days', te4,
   '{"governance":95,"financial":80,"project":78,"impact":65,"feedback":60}',
   'Gold Amanah trust score. Strong scholarship impact documentation and financial transparency.'),

  -- Org 3: Current
  (ah6, org3, 'amanah_v1', 61.0,
   now() - interval '34 days', te5,
   '{"governance":90,"financial":55,"project":72,"impact":55,"feedback":50}',
   'Silver Amanah trust score. Strong community reach. Financial audit recommended for score improvement.')

on conflict (id) do nothing;

-- ================================================================
-- 10. DONATIONS
-- ================================================================
insert into public.donation_transactions
  (id, organization_id, project_id, donor_user_id, donor_email,
   amount, platform_fee_amount, currency, status, gateway,
   gateway_checkout_id, gateway_transaction_id,
   initiated_at, confirmed_at)
values
  -- Org 1 donations
  (don1, org1, p1a, uid_donor1, 'amirul@email.com',
   100, 2, 'MYR', 'confirmed', 'toyyibpay', 'TPY-001-A1', 'TRX-001-A1',
   now() - interval '15 days', now() - interval '15 days' + interval '5 minutes'),

  (don2, org1, p1a, uid_donor2, 'suria@email.com',
   250, 5, 'MYR', 'confirmed', 'toyyibpay', 'TPY-002-A1', 'TRX-002-A1',
   now() - interval '20 days', now() - interval '20 days' + interval '3 minutes'),

  (don3, org1, p1b, uid_donor3, 'zainab@email.com',
   50, 1, 'MYR', 'confirmed', 'toyyibpay', 'TPY-003-A1', 'TRX-003-A1',
   now() - interval '10 days', now() - interval '10 days' + interval '4 minutes'),

  (don4, org1, null, uid_donor1, 'amirul@email.com',
   200, 4, 'MYR', 'confirmed', 'toyyibpay', 'TPY-004-A1', 'TRX-004-A1',
   now() - interval '5 days', now() - interval '5 days' + interval '6 minutes'),

  -- Org 2 donations
  (don5, org2, p2a, uid_donor1, 'amirul@email.com',
   500, 10, 'MYR', 'confirmed', 'toyyibpay', 'TPY-001-A2', 'TRX-001-A2',
   now() - interval '30 days', now() - interval '30 days' + interval '5 minutes'),

  (don6, org2, p2a, uid_donor2, 'suria@email.com',
   150, 3, 'MYR', 'confirmed', 'toyyibpay', 'TPY-002-A2', 'TRX-002-A2',
   now() - interval '12 days', now() - interval '12 days' + interval '4 minutes'),

  -- Org 3 donations
  (don7, org3, p3a, uid_donor3, 'zainab@email.com',
   75, 1.5, 'MYR', 'confirmed', 'toyyibpay', 'TPY-001-A3', 'TRX-001-A3',
   now() - interval '8 days', now() - interval '8 days' + interval '3 minutes'),

  (don8, org3, p3a, uid_donor1, 'amirul@email.com',
   30, 0.6, 'MYR', 'confirmed', 'toyyibpay', 'TPY-002-A3', 'TRX-002-A3',
   now() - interval '2 days', now() - interval '2 days' + interval '5 minutes')

on conflict (id) do nothing;

-- ================================================================
-- 11. WEBHOOK EVENTS (for confirmed donations)
-- ================================================================
insert into public.payment_webhook_events
  (id, gateway, event_id, donation_transaction_id,
   payload, signature_valid, processed, processed_at)
values
  (wh1, 'toyyibpay', 'WH-TPY-001-A1', don1,
   '{"billCode":"TPY-001-A1","order_id":"TRX-001-A1","status_id":"1","amount":"10000"}',
   true, true, now() - interval '15 days' + interval '5 minutes'),

  (wh2, 'toyyibpay', 'WH-TPY-002-A1', don2,
   '{"billCode":"TPY-002-A1","order_id":"TRX-002-A1","status_id":"1","amount":"25000"}',
   true, true, now() - interval '20 days' + interval '3 minutes'),

  (wh3, 'toyyibpay', 'WH-TPY-001-A2', don5,
   '{"billCode":"TPY-001-A2","order_id":"TRX-001-A2","status_id":"1","amount":"50000"}',
   true, true, now() - interval '30 days' + interval '5 minutes')
on conflict (id) do nothing;

-- ================================================================
-- 12. SCHOLAR NOTES
-- ================================================================
insert into public.scholar_notes
  (id, organization_id, author_user_id, note_body, is_publishable, published_at)
values
  (sn1, org1, uid_scholar,
   'Waqf governance structure is sound and MAINPP oversight is active and well-documented. The organization demonstrates strong adherence to contemporary fiqh al-waqf. Recommend the organization archive Shariah compliance review minutes annually for CTCF Layer 5 continuity. Asset protection covenant reviewed and accepted.',
   true, now() - interval '79 days'),

  (sn2, org2, uid_scholar,
   'Scholarship selection process reviewed. Means-testing methodology aligns with zakat eligibility principles, which is commendable even for sadaqah-funded programmes. Recommend the organization formalize a Shariah advisory note on the treatment of PTPTN loan recipients as eligible beneficiaries.',
   true, now() - interval '59 days')
on conflict (id) do nothing;

-- ================================================================
-- 13. AUDIT LOGS (key events)
-- ================================================================
insert into public.audit_logs
  (actor_user_id, actor_role, organization_id, action,
   entity_table, entity_id, metadata, occurred_at)
values
  (uid_rev1, 'reviewer', org1, 'ORG_APPROVED',
   'organizations', org1,
   '{"decision":"approved","listing_status":"listed"}',
   now() - interval '170 days'),

  (uid_rev1, 'reviewer', org1, 'CERTIFICATION_APPROVED',
   'certification_history', ch1,
   '{"grade":"Platinum Amanah","score":88.5}',
   now() - interval '79 days'),

  (uid_rev1, 'reviewer', org2, 'ORG_APPROVED',
   'organizations', org2,
   '{"decision":"approved","listing_status":"listed"}',
   now() - interval '110 days'),

  (uid_rev2, 'reviewer', org3, 'ORG_APPROVED',
   'organizations', org3,
   '{"decision":"approved","listing_status":"listed"}',
   now() - interval '80 days'),

  (uid_o1_admin, 'org_admin', org1, 'PROJECT_CREATED',
   'projects', p1a,
   '{"title":"Waqf Student Hostel — Phase 2"}',
   now() - interval '165 days'),

  (uid_o1_admin, 'org_admin', org1, 'REPORT_CREATED',
   'project_reports', r1a4,
   '{"title":"Q4 2025 Progress Report","project_id":null}',
   now() - interval '3 days');

end $$;
