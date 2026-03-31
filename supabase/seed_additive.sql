-- =============================================================
-- Amanah Governance Platform — supabase/seed_additive.sql
-- Sprint 9: ADDITIVE seed — runs safely on top of existing data
--
-- Existing data preserved:
--   5 users (super_admin, reviewer, scholar, orgadmin, donor)
--   3 orgs (Persatuan/draft, Yayasan Bakti/submitted, Masjid Al-Amanah/approved)
--   1 project, 1 financial, 1 cert set, 1 amanah score, 2 donations
--
-- This script ADDS:
--   8 new users (2nd reviewer, 3 org admins, 1 org manager, 2 donors)
--   Upgrades org1 + org2 to approved+listed
--   Adds 2 new orgs (mosque submitted, NGO draft)
--   Adds 7 new projects across all orgs
--   Adds 9 verified/submitted reports
--   Adds 2 financial snapshots for org1+org2
--   Adds certs + evaluations for org1+org2
--   Adds full amanah score histories for all 3 listed orgs
--   Adds 6 new donations across listed orgs
--   Adds 2 scholar notes
-- =============================================================

do $$
declare
  -- ── EXISTING user IDs (already in DB — do not change) ──────
  uid_super    uuid := 'a0000001-0000-0000-0000-000000000001';
  uid_rev1     uuid := 'a0000001-0000-0000-0000-000000000002';  -- Nur Reviewer
  uid_scholar  uuid := 'a0000001-0000-0000-0000-000000000003';
  uid_orgadmin uuid := 'a0000001-0000-0000-0000-000000000004';  -- Siti (already admin of all 3 orgs)
  uid_donor1   uuid := 'a0000001-0000-0000-0000-000000000005';  -- Ahmad Donor

  -- ── NEW users (different IDs, different emails) ─────────────
  uid_rev2     uuid := 'a1000001-0000-0000-0000-000000000001';  -- Hafiz Reviewer
  uid_o2_mgr   uuid := 'a1000001-0000-0000-0000-000000000002';  -- Farid (Yayasan manager)
  uid_o3_mgr   uuid := 'a1000001-0000-0000-0000-000000000003';  -- Rosmah (Masjid manager)
  uid_o4_admin uuid := 'a1000001-0000-0000-0000-000000000004';  -- Ahmad Mosque (new org4)
  uid_o5_admin uuid := 'a1000001-0000-0000-0000-000000000005';  -- Halimah (new org5)
  uid_donor2   uuid := 'a1000001-0000-0000-0000-000000000006';  -- Suria Binti Azman
  uid_donor3   uuid := 'a1000001-0000-0000-0000-000000000007';  -- Zainab Mohamed

  -- ── EXISTING org IDs ────────────────────────────────────────
  org1         uuid := 'b0000001-0000-0000-0000-000000000001';  -- Persatuan Kebajikan (will upgrade)
  org2         uuid := 'b0000001-0000-0000-0000-000000000002';  -- Yayasan Bakti Warga (will upgrade)
  org3         uuid := 'b0000001-0000-0000-0000-000000000003';  -- Masjid Al-Amanah (already listed)

  -- ── NEW org IDs ─────────────────────────────────────────────
  org4         uuid := 'b1000001-0000-0000-0000-000000000001';  -- Masjid Sultan Ahmad Shah (submitted)
  org5         uuid := 'b1000001-0000-0000-0000-000000000002';  -- Rumah Kasih (draft)

  -- ── EXISTING project ────────────────────────────────────────
  p3_existing  uuid := 'c0000001-0000-0000-0000-000000000001';  -- Waqf Library Penang (org3)

  -- ── NEW projects ────────────────────────────────────────────
  p1a          uuid := 'c1000001-0000-0000-0000-000000000001';  -- org1: B40 Food Aid
  p1b          uuid := 'c1000001-0000-0000-0000-000000000002';  -- org1: Skills Training
  p2a          uuid := 'c1000001-0000-0000-0000-000000000003';  -- org2: Scholarship Fund
  p2b          uuid := 'c1000001-0000-0000-0000-000000000004';  -- org2: Digital Centre
  p3b          uuid := 'c1000001-0000-0000-0000-000000000005';  -- org3: Medical Clinic
  p3c          uuid := 'c1000001-0000-0000-0000-000000000006';  -- org3: Hostel Phase 2
  p4a          uuid := 'c1000001-0000-0000-0000-000000000007';  -- org4: Hall Renovation (draft)

  -- ── NEW reports ─────────────────────────────────────────────
  r1a1         uuid := 'd1000001-0000-0000-0000-000000000003';  -- org1/p1a Jan (verified)
  r1a2         uuid := 'd1000001-0000-0000-0000-000000000004';  -- org1/p1a Feb (submitted)
  r1b1         uuid := 'd1000001-0000-0000-0000-000000000005';  -- org1/p1b inception (verified)
  r2a1         uuid := 'd1000001-0000-0000-0000-000000000006';  -- org2/p2a annual 2024 (verified)
  r2a2         uuid := 'd1000001-0000-0000-0000-000000000007';  -- org2/p2a Q1 2025 (submitted)
  r2b1         uuid := 'd1000001-0000-0000-0000-000000000008';  -- org2/p2b inception (verified)
  r3b1         uuid := 'd1000001-0000-0000-0000-000000000009';  -- org3/p3b mid-project (verified)
  r3c1         uuid := 'd1000001-0000-0000-0000-00000000000a';  -- org3/p3c Q1 (verified)
  r3c2         uuid := 'd1000001-0000-0000-0000-00000000000b';  -- org3/p3c Q2 (submitted/pending)

  -- ── NEW financials ───────────────────────────────────────────
  fin2         uuid := 'f1000001-0000-0000-0000-000000000001';  -- org2 2024
  fin3         uuid := 'f1000001-0000-0000-0000-000000000002';  -- org1 2024

  -- ── NEW certification ────────────────────────────────────────
  ca2          uuid := 'a1a00001-0000-0000-0000-000000000001';
  ca3          uuid := 'a1a00001-0000-0000-0000-000000000002';
  ca4          uuid := 'a1a00001-0000-0000-0000-000000000003';  -- org4 submitted
  ce2          uuid := 'a2a00001-0000-0000-0000-000000000001';
  ce3          uuid := 'a2a00001-0000-0000-0000-000000000002';
  ch2          uuid := 'a3a00001-0000-0000-0000-000000000001';
  ch3          uuid := 'a3a00001-0000-0000-0000-000000000002';

  -- ── NEW trust events ─────────────────────────────────────────
  te1          uuid := 'a4000001-0000-0000-0000-000000000001';
  te2          uuid := 'a4000001-0000-0000-0000-000000000002';
  te3          uuid := 'a4000001-0000-0000-0000-000000000003';
  te4          uuid := 'a4000001-0000-0000-0000-000000000004';

  -- ── NEW amanah history ───────────────────────────────────────
  -- org3 already has ab000001-...-001 (74.5)
  ah3b         uuid := 'a5000001-0000-0000-0000-000000000001';  -- org3 updated score (86.0)
  ah1a         uuid := 'a5000001-0000-0000-0000-000000000002';  -- org1 first score
  ah1b         uuid := 'a5000001-0000-0000-0000-000000000003';  -- org1 updated score
  ah2a         uuid := 'a5000001-0000-0000-0000-000000000004';  -- org2 first score
  ah2b         uuid := 'a5000001-0000-0000-0000-000000000005';  -- org2 updated score

  -- ── NEW donations ────────────────────────────────────────────
  don3         uuid := 'da000001-0000-0000-0000-000000000001';
  don4         uuid := 'da000001-0000-0000-0000-000000000002';
  don5         uuid := 'da000001-0000-0000-0000-000000000003';
  don6         uuid := 'da000001-0000-0000-0000-000000000004';
  don7         uuid := 'da000001-0000-0000-0000-000000000005';
  don8         uuid := 'da000001-0000-0000-0000-000000000006';

  -- ── Scholar notes ────────────────────────────────────────────
  sn1          uuid := 'a6000001-0000-0000-0000-000000000001';
  sn2          uuid := 'a6000001-0000-0000-0000-000000000002';

