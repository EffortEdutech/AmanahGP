-- Step 08: organisation type lookup for AGP Console
-- Safe migration: creates canonical preset values for organisation typing.
-- We do NOT add a hard FK yet because existing legacy rows may still contain free-text values.

create table if not exists public.organisation_types (
  code text primary key,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

insert into public.organisation_types (code, label, description, sort_order)
values
  ('ngo', 'NGO', 'General nonprofit, association, charity, or community body.', 10),
  ('mosque_surau', 'Mosque / Surau', 'Masjid, surau, musolla, or related place-of-worship institution.', 20),
  ('waqf_institution', 'Waqf Institution', 'Entity managing waqf assets, waqf projects, or endowment activities.', 30),
  ('zakat_body', 'Zakat Body', 'Organisation responsible for zakat collection, administration, or distribution.', 40),
  ('foundation', 'Foundation', 'Foundation, trust, or philanthropic institution with its own legal structure.', 50),
  ('cooperative', 'Cooperative', 'Cooperative or member-based institution operating under a cooperative model.', 60),
  ('other', 'Other', 'Use only when none of the standard AGP organisation categories apply.', 999)
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

comment on table public.organisation_types is
  'Canonical organisation type lookup for AGP Console and future org processing.';
