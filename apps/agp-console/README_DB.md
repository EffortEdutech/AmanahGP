# AGP Console — Step 05 Database Foundation Pack

This pack adds the first real Console database foundation:
- platform roles table
- organisations table
- helper SQL functions
- RLS policies
- starter seed SQL
- live dashboard counts
- live organisations page
- role badge in header

## Apply order
Run these SQL files in this exact order:

1. `supabase/migrations/0003_console_platform_core.sql`
2. `supabase/migrations/0004_console_platform_rls.sql`
3. `supabase/migrations/0005_console_seed_template.sql`

## Important for seed file
In `0005_console_seed_template.sql`, replace:

```sql
YOUR_USER_UUID_HERE
```

with your real Supabase Auth user UUID.

The easiest way:
- Supabase Dashboard
- Authentication
- Users
- copy your user ID

## After SQL is applied
Run:

```powershell
pnpm -C apps/agp-console dev
```

Then open:

```text
http://localhost:3303/dashboard
http://localhost:3303/organisations
```