begin

-- ================================================================
-- 1. NEW USERS (all new emails, won't conflict)
-- ================================================================
insert into public.users
  (id, auth_provider_user_id, email, display_name, platform_role, is_active)
values
  (uid_rev2,   'seed-rev2',     'hafiz.reviewer@agp.test', 'Hafiz Reviewer',     'reviewer', true),
  (uid_o2_mgr, 'seed-o2-mgr',  'farid@yayasanfalah.org.my','Farid Al-Falah',     'donor',    true),
  (uid_o3_mgr, 'seed-o3-mgr',  'rosmah@wakafar.org.my',    'Rosmah Manager',     'donor',    true),
  (uid_o4_admin,'seed-o4-admin','admin@sultanahmad.org.my','Ahmad Mosque Admin', 'donor',    true),
  (uid_o5_admin,'seed-o5-admin','halimah@rumahkasih.org.my','Halimah Admin',     'donor',    true),
  (uid_donor2, 'seed-donor2',  'suria@email.com',           'Suria Binti Azman', 'donor',    true),
  (uid_donor3, 'seed-donor3',  'zainab@email.com',          'Zainab Mohamed',    'donor',    true)
on conflict (id) do nothing;

-- ================================================================
-- 2. UPGRADE EXISTING ORGS (org1 + org2 → approved + listed)
-- ================================================================

-- Org 1: Persatuan Kebajikan Sejahtera → approved NGO, Selangor
update public.organizations set
  name               = 'Persatuan Kebajikan Sejahtera Shah Alam',
  legal_name         = 'Persatuan Kebajikan Sejahtera Shah Alam',
  registration_no    = 'PPM-012-10-06102021',
  contact_email      = 'sejahtera@welfare.org.my',
  org_type           = 'ngo',
  oversight_authority= 'ROS',
  fund_types         = array['sadaqah'],
  summary            = 'Community welfare association serving B40 families in Shah Alam and Klang Valley. Providing food aid, skills training, and crisis support since 2021.',
  onboarding_status  = 'approved',
  listing_status     = 'listed',
  onboarding_submitted_at = now() - interval '90 days',
  approved_at        = now() - interval '80 days',
  approved_by_user_id= uid_rev2,
  updated_at         = now()
where id = org1;

-- Org 2: Yayasan Bakti Warga → approved Foundation, KL
update public.organizations set
  name               = 'Yayasan Pendidikan Al-Falah',
  legal_name         = 'Yayasan Pendidikan Al-Falah Berhad',
  registration_no    = 'PPT-0234-2020',
  website_url        = 'https://alfalah.org.my',
  contact_email      = 'contact@alfalah.org.my',
  state              = 'Kuala Lumpur',
  org_type           = 'foundation',
  oversight_authority= 'ROS',
  fund_types         = array['sadaqah'],
  summary            = 'Education scholarships and digital learning programmes for underprivileged Muslim youth across KL and Selangor. Established 2020.',
  onboarding_status  = 'approved',
  listing_status     = 'listed',
  onboarding_submitted_at = now() - interval '120 days',
  approved_at        = now() - interval '110 days',
  approved_by_user_id= uid_rev1,
  updated_at         = now()
where id = org2;

-- Org 3: Masjid Al-Amanah → update name to match UAT + add contact
update public.organizations set
  name               = 'Wakaf Masjid Ar-Rahman',
  legal_name         = 'Lembaga Wakaf Masjid Ar-Rahman Penang',
  registration_no    = 'WF-0021-2019',
  contact_email      = 'admin@wakafar.org.my',
  oversight_authority= 'SIRC (MAINPP)',
  summary            = 'Managing 3 community waqf assets in George Town since 2018. All proceeds reinvested into community programmes. Overseen by MAINPP.',
  updated_at         = now()
where id = org3;

-- ================================================================
-- 3. NEW ORGS
-- ================================================================
insert into public.organizations
  (id, name, legal_name, registration_no, contact_email,
   state, org_type, oversight_authority, fund_types, summary,
   onboarding_status, listing_status, onboarding_submitted_at)
values
  (org4,
   'Masjid Sultan Ahmad Shah Welfare Fund',
   'Tabung Kebajikan Masjid Sultan Ahmad Shah',
   'MAJ-BNT-2022-0041',
   'admin@msas.org.my',
   'Pahang', 'mosque_surau', 'JAKIM',
   array['sadaqah', 'zakat'],
   'Welfare fund managing zakat-eligible assistance programmes for the local community in Bentong, Pahang.',
   'submitted', 'private',
   now() - interval '5 days'),

  (org5,
   'Rumah Kasih Anak Yatim Johor',
   null, null,
   'halimah@rumahkasih.org.my',
   'Johor', 'ngo', null,
   array['sadaqah'],
   'Orphan welfare home providing education, shelter, and personal development for underprivileged children in Johor Bahru.',
   'draft', 'private',
   null)
on conflict (id) do nothing;

-- ================================================================
-- 4. ORG MEMBERS — new admins/managers
-- ================================================================
insert into public.org_members
  (organization_id, user_id, org_role, status, accepted_at)
values
  (org2, uid_o2_mgr,   'org_manager', 'active', now() - interval '108 days'),
  (org3, uid_o3_mgr,   'org_manager', 'active', now() - interval '168 days'),
  (org4, uid_o4_admin, 'org_admin',   'active', now() - interval '5 days'),
  (org5, uid_o5_admin, 'org_admin',   'active', now() - interval '2 days')
on conflict (organization_id, user_id) do nothing;

-- ================================================================
-- 5. NEW PROJECTS
-- ================================================================
insert into public.projects
  (id, organization_id, title, objective, description,
   location_text, start_date, end_date, budget_amount, currency,
   beneficiary_summary, status, is_public)
values

  -- Org 1 (Persatuan Kebajikan)
  (p1a, org1,
   'B40 Food Aid Programme',
   'Provide weekly food basket deliveries to B40 families in Shah Alam and Klang.',
   'Weekly food baskets containing staple goods delivered to registered beneficiary households every Saturday morning.',
   'Shah Alam and Klang, Selangor',
   '2024-06-01', null, 48000, 'MYR',
   '80 registered B40 households; approximately 320 individuals including children and elderly.',
   'active', true),

  (p1b, org1,
   'Skills Training Initiative — Batch 2',
   'Vocational training in baking, tailoring, and basic electrical work for unemployed B40 adults.',
   'Three-month intensive training programme. Trainees receive certification and job placement support.',
   'Shah Alam, Selangor',
   '2025-02-01', '2025-05-31', 32000, 'MYR',
   '25 trainees per batch; adults aged 18–50 from B40 households.',
   'active', true),

  -- Org 2 (Yayasan Al-Falah)
  (p2a, org2,
   'Education Scholarship Fund 2025',
   'Annual scholarships for top-performing Muslim students from underprivileged households in KL and Selangor.',
   'Covering tuition fees, books, and living allowance for 50 qualifying students at public universities.',
   'Kuala Lumpur and Selangor',
   '2025-01-01', '2025-12-31', 250000, 'MYR',
   '50 university students per cohort from B40 families; priority to orphans and single-parent households.',
   'active', true),

  (p2b, org2,
   'Digital Learning Centre — Setapak',
   'Establish a community digital learning centre with computers, internet access, and coding courses.',
   'Converted a shophouse in Setapak into a digital learning space with 30 computer stations and certified trainers.',
   'Setapak, Kuala Lumpur',
   '2024-09-01', '2025-09-30', 80000, 'MYR',
   'Youth aged 15–25 from B40 families; targeting 200 trainees in first year.',
   'active', true),

  -- Org 3 (Wakaf Masjid Ar-Rahman) — 2 more projects
  (p3b, org3,
   'Community Medical Clinic Renovation',
   'Renovate the waqf-owned community medical clinic to expand consultation capacity.',
   'Full interior renovation including new consultation rooms and accessibility improvements.',
   'Jelutong, Pulau Pinang',
   '2025-03-01', '2025-08-31', 65000, 'MYR',
   'Low-income community members in Jelutong; 250+ patients per month.',
   'active', true),

  (p3c, org3,
   'Waqf Student Hostel — Phase 2',
   'Construct an additional 40-room student hostel block on waqf land.',
   'Phase 2 expansion of the waqf student hostel. Construction commenced January 2025.',
   'George Town, Pulau Pinang',
   '2025-01-01', '2025-12-31', 180000, 'MYR',
   'University students from B40 families; targeting 120 beneficiaries upon completion.',
   'active', true),

  -- Org 4 (Mosque — draft project)
  (p4a, org4,
   'Masjid Community Hall Renovation',
   'Renovate the community hall to accommodate welfare programmes and Quran classes.',
   'Draft project pending org approval.',
   'Bentong, Pahang',
   null, null, 45000, 'MYR',
   'Community members and students in Bentong, Pahang.',
   'draft', false)

on conflict (id) do nothing;

-- ================================================================
-- 6. NEW REPORTS
-- ================================================================
insert into public.project_reports
  (id, organization_id, project_id, title, report_body, report_date,
   submission_status, verification_status,
   submitted_at, verified_at, verified_by_user_id)
values

  -- Org1/p1a: January Food Aid (verified)
  (r1a1, org1, p1a,
   'January 2025 — B40 Food Aid Report',
   '{"narrative":"Food baskets distributed to 80 registered households every Saturday in January 2025. Total 4 distribution days, 320 baskets delivered. Two new families referred by Jabatan Kebajikan Masyarakat. Volunteer count: 8.","beneficiary_count":320,"total_spend":4200,"milestones":["80 households served","320 baskets delivered","2 new families registered"]}',
   '2025-01-31',
   'submitted', 'verified',
   now() - interval '45 days', now() - interval '40 days', uid_rev2),

  -- Org1/p1a: February Food Aid (submitted, pending)
  (r1a2, org1, p1a,
   'February 2025 — B40 Food Aid Report',
   '{"narrative":"February distribution completed. 82 households served (2 new additions). 328 baskets delivered. Community kitchen event held 15 February with 60 attendees. Volunteer count increased to 12.","beneficiary_count":328,"total_spend":4350,"milestones":["82 households served (+2 new)","328 baskets","Community kitchen event"]}',
   '2025-02-28',
   'submitted', 'pending',
   now() - interval '10 days', null, null),

  -- Org1/p1b: Skills Training Inception (verified)
  (r1b1, org1, p1b,
   'Inception Report — Skills Training Batch 2',
   '{"narrative":"25 trainees enrolled and orientation completed. Classes commenced 3 February 2025. Three trainers engaged. Baking and tailoring classes at 80% attendance. Electrical work class begins March.","beneficiary_count":25,"total_spend":8500,"milestones":["25 trainees enrolled","Orientation done","3 trainers engaged","Classes commenced"]}',
   '2025-02-28',
   'submitted', 'verified',
   now() - interval '30 days', now() - interval '25 days', uid_rev2),

  -- Org2/p2a: Annual 2024 (verified)
  (r2a1, org2, p2a,
   'Annual Scholarship Report 2024',
   '{"narrative":"50 scholars selected through rigorous means-testing and academic merit review. All payments disbursed in two tranches. 94% of scholars maintained CGPA above 3.0. Two scholars withdrew and funds reallocated.","beneficiary_count":50,"total_spend":215000,"milestones":["50 scholars selected","94% retention rate","Payments disbursed","End-year report filed with ROS"]}',
   '2024-12-31',
   'submitted', 'verified',
   now() - interval '70 days', now() - interval '65 days', uid_rev1),

  -- Org2/p2a: Q1 2025 (submitted, pending)
  (r2a2, org2, p2a,
   'Q1 2025 Scholarship Disbursement Report',
   '{"narrative":"New 2025 cohort of 50 scholars selected and onboarded. First tranche payments disbursed to all 50 scholars by 15 February 2025. Orientation programme conducted 8 February with 48 scholars attending.","beneficiary_count":50,"total_spend":67500,"milestones":["50 scholars selected","Orientation completed","First tranche disbursed"]}',
   '2025-03-31',
   'submitted', 'pending',
   now() - interval '8 days', null, null),

  -- Org2/p2b: Digital Centre Inception (verified)
  (r2b1, org2, p2b,
   'Digital Learning Centre — Inception Report',
   '{"narrative":"Premises renovation completed September 2024. 30 computer stations installed. Three certified trainers recruited. First batch of 25 trainees enrolled for October 2024. All from B40 households in Setapak.","beneficiary_count":25,"total_spend":72000,"milestones":["Premises ready","30 computers installed","3 trainers","First batch enrolled"]}',
   '2024-10-31',
   'submitted', 'verified',
   now() - interval '110 days', now() - interval '105 days', uid_rev1),

  -- Org3/p3b: Medical Clinic Mid-project (verified)
  (r3b1, org3, p3b,
   'Mid-Project Report — Community Medical Clinic Renovation',
   '{"narrative":"Demolition and structural reinforcement complete. New consultation rooms fitted. Accessibility ramp installed. Electrical rewiring 90% done. Equipment installation scheduled for July 2025.","beneficiary_count":0,"total_spend":38000,"completion_pct":58,"milestones":["Demolition done","New rooms fitted","Accessibility ramp","Rewiring near complete"]}',
   '2025-05-31',
   'submitted', 'verified',
   now() - interval '60 days', now() - interval '55 days', uid_rev1),

  -- Org3/p3c: Hostel Q1 2025 (verified)
  (r3c1, org3, p3c,
   'Q1 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"Foundation and ground floor structural works completed on schedule. MAINPP inspection conducted 28 March 2025 with no major findings.","beneficiary_count":0,"total_spend":42000,"completion_pct":23,"milestones":["Foundation completed","Ground floor columns poured","Building permit renewed"]}',
   '2025-03-31',
   'submitted', 'verified',
   now() - interval '85 days', now() - interval '80 days', uid_rev1),

  -- Org3/p3c: Hostel Q2 2025 (submitted, pending)
  (r3c2, org3, p3c,
   'Q2 2025 Progress Report — Waqf Student Hostel Phase 2',
   '{"narrative":"First and second floor structural works completed. Brick laying and plastering commenced. External scaffolding installed. Sub-contractor delays on electrical conduit resolved mid-June.","beneficiary_count":0,"total_spend":89000,"completion_pct":49,"milestones":["Floors 1-2 structure complete","Brickwork 60% done","Electrical conduit started"]}',
   '2025-06-30',
   'submitted', 'pending',
   now() - interval '3 days', null, null)

on conflict (id) do nothing;

-- ================================================================
-- 7. FINANCIAL SNAPSHOTS (org1 + org2)
-- ================================================================
insert into public.financial_snapshots
  (id, organization_id, period_year, currency, inputs,
   submission_status, verification_status, submitted_at, verified_at)
values

  (fin2, org2, 2024, 'MYR',
   '{"total_income":310000,"donation_income":285000,"grant_income":25000,"program_expenses":255000,"admin_expenses":35000,"surplus":20000,"is_audited":true,"has_annual_report":true,"audit_firm":"Rashdan Partners (AF1024)","notes":"Grant from Yayasan Pendidikan Malaysia Q3 2024. External audit filed with ROS."}',
   'submitted', 'verified',
   now() - interval '55 days', now() - interval '50 days'),

  (fin3, org1, 2024, 'MYR',
   '{"total_income":95000,"donation_income":95000,"program_expenses":78000,"admin_expenses":12000,"surplus":5000,"is_audited":false,"has_annual_report":true,"audit_firm":null,"notes":"Annual report prepared. External audit not yet commissioned — planning to engage auditor for 2024 accounts."}',
   'submitted', 'pending',
   now() - interval '30 days', null)

on conflict (id) do nothing;

-- ================================================================
-- 8. CERTIFICATION — org1 (Silver) + org2 (Gold) + org4 (submitted)
-- ================================================================
insert into public.certification_applications
  (id, organization_id, status, submitted_at, submitted_by_user_id,
   reviewer_assigned_user_id, reviewer_comment)
values
  (ca2, org2, 'approved', now() - interval '65 days', uid_orgadmin, uid_rev1,
   'Strong scholarship impact reporting and financial transparency. Gold Amanah awarded.'),
  (ca3, org1, 'approved', now() - interval '40 days', uid_orgadmin, uid_rev2,
   'Good community impact. Financial audit pending. Governance solid. Silver Amanah awarded.'),
  (ca4, org4, 'submitted', now() - interval '4 days', uid_o4_admin, null, null)
on conflict (id) do nothing;

insert into public.certification_evaluations
  (id, organization_id, certification_application_id, criteria_version,
   total_score, score_breakdown, computed_at, computed_by_user_id)
values
  (ce2, org2, ca2, 'ctcf_v1', 76.0,
   '{"governance":{"score":20,"max":20,"gate_passed":true},"financial":{"score":18,"max":20},"project":{"score":20,"max":25},"impact":{"score":14,"max":20},"shariah":{"score":8,"max":8,"normalized":14},"total":76.0}',
   now() - interval '60 days', uid_rev1),
  (ce3, org1, ca3, 'ctcf_v1', 63.0,
   '{"governance":{"score":20,"max":20,"gate_passed":true},"financial":{"score":12,"max":20},"project":{"score":18,"max":25},"impact":{"score":10,"max":20},"shariah":{"score":5,"max":8,"normalized":9},"total":63.0}',
   now() - interval '35 days', uid_rev2)
on conflict (id) do nothing;

insert into public.certification_history
  (id, organization_id, certification_application_id, evaluation_id,
   previous_status, new_status, valid_from, valid_to,
   decided_by_user_id, decision_reason, decided_at)
values
  (ch2, org2, ca2, ce2, null, 'certified',
   '2025-04-01', '2026-03-31',
   uid_rev1, 'Strong scholarship impact and financial transparency. Gold Amanah awarded.',
   now() - interval '59 days'),
  (ch3, org1, ca3, ce3, null, 'certified',
   '2025-05-01', '2026-04-30',
   uid_rev2, 'Community impact verified, governance solid. Financial audit recommended next cycle. Silver Amanah awarded.',
   now() - interval '34 days')
on conflict (id) do nothing;

-- ================================================================
-- 9. TRUST EVENTS
-- ================================================================
insert into public.trust_events
  (id, organization_id, event_type, event_ref_table, event_ref_id,
   payload, occurred_at, actor_user_id, source, idempotency_key)
values
  (te1, org2, 'certification_updated', 'certification_history', ch2,
   '{"new_status":"certified","grade":"Gold Amanah","score":76.0}',
   now() - interval '59 days', uid_rev1, 'reviewer', 'cert_upd_ch2_seed'),

  (te2, org2, 'report_verified', 'project_reports', r2a1,
   '{"report_title":"Annual Scholarship Report 2024"}',
   now() - interval '65 days', uid_rev1, 'reviewer', 'report_ver_r2a1_seed'),

  (te3, org1, 'certification_updated', 'certification_history', ch3,
   '{"new_status":"certified","grade":"Silver Amanah","score":63.0}',
   now() - interval '34 days', uid_rev2, 'reviewer', 'cert_upd_ch3_seed'),

  (te4, org3, 'report_verified', 'project_reports', r3c1,
   '{"report_title":"Q1 2025 Waqf Student Hostel"}',
   now() - interval '80 days', uid_rev1, 'reviewer', 'report_ver_r3c1_seed')
on conflict (idempotency_key) do nothing;

-- ================================================================
-- 10. AMANAH INDEX HISTORY
-- ================================================================
insert into public.amanah_index_history
  (id, organization_id, score_version, score_value,
   computed_at, breakdown, public_summary)
values
  -- Org3: updated score (was 74.5, now 86.0 after more verifications)
  (ah3b, org3, 'amanah_v1', 86.0,
   now() - interval '20 days',
   '{"governance":100,"financial":90,"project":80,"impact":75,"feedback":70}',
   'Platinum Amanah trust score. Consistent report verification and strong waqf governance.'),

  -- Org2: score history
  (ah2a, org2, 'amanah_v1', 68.0,
   now() - interval '200 days',
   '{"governance":95,"financial":75,"project":70,"impact":60,"feedback":55}',
   'Initial score. Good governance, scholarship programme establishing track record.'),

  (ah2b, org2, 'amanah_v1', 74.5,
   now() - interval '59 days',
   '{"governance":95,"financial":80,"project":78,"impact":65,"feedback":60}',
   'Gold Amanah trust score. Strong scholarship impact documentation and financial transparency.'),

  -- Org1: score history
  (ah1a, org1, 'amanah_v1', 55.0,
   now() - interval '90 days',
   '{"governance":90,"financial":50,"project":65,"impact":50,"feedback":45}',
   'Initial certification. Strong community reach. Financial reporting to be strengthened.'),

  (ah1b, org1, 'amanah_v1', 61.0,
   now() - interval '34 days',
   '{"governance":90,"financial":55,"project":72,"impact":55,"feedback":50}',
   'Silver Amanah trust score. Community impact verified. Financial audit recommended.')

on conflict (id) do nothing;

-- ================================================================
-- 11. NEW DONATIONS
-- ================================================================
insert into public.donation_transactions
  (id, organization_id, project_id, donor_user_id, donor_email,
   amount, platform_fee_amount, currency, status, gateway,
   gateway_checkout_id, gateway_transaction_id,
   initiated_at, confirmed_at)
values
  -- Org3 more donations
  (don3, org3, p3c, uid_donor2, 'suria@email.com',
   250, 5, 'MYR', 'confirmed', 'toyyibpay', 'TPY-003', 'TRX-003',
   now() - interval '20 days', now() - interval '20 days' + interval '3 minutes'),

  (don4, org3, p3b, uid_donor3, 'zainab@email.com',
   50, 1, 'MYR', 'confirmed', 'toyyibpay', 'TPY-004', 'TRX-004',
   now() - interval '10 days', now() - interval '10 days' + interval '4 minutes'),

  -- Org2 donations
  (don5, org2, p2a, uid_donor1, 'donor@agp.test',
   500, 10, 'MYR', 'confirmed', 'toyyibpay', 'TPY-005', 'TRX-005',
   now() - interval '30 days', now() - interval '30 days' + interval '5 minutes'),

  (don6, org2, p2a, uid_donor2, 'suria@email.com',
   150, 3, 'MYR', 'confirmed', 'toyyibpay', 'TPY-006', 'TRX-006',
   now() - interval '12 days', now() - interval '12 days' + interval '4 minutes'),

  -- Org1 donations
  (don7, org1, p1a, uid_donor3, 'zainab@email.com',
   75, 1.5, 'MYR', 'confirmed', 'toyyibpay', 'TPY-007', 'TRX-007',
   now() - interval '8 days', now() - interval '8 days' + interval '3 minutes'),

  (don8, org1, p1a, uid_donor2, 'suria@email.com',
   30, 0.6, 'MYR', 'confirmed', 'toyyibpay', 'TPY-008', 'TRX-008',
   now() - interval '2 days', now() - interval '2 days' + interval '5 minutes')

on conflict (id) do nothing;

-- ================================================================
-- 12. SCHOLAR NOTES
-- ================================================================
insert into public.scholar_notes
  (id, organization_id, author_user_id, note_body, is_publishable, published_at)
values
  (sn1, org3, uid_scholar,
   'Waqf governance structure is sound and MAINPP oversight is active and well-documented. The organization demonstrates strong adherence to contemporary fiqh al-waqf. Recommend the organization archive Shariah compliance review minutes annually for CTCF Layer 5 continuity.',
   true, now() - interval '79 days'),

  (sn2, org2, uid_scholar,
   'Scholarship selection process reviewed. Means-testing methodology aligns with zakat eligibility principles, which is commendable even for sadaqah-funded programmes. Recommend the organization formalize a Shariah advisory note on treatment of PTPTN loan recipients as eligible beneficiaries.',
   true, now() - interval '59 days')
on conflict (id) do nothing;

-- ================================================================
-- 13. AUDIT LOGS (key events)
-- ================================================================
insert into public.audit_logs
  (actor_user_id, actor_role, organization_id, action,
   entity_table, entity_id, metadata, occurred_at)
values
  (uid_rev2, 'reviewer', org1, 'ORG_APPROVED', 'organizations', org1,
   '{"decision":"approved","listing_status":"listed"}', now() - interval '80 days'),

  (uid_rev1, 'reviewer', org2, 'ORG_APPROVED', 'organizations', org2,
   '{"decision":"approved","listing_status":"listed"}', now() - interval '110 days'),

  (uid_rev1, 'reviewer', org2, 'CERTIFICATION_APPROVED', 'certification_history', ch2,
   '{"grade":"Gold Amanah","score":76.0}', now() - interval '59 days'),

  (uid_rev2, 'reviewer', org1, 'CERTIFICATION_APPROVED', 'certification_history', ch3,
   '{"grade":"Silver Amanah","score":63.0}', now() - interval '34 days'),

  (uid_orgadmin, 'org_admin', org2, 'PROJECT_CREATED', 'projects', p2a,
   '{"title":"Education Scholarship Fund 2025"}', now() - interval '108 days'),

  (uid_orgadmin, 'org_admin', org1, 'PROJECT_CREATED', 'projects', p1a,
   '{"title":"B40 Food Aid Programme"}', now() - interval '78 days');

end $$;
