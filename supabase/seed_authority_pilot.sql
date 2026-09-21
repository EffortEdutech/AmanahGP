-- supabase/seed_authority_pilot.sql
-- Deterministic MAIN/JAIN pilot fixtures for Phase 11.
-- Safe to rerun after migrations 0059-0067. Uses summary/link tables only for authority-visible data.

begin;

insert into public.users (id, auth_provider, auth_provider_user_id, email, display_name, platform_role, is_active)
values
  ('71000000-0000-0000-0000-000000000001', 'supabase', 'seed-main-officer-admin', 'pegawai.main@agp.test', 'Pegawai MAIN Pilot', 'reviewer', true),
  ('71000000-0000-0000-0000-000000000002', 'supabase', 'seed-main-officer-reviewer', 'reviewer.main@agp.test', 'Reviewer MAIN Pilot', 'reviewer', true),
  ('71000000-0000-0000-0000-000000000101', 'supabase', 'seed-masjid-nur-admin', 'admin@masjidnur.agp.test', 'Admin Masjid Nur', 'donor', true),
  ('71000000-0000-0000-0000-000000000102', 'supabase', 'seed-surau-amanah-admin', 'admin@surauamanah.agp.test', 'Admin Surau Amanah', 'donor', true),
  ('71000000-0000-0000-0000-000000000103', 'supabase', 'seed-masjid-hidayah-admin', 'admin@masjidhidayah.agp.test', 'Admin Masjid Hidayah', 'donor', true)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  platform_role = excluded.platform_role,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.authorities (id, name, short_name, authority_type, country, state, status, contact_email, metadata, created_by_user_id)
