-- 0056_console_platform_role_enum_review_roles.sql
-- Run this separately before 0057 if these enum values do not exist yet.

alter type public.platform_role add value if not exists 'platform_reviewer';
alter type public.platform_role add value if not exists 'platform_scholar';
alter type public.platform_role add value if not exists 'platform_approver';
