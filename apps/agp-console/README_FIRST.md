# AGP Console — Step 02 Starter Pack

This zip is meant to be extracted into the repo root.

## Your port
Use **3303** for AGP Console.

## Before you run
Clean these files inside `apps/agp-console` because `create-next-app` created a mini workspace inside the app:

Delete if present:
- `apps/agp-console/pnpm-workspace.yaml`
- `apps/agp-console/pnpm-lock.yaml`
- `apps/agp-console/.next`

Optional cleanup:
- `apps/agp-console/AGENTS.md`
- `apps/agp-console/CLAUDE.md`

## Environment
Create `apps/agp-console/.env.local` using `.env.local.example` in this pack.

Important:
- keep `NEXT_PUBLIC_SUPABASE_URL`
- keep `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- set `NEXT_PUBLIC_APP_URL=http://localhost:3303`
- do **not** put service-role key here for now

## package.json change
In `apps/agp-console/package.json`, make sure your dev script uses port 3303.

Example:
```json
"scripts": {
  "dev": "next dev --turbopack -p 3303",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

If your `dev` script is just `next dev`, change it to the line above.

## Run
From repo root:

```powershell
pnpm install
pnpm -C apps/agp-console dev
```

Open:

```text
http://localhost:3303
```

## What this pack gives you
- root redirect to `/dashboard`
- basic Console layout
- sidebar
- placeholder pages:
  - Dashboard
  - Organisations
  - Plans
  - Audit Log
  - Settings

