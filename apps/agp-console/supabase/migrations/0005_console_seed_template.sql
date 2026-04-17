-- Replace this UUID with your real user ID from Supabase Auth > Users.
insert into public.platform_user_roles (user_id, role)
values ('YOUR_USER_UUID_HERE', 'platform_owner')
on conflict do nothing;

-- Optional starter organisations so the UI does not look empty.
insert into public.organisations (legal_name, registration_number, organisation_type, status)
values
  ('Pertubuhan Amanah Kasih', 'PPM-001-2026', 'NGO', 'active'),
  ('Yayasan Wakaf Ummah', 'YWM-002-2026', 'Foundation', 'draft')
on conflict do nothing;