values (
  '72000000-0000-0000-0000-000000000001',
  'Majlis Agama Islam Negeri Pilot',
  'MAIN Pilot',
  'main_jain',
  'MY',
  'Selangor',
  'active',
  'pegawai.main@agp.test',
  '{"fixture":"phase11","pilot":"main-jain"}'::jsonb,
  '71000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.jurisdictions (id, authority_id, code, name, jurisdiction_type, country, state, status, metadata)
values (
  '72000000-0000-0000-0000-000000000101',
  '72000000-0000-0000-0000-000000000001',
  'MY-10-PILOT',
  'Selangor MAIN Pilot Jurisdiction',
  'state',
  'MY',
  'Selangor',
  'active',
  '{"fixture":"phase11"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.authority_members (id, authority_id, user_id, role, status, title, accepted_at)
values
  ('72000000-0000-0000-0000-000000000201', '72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'authority_admin', 'active', 'Pilot Authority Admin', now()),
  ('72000000-0000-0000-0000-000000000202', '72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', 'authority_reviewer', 'active', 'Pilot Authority Reviewer', now())
on conflict (id) do update set
  role = excluded.role,
  status = excluded.status,
  title = excluded.title,
  updated_at = now();

insert into public.authority_jurisdiction_assignments (id, authority_member_id, authority_id, jurisdiction_id, scope_type, status, assigned_by_user_id)
values
  ('72000000-0000-0000-0000-000000000301', '72000000-0000-0000-0000-000000000201', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', 'admin', 'active', '71000000-0000-0000-0000-000000000001'),
  ('72000000-0000-0000-0000-000000000302', '72000000-0000-0000-0000-000000000202', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', 'review', 'active', '71000000-0000-0000-0000-000000000001')
on conflict (id) do update set
  scope_type = excluded.scope_type,
  status = excluded.status,
  updated_at = now();

insert into public.organizations (id, name, legal_name, registration_no, country, state, org_type, oversight_authority, fund_types, summary, onboarding_status, listing_status, data_origin, approved_at, created_at, updated_at)
values
  ('73000000-0000-0000-0000-000000000101', 'Masjid Nur Al-Amanah', 'Masjid Nur Al-Amanah', 'PILOT-MASJID-001', 'MY', 'Selangor', 'mosque_surau', 'MAIN Pilot', array['zakat','sadaqah','general'], 'Pilot mosque for monthly authority reporting.', 'approved', 'listed', 'seed', now() - interval '90 days', now() - interval '100 days', now()),
  ('73000000-0000-0000-0000-000000000102', 'Surau Amanah Bestari', 'Surau Amanah Bestari', 'PILOT-SURAU-002', 'MY', 'Selangor', 'mosque_surau', 'MAIN Pilot', array['sadaqah','general'], 'Pilot surau for obligation and exception monitoring.', 'approved', 'listed', 'seed', now() - interval '80 days', now() - interval '95 days', now()),
  ('73000000-0000-0000-0000-000000000103', 'Masjid Hidayah Waqf', 'Masjid Hidayah Waqf', 'PILOT-MASJID-003', 'MY', 'Selangor', 'mosque_surau', 'MAIN Pilot', array['waqf','sadaqah','general'], 'Pilot mosque for evidence boundary and KPI testing.', 'approved', 'listed', 'seed', now() - interval '70 days', now() - interval '90 days', now())
on conflict (id) do update set
  name = excluded.name,
  legal_name = excluded.legal_name,
  registration_no = excluded.registration_no,
  org_type = excluded.org_type,
  oversight_authority = excluded.oversight_authority,
  fund_types = excluded.fund_types,
  summary = excluded.summary,
  onboarding_status = excluded.onboarding_status,
  listing_status = excluded.listing_status,
  data_origin = excluded.data_origin,
  updated_at = now();

insert into public.pilot_cohorts (id, authority_id, jurisdiction_id, cohort_code, name, description, status, starts_on, ends_on, metadata, created_by_user_id)
values (
  '72000000-0000-0000-0000-000000000401',
  '72000000-0000-0000-0000-000000000001',
  '72000000-0000-0000-0000-000000000101',
  'MAIN-PILOT-2026-Q3',
  'MAIN/JAIN Authority View Pilot Q3 2026',
  'Deterministic Phase 11 pilot cohort for Authority View MVP acceptance.',
  'active',
  '2026-07-01',
  '2026-12-31',
  '{"fixture":"phase11","acceptance_scenarios":14}'::jsonb,
  '71000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.pilot_cohort_organizations (id, cohort_id, organization_id, jurisdiction_id, status, onboarded_at, notes, metadata)
values
  ('72000000-0000-0000-0000-000000000501', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000101', 'active', now() - interval '60 days', 'Pilot org 1', '{"fixture":"phase11"}'::jsonb),
  ('72000000-0000-0000-0000-000000000502', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000101', 'active', now() - interval '55 days', 'Pilot org 2', '{"fixture":"phase11"}'::jsonb),
  ('72000000-0000-0000-0000-000000000503', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000101', 'active', now() - interval '50 days', 'Pilot org 3', '{"fixture":"phase11"}'::jsonb)
on conflict (id) do update set
  status = excluded.status,
  notes = excluded.notes,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.regulatory_submissions (id, authority_id, jurisdiction_id, organization_id, pilot_cohort_id, source_table, source_id, submission_type, submission_ref, title, period_start, period_end, due_on, submitted_at, submitted_by_user_id, status, review_status, late_status, frozen_source, metadata)
values
  ('74000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', 'manual', null, 'annual_return', 'PILOT-SUB-001', 'July pilot monthly report', '2026-07-01', '2026-07-31', '2026-08-15', '2026-08-10 09:00:00+08', '71000000-0000-0000-0000-000000000101', 'accepted', 'accepted', 'on_time', '{"fixture":"phase11","report":"monthly"}'::jsonb, '{"acceptance":"AV-04"}'::jsonb),
  ('74000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000401', 'manual', null, 'annual_return', 'PILOT-SUB-002', 'July pilot report changes requested', '2026-07-01', '2026-07-31', '2026-08-15', '2026-08-20 11:00:00+08', '71000000-0000-0000-0000-000000000102', 'changes_requested', 'changes_requested', 'late', '{"fixture":"phase11","report":"monthly"}'::jsonb, '{"acceptance":"AV-04"}'::jsonb),
  ('74000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000401', 'manual', null, 'audit_report', 'PILOT-SUB-003', 'Audit evidence pack', '2026-07-01', '2026-07-31', '2026-08-15', null, '71000000-0000-0000-0000-000000000103', 'submitted', 'pending', 'overdue', '{"fixture":"phase11","report":"audit"}'::jsonb, '{"acceptance":"AV-04"}'::jsonb)
on conflict (id) do update set
  status = excluded.status,
  review_status = excluded.review_status,
  late_status = excluded.late_status,
  frozen_source = excluded.frozen_source,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.authority_obligations (id, authority_id, jurisdiction_id, organization_id, pilot_cohort_id, regulatory_submission_id, obligation_type, obligation_ref, title, description, due_on, status, priority, source_table, source_id, metadata)
values
  ('75000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '74000000-0000-0000-0000-000000000101', 'submission_due', 'PILOT-OBL-001', 'Accepted report archived', 'Accepted pilot submission retained for authority review.', '2026-08-15', 'satisfied', 'medium', 'regulatory_submissions', '74000000-0000-0000-0000-000000000101', '{"acceptance":"AV-05"}'::jsonb),
  ('75000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000401', '74000000-0000-0000-0000-000000000102', 'review_response_due', 'PILOT-OBL-002', 'Respond to changes requested', 'Authority requested correction for late pilot report.', '2026-08-25', 'open', 'high', 'regulatory_submissions', '74000000-0000-0000-0000-000000000102', '{"acceptance":"AV-05"}'::jsonb),
  ('75000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000401', '74000000-0000-0000-0000-000000000103', 'submission_due', 'PILOT-OBL-003', 'Audit evidence overdue', 'Audit evidence pack has not been accepted.', '2026-08-15', 'overdue', 'urgent', 'regulatory_submissions', '74000000-0000-0000-0000-000000000103', '{"acceptance":"AV-05"}'::jsonb)
on conflict (id) do update set
  status = excluded.status,
  priority = excluded.priority,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.authority_exceptions (id, authority_id, jurisdiction_id, organization_id, pilot_cohort_id, obligation_id, regulatory_submission_id, exception_type, exception_ref, title, description, severity, status, source_table, source_id, detected_at, metadata)
values
  ('76000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000401', '75000000-0000-0000-0000-000000000102', '74000000-0000-0000-0000-000000000102', 'late_submission', 'PILOT-EXC-001', 'Late pilot submission', 'Submitted five days after authority deadline.', 'medium', 'open', 'regulatory_submissions', '74000000-0000-0000-0000-000000000102', '2026-08-20 11:00:00+08', '{"acceptance":"AV-06"}'::jsonb),
  ('76000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000401', '75000000-0000-0000-0000-000000000103', '74000000-0000-0000-0000-000000000103', 'overdue_obligation', 'PILOT-EXC-002', 'Audit pack overdue', 'Audit evidence pack requires authority attention.', 'high', 'action_required', 'regulatory_submissions', '74000000-0000-0000-0000-000000000103', '2026-08-16 08:30:00+08', '{"acceptance":"AV-06"}'::jsonb)
on conflict (id) do update set
  severity = excluded.severity,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.authority_evidence_links (id, authority_id, jurisdiction_id, organization_id, pilot_cohort_id, regulatory_submission_id, authority_obligation_id, authority_exception_id, source_table, source_id, evidence_ref, title, description, evidence_kind, visibility_scope, review_status, linked_by_user_id, metadata)
values
  ('77000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '74000000-0000-0000-0000-000000000101', '75000000-0000-0000-0000-000000000101', null, 'manual', null, 'PILOT-EVD-001', 'Monthly statement summary', 'Summary evidence linked for authority review.', 'report_evidence', 'authority_reviewable', 'accepted', '71000000-0000-0000-0000-000000000001', '{"source_access":"not_granted_by_link","acceptance":"AV-08"}'::jsonb),
  ('77000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000103', '72000000-0000-0000-0000-000000000401', '74000000-0000-0000-0000-000000000103', '75000000-0000-0000-0000-000000000103', '76000000-0000-0000-0000-000000000102', 'manual', null, 'PILOT-EVD-002', 'Audit evidence request', 'Evidence request exists without raw private file exposure.', 'supporting_document', 'authority_reviewable', 'under_review', '71000000-0000-0000-0000-000000000002', '{"source_access":"not_granted_by_link","acceptance":"AV-08"}'::jsonb)
on conflict (id) do update set
  title = excluded.title,
  visibility_scope = excluded.visibility_scope,
  review_status = excluded.review_status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.authority_state_report_packs (id, authority_id, jurisdiction_id, organization_id, pilot_cohort_id, report_ref, report_type, period_year, period_month, status, currency, total_receipts, total_expenditure, net_movement, bank_accounts_total, bank_accounts_reconciled, bank_accounts_discrepancy, bank_difference_total, fund_balance_total, exception_total, exception_high_critical, evidence_link_total, evidence_reviewable_total, source_summary, generated_by_user_id)
values
  ('78000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', 'SRP-2026-07-MASJID-NUR', 'monthly_state_pack', 2026, 7, 'generated', 'MYR', 42000, 31500, 10500, 2, 2, 0, 0, 88500, 0, 0, 1, 1, '{"totals_reconcile":true,"source_access":"summary_only_no_authority_ledger_access"}'::jsonb, '71000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '73000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000401', 'SRP-2026-07-SURAU-AMANAH', 'monthly_state_pack', 2026, 7, 'generated', 'MYR', 18500, 20100, -1600, 1, 0, 1, 1600, 14200, 1, 0, 0, 0, '{"totals_reconcile":true,"source_access":"summary_only_no_authority_ledger_access"}'::jsonb, '71000000-0000-0000-0000-000000000001')
on conflict (id) do update set
  status = excluded.status,
  total_receipts = excluded.total_receipts,
  total_expenditure = excluded.total_expenditure,
  net_movement = excluded.net_movement,
  source_summary = excluded.source_summary,
  updated_at = now();

insert into public.authority_state_report_lines (state_report_pack_id, authority_id, organization_id, line_category, line_label, line_key, amount, count_value, status, metadata, sort_order)
values
  ('78000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000101', 'reconciliation_check', 'Report totals reconcile', 'totals_reconcile', null, 1, 'pass', '{"acceptance":"AV-10"}'::jsonb, 10),
  ('78000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000102', 'bank_reconciliation', 'Bank discrepancy', 'bank_accounts_discrepancy', 1600, 1, 'exception', '{"acceptance":"AV-10"}'::jsonb, 20)
on conflict (state_report_pack_id, line_category, line_key) do update set
  amount = excluded.amount,
  count_value = excluded.count_value,
  status = excluded.status,
  metadata = excluded.metadata;

insert into public.pilot_feedback (id, authority_id, jurisdiction_id, pilot_cohort_id, organization_id, submitted_by_user_id, respondent_role, feedback_type, rating, sentiment, title, body, status, submitted_at, metadata)
values
  ('79000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000101', 'organization_user', 'reporting', 4, 'positive', 'Monthly pack is clear', 'State pack summary matches mosque committee expectation.', 'closed', '2026-08-18 10:00:00+08', '{"acceptance":"Phase10"}'::jsonb),
  ('79000000-0000-0000-0000-000000000102', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000102', '71000000-0000-0000-0000-000000000102', 'organization_user', 'training', 3, 'mixed', 'Need training on evidence links', 'Officer requested extra training for evidence boundary workflow.', 'triaged', '2026-08-19 14:00:00+08', '{"acceptance":"Phase10"}'::jsonb)
on conflict (id) do update set
  rating = excluded.rating,
  sentiment = excluded.sentiment,
  status = excluded.status,
  updated_at = now();

insert into public.pilot_support_incidents (id, authority_id, jurisdiction_id, pilot_cohort_id, organization_id, opened_by_user_id, incident_ref, incident_type, severity, status, title, description, opened_at, first_response_at, resolved_at, resolution_note, metadata)
values
  ('79000000-0000-0000-0000-000000000201', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000102', '71000000-0000-0000-0000-000000000102', 'PILOT-SUP-001', 'training_need', 'medium', 'in_progress', 'Submission correction walkthrough', 'Organisation needs help responding to changes requested.', '2026-08-20 09:00:00+08', '2026-08-20 10:00:00+08', null, null, '{"acceptance":"Phase10"}'::jsonb),
  ('79000000-0000-0000-0000-000000000202', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000101', 'PILOT-SUP-002', 'access_issue', 'low', 'resolved', 'Authority reviewer login confirmed', 'Reviewer access confirmed for scoped pilot dashboard.', '2026-08-12 09:00:00+08', '2026-08-12 09:30:00+08', '2026-08-12 11:00:00+08', 'Resolved by confirming authority membership scope.', '{"acceptance":"Phase10"}'::jsonb)
on conflict (id) do update set
  severity = excluded.severity,
  status = excluded.status,
  updated_at = now();

insert into public.pilot_metric_events (id, authority_id, jurisdiction_id, pilot_cohort_id, organization_id, actor_user_id, metric_key, metric_category, metric_value, unit, event_source, source_table, source_id, occurred_at, metadata)
values
  ('79000000-0000-0000-0000-000000000301', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000101', 'submission_accepted', 'reporting', 1, 'count', 'submission', 'regulatory_submissions', '74000000-0000-0000-0000-000000000101', '2026-08-10 09:00:00+08', '{"acceptance":"Phase11"}'::jsonb),
  ('79000000-0000-0000-0000-000000000302', '72000000-0000-0000-0000-000000000001', '72000000-0000-0000-0000-000000000101', '72000000-0000-0000-0000-000000000401', '73000000-0000-0000-0000-000000000102', '71000000-0000-0000-0000-000000000102', 'support_training_needed', 'support', 1, 'count', 'support', 'pilot_support_incidents', '79000000-0000-0000-0000-000000000201', '2026-08-20 09:00:00+08', '{"acceptance":"Phase11"}'::jsonb)
on conflict (id) do update set
  metric_value = excluded.metric_value,
  metadata = excluded.metadata;

insert into public.pilot_kpi_snapshots (id, authority_id, jurisdiction_id, pilot_cohort_id, snapshot_ref, period_start, period_end, status, organizations_total, organizations_active, submissions_total, submissions_accepted, submissions_late_or_overdue, obligations_total, obligations_overdue, exceptions_total, exceptions_high_critical, evidence_links_total, state_report_packs_total, feedback_total, feedback_average_rating, support_incidents_total, support_incidents_open, support_incidents_resolved, metric_events_total, kpi_payload, generated_by_user_id)
values (
  '79000000-0000-0000-0000-000000000401',
  '72000000-0000-0000-0000-000000000001',
  '72000000-0000-0000-0000-000000000101',
  '72000000-0000-0000-0000-000000000401',
  'KPI-MAIN-PILOT-2026-08',
  '2026-08-01',
  '2026-08-31',
  'generated',
  3,
  3,
  3,
  1,
  2,
  3,
  1,
  2,
  1,
  2,
  2,
  2,
  3.50,
  2,
  1,
  1,
  2,
  '{"source_access":"summary_only_pilot_kpi","acceptance":"scenario-14"}'::jsonb,
  '71000000-0000-0000-0000-000000000001'
)
on conflict (id) do update set
  organizations_active = excluded.organizations_active,
  submissions_total = excluded.submissions_total,
  support_incidents_open = excluded.support_incidents_open,
  feedback_average_rating = excluded.feedback_average_rating,
  kpi_payload = excluded.kpi_payload,
  updated_at = now();

commit;
