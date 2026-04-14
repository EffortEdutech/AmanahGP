# AmanahGP — Git Tag: Phase 1 Complete

**Purpose:** Preserve the exact state of Sprints 1–12 before the Phase 2 / amanahOS refactor begins.  
**Tag name:** `v0.1.0-phase1-complete`  
**Branch:** `main` (run this while on main, after confirming everything is pushed)

---

## Step 1 — Confirm your repo is clean and pushed

Open PowerShell in your repo root:

```powershell
cd "C:\PATH\TO\AmanahGP"

# Check current branch
git branch

# Confirm no uncommitted changes
git status

# Pull latest to make sure main is up to date
git pull origin main
```

Expected output from `git status`:
```
On branch main
nothing to commit, working tree clean
```

If there are uncommitted changes, commit them first:

```powershell
git add .
git commit -m "chore: finalise Sprint 12 before Phase 2 refactor"
git push origin main
```

---

## Step 2 — Create the annotated tag

```powershell
git tag -a v0.1.0-phase1-complete -m "Phase 1 complete — Sprints 0-12. AmanahHub + AmanahHub Console. CTCF + Amanah Index engines. Vercel deployed. Pre-amanahOS refactor snapshot."
```

---

## Step 3 — Push the tag to GitHub

```powershell
git push origin v0.1.0-phase1-complete
```

---

## Step 4 — Verify the tag exists on GitHub

```powershell
git tag -l
```

You should see `v0.1.0-phase1-complete` in the list.

Also verify on GitHub:
- Go to `https://github.com/EffortEdutech/AmanahGP`
- Click **Releases** or **Tags**
- Confirm `v0.1.0-phase1-complete` appears with the annotation message

---

## Step 5 — Create the Phase 2 branch

All Phase 2 work (amanahOS scaffold, fund accounting, console refactor) happens on a dedicated branch. `main` stays deployed and stable.

```powershell
# Create and switch to Phase 2 branch
git checkout -b phase2/amanahOS-scaffold

# Push the branch to GitHub
git push -u origin phase2/amanahOS-scaffold
```

From this point forward:
- All Phase 2 work commits to `phase2/amanahOS-scaffold`
- Merge to `main` only when a full sprint is stable and tested
- Vercel continues serving `main` (Phase 1 live) while Phase 2 builds

---

## Recovery — how to return to Phase 1 state at any time

If Phase 2 work breaks something and you need to return to the known-good state:

```powershell
# Option 1: Switch back to main
git checkout main

# Option 2: Create a fresh branch from the Phase 1 tag
git checkout -b hotfix/from-phase1 v0.1.0-phase1-complete
```

---

## Tag summary

| Field         | Value                                                                          |
|---------------|--------------------------------------------------------------------------------|
| Tag           | `v0.1.0-phase1-complete`                                                      |
| Type          | Annotated (stores author, date, message)                                       |
| Branch        | `main`                                                                         |
| What it marks | End of Sprints 0–12. Last stable state before amanahOS architecture expansion |
| Phase 2 branch| `phase2/amanahOS-scaffold`                                                    |

---

## Full command sequence (copy-paste block)

```powershell
# Run this entire block from your repo root

git checkout main
git pull origin main
git status

# If clean — tag it
git tag -a v0.1.0-phase1-complete -m "Phase 1 complete — Sprints 0-12. AmanahHub + AmanahHub Console. CTCF + Amanah Index engines. Vercel deployed. Pre-amanahOS refactor snapshot."
git push origin v0.1.0-phase1-complete

# Create Phase 2 working branch
git checkout -b phase2/amanahOS-scaffold
git push -u origin phase2/amanahOS-scaffold

# Confirm
git tag -l
git branch
```

---

Alhamdulillah — Phase 1 is now preserved.  
In shaa Allah, Phase 2 begins cleanly from here.
