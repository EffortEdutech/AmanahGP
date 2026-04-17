-- STEP 10 OPTIONAL HELPER
-- This file is NOT required for the app to run.
-- Use it only if you want to inspect or manually test platform roles.

-- 1) See current platform roles
select *
from public.platform_user_roles
order by created_at desc;

-- 2) Find a user id from auth.users by email
select id, email
from auth.users
order by created_at desc;

-- 3) Example: assign a role to a user
-- Replace the UUID and role value before running.
-- insert into public.platform_user_roles (user_id, role, is_active)
-- values ('00000000-0000-0000-0000-000000000000', 'platform_admin', true)
-- on conflict (user_id, role)
-- do update set is_active = true;

-- 4) Example: deactivate a role
-- update public.platform_user_roles
-- set is_active = false
-- where user_id = '00000000-0000-0000-0000-000000000000'
--   and role = 'support_agent';
