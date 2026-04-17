-- Run this first in Supabase SQL Editor if you want to inspect current data
-- before adding a future hard database constraint.

select
  organisation_type,
  count(*) as total_rows
from public.organisations
group by organisation_type
order by total_rows desc, organisation_type asc;
