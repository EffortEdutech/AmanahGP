# AmanahOS — Repo-Based Product Definition (Rewritten from Actual `apps/org` System)

**Document purpose:** This is a rewritten `amanah_gp_OS.md` based on the actual system currently implemented in `apps/org` of the AmanahGP repository, not the earlier concept document.

**Reference basis used for this rewrite:**
- Actual `apps/org` routes, pages, components, and navigation already built in the GitHub repo
- Current organisation-facing flows in AmanahOS
- `Amanah Console v2.md` only as a boundary reference for what belongs to future reviewer/admin console scope

---

## 1. What AmanahOS is now

AmanahOS is the **organisation operating workspace** inside Amanah Governance Platform. It is not just a profile form or certification form. In the current repo, AmanahOS already functions as the organisation’s internal governance and accountability workspace, covering:

- organisation onboarding and readiness tracking
- member and role-based access
- accounting operations and financial reporting
- project reporting and evidence submission
- compliance and policy readiness
- trust score visibility
- certification readiness and application submission

In practical terms, AmanahOS is the place where an NGO or charity **builds its operational trust record** before that trust is shown to donors in AmanahHub and before it is evaluated by reviewers in the future Console.

---

## 2. Position of AmanahOS in the overall platform

The platform now separates into three clear application roles:

### 2.1 AmanahHub (`apps/user`)
Public and donor-facing experience.

### 2.2 AmanahOS (`apps/org`)
Organisation-facing operating system where the NGO manages readiness, accounting, reporting, policies, trust, and certification inputs.

### 2.3 Amanah Console (future / later phase)
Reviewer, auditor, certifier, platform operations, and central oversight workspace.

So AmanahOS should now be described as:

> **The organisation-side governance, finance, compliance, and reporting workspace of Amanah Governance Platform.**

It is the system that helps organisations become trust-ready, report-ready, and certification-ready.

---

## 3. Product objective

The objective of AmanahOS is to help an organisation move from:

**basic onboarding → structured governance setup → accounting discipline → reporting discipline → measurable trust score → certification readiness**

This is very important because the current implementation is not only about scoring organisations. It is also about helping them fill the gaps required to become stronger, more transparent, and more certifiable.

---

## 4. Core product principles reflected by the actual build

Based on the implemented pages in `apps/org`, the current AmanahOS follows these principles:

### 4.1 Readiness before rating
The app checks whether the organisation has completed key setup and compliance steps before advancing deeper into trust and certification.

### 4.2 Operations before marketing
The organisation must actually maintain bank accounts, funds, transactions, closes, reports, and policies inside the system.

### 4.3 Evidence before claims
Trust, certification, and reporting are tied to structured records such as submitted snapshots, reports, policy uploads, and accounting closes.

### 4.4 Guided improvement
The product is built to show missing items, incomplete steps, and next actions rather than only displaying a score.

### 4.5 Separation of org-side and reviewer-side responsibilities
AmanahOS is for the organisation to prepare and submit. Final review and decisioning belong in the Console workflow.

---

## 5. Current information architecture of AmanahOS

From the built navigation and protected layout, the current organisation app includes these top-level sections:

1. Dashboard
2. Profile
3. Members
4. Projects
5. Reports
6. Policy Kit
7. Compliance
8. Trust
9. Certification
10. Accounting

Within Accounting, the built submodules include:

- Overview
- Bank Accounts
- Funds
- Transactions
- Payment Requests
- Statements
- Reports
- Month Close

This means AmanahOS is already much more than a simple “org profile portal.” It is a multi-module operating workspace.

---

## 6. Actual module breakdown based on the repo

## 6.1 Dashboard
The dashboard is not just a welcome page. It acts as the organisation’s readiness cockpit.

Current implemented behaviour includes:

- loading the organisation membership context
- showing onboarding progress
- showing trust score snapshot
- showing financial snapshot status
- surfacing key next actions
- linking the organisation quickly into priority modules

In the current logic, onboarding progress is computed from real underlying records such as profile completeness, active members, bank accounts, funds, projects, policy uploads, and submitted reports. This is important because the dashboard is already acting as a live operating summary, not a static informational screen.

**Functional meaning:** The dashboard is the organisation’s control panel for “what is completed, what is missing, and what should be done next.”

---

## 6.2 Profile
The Profile area represents the organisation identity and foundational registration data needed for governance and certification.

This includes the organisation’s basic identity fields and core information that later affect readiness and reviewability.

**Functional meaning:** Without profile completeness, the organisation cannot properly progress into readiness, trust, and certification.

---

## 6.3 Members
The Members module supports organisational team setup and role-based participation.

From the repo flow, this area is already important because several readiness checks depend on having enough active members and clear organisation membership.

**Functional meaning:** AmanahOS is not designed as a single-user tool only. It is built to support actual organisational operation with membership and role separation.

---

## 6.4 Projects
The Projects module represents the operational units of charitable work.

Projects are important because later reporting, transparency, accountability, and trust evidence are tied to real project-level records.

**Functional meaning:** Projects are the bridge between fundraising/use of funds and public accountability.

---

## 6.5 Reports
The Reports module is the organisation’s reporting workspace for project and accountability submissions.

From the current repo direction, reports are not decorative content pages. They are structured submissions tied to organisation and project accountability, with statuses and evidence handling.

**Functional meaning:** Reports are one of the main proof layers that the organisation is active, transparent, and accountable.

---

## 6.6 Policy Kit
Policy Kit is one of the most important governance readiness modules in the current system.

This section is designed for the organisation to upload, manage, and complete required governance and policy documents. It directly supports readiness and trust events.

Examples of policy and governance relevance already reflected by the build include:

- conflict of interest policy
- governing and governance-related documents
- internal policy readiness
- policy-linked trust evidence

**Functional meaning:** Policy Kit is where governance maturity starts becoming demonstrable evidence.

---

## 6.7 Compliance
Compliance is the structured compliance workspace for the organisation.

It exists separately from Policy Kit because the product direction is not only storing policy files, but also helping the organisation manage compliance status and exportable readiness material.

**Functional meaning:** Policy Kit stores core governance materials; Compliance turns those materials into a more structured compliance workflow.

---

## 6.8 Trust
The Trust module is the organisation-facing trust visibility layer.

This is where the organisation can see its own Amanah Trust Score context, readiness signals, and trust-building progress. In other words, trust is not only computed behind the scenes for public display; it is also exposed internally so the organisation understands what affects its standing.

**Functional meaning:** Trust is the internal feedback loop that helps organisations improve before the donor sees the result.

---

## 6.9 Certification
Certification is already implemented as an organisation-side application and readiness workspace.

This is a major evolution from the earlier conceptual document. In the current build, certification is not just a future concept. The organisation can already:

- see readiness checks
- understand missing requirements
- view current application status
- submit an application
- see certification history
- understand score thresholds tied to certification tiers

The reviewer-side evaluation is explicitly separated from AmanahOS and belongs to the Console workflow.

**Functional meaning:** AmanahOS prepares and submits; Console reviews and decides.

---

## 6.10 Accounting
Accounting is one of the strongest and most concrete parts of the current AmanahOS build.

This is not merely a placeholder page. The accounting suite already establishes the financial transparency backbone of the platform.

### Built accounting scope includes:

#### a. Bank Accounts
Organisation financial accounts used as the foundation of financial separation and traceability.

#### b. Funds
Structured fund handling, including different fund types relevant to charity operations.

#### c. Transactions
Day-to-day financial entries and bookkeeping flow.

#### d. Payment Requests
Internal payment workflow and approval-oriented finance operations.

#### e. Statements
Financial statements workspace.

#### f. Reports
Accounting reports area with multiple report outputs.

#### g. Month Close
Period close process that converts activity into reviewable financial snapshots and accounting discipline.

**Functional meaning:** Accounting is the operational backbone for transparency, trust scoring, and certification readiness.

---

## 7. Financial reporting capability already present in AmanahOS

The built accounting reports section already shows that AmanahOS is intended to support NGO-grade financial transparency, not only generic bookkeeping.

The implemented report suite includes:

1. Statement of Financial Position
2. Statement of Activities
3. Statement of Changes in Funds
4. Zakat Utilisation Report
5. Statement of Cash Flow
6. Project Fund Report

This is a very important product signal. It means AmanahOS is already designed around a **charity/governance reporting model**, not just a normal SME finance dashboard.

The presence of a dedicated Zakat Utilisation Report especially shows that the system direction already includes faith-sensitive and Shariah-relevant accountability use cases.

---

## 8. Actual readiness model already visible in the system

The current implementation shows that readiness is built from real operational checkpoints.

The system already checks for items such as:

- organisation profile completeness
- onboarding approval state
- linked bank account
- minimum active team members
- conflict of interest policy uploaded
- at least one financial period closed
- submitted financial snapshot
- at least one project created
- at least one report submitted

This means AmanahOS is already functioning as a **guided readiness engine**.

It does not simply ask an organisation to apply for certification immediately. It first checks whether the operational prerequisites are in place.

---

## 9. Trust and certification relationship in the current build

The current build makes the relationship between trust and certification much clearer than the earlier concept draft.

### 9.1 Trust
Trust is a continuous internal signal based on governance, financial, and reporting readiness/evidence.

### 9.2 Certification
Certification is a more formal application-and-review process built on top of that readiness.

### 9.3 Practical meaning
An organisation can improve its internal readiness and trust position before or while preparing for certification.

This is good product design because it prevents the platform from becoming only a gatekeeper. Instead, it becomes a capacity-building system.

---

## 10. What AmanahOS is **not** in the current repo

To keep the rewritten document accurate, we should also be clear about what belongs outside the current AmanahOS scope.

AmanahOS is **not** the final reviewer console.

The following functions should remain in the future Console / reviewer ecosystem side:

- reviewer assignment
- formal review workflow execution
- audit/reviewer marketplace orchestration
- cross-organisation platform operations
- certification decision control at platform authority level
- centralised oversight dashboards across all organisations

So the correct positioning is:

- **AmanahOS:** organisation prepares, operates, uploads, reports, closes, improves, and applies
- **Amanah Console:** platform/reviewer/auditor side evaluates, verifies, manages, and decides

---

## 11. Practical end-to-end organisation journey in the current AmanahOS

Based on the actual app structure, the real organisation journey is now approximately:

### Stage 1 — Access and membership
The user enters AmanahOS under an organisation membership context.

### Stage 2 — Foundational setup
The organisation completes profile, members, and basic governance setup.

### Stage 3 — Financial foundation
The organisation links bank accounts, configures funds, records transactions, and begins financial discipline.

### Stage 4 — Operational accountability
The organisation creates projects and submits project/accountability reports.

### Stage 5 — Governance and compliance evidence
The organisation uploads policies and works through compliance readiness.

### Stage 6 — Financial reporting discipline
The organisation performs month close, generates statements/reports, and submits financial snapshots.

### Stage 7 — Trust visibility
The organisation monitors trust readiness and score-related progress.

### Stage 8 — Certification application
Once readiness gates are satisfied, the organisation applies for certification and tracks status.

This journey is much more grounded and accurate than the earlier conceptual description.

---

## 12. Rewritten official product description for AmanahOS

Below is the recommended rewritten description text for the document.

---

# AmanahOS

**AmanahOS** is the organisation-facing operating system of Amanah Governance Platform.

It is designed to help charities, NGOs, foundations, masjid-linked bodies, waqf initiatives, and other social-good organisations manage the internal work required for trustworthiness, transparency, and certification readiness.

AmanahOS combines:

- organisation setup and onboarding
- team and membership management
- project and report management
- governance policy readiness
- compliance preparation
- trust score visibility
- certification readiness and application
- charity-focused accounting and financial reporting

In AmanahOS, organisations do not only fill forms. They build a structured operational record of governance, financial discipline, and accountability.

That record then becomes the basis for:

- donor trust in AmanahHub
- internal improvement guidance
- certification application readiness
- reviewer and auditor assessment in the future Amanah Console

AmanahOS therefore serves as the organisation’s **governance, finance, compliance, and accountability workspace**.

Its purpose is not to punish weak organisations, but to help them close their gaps systematically so they can become more transparent, more trusted, and more certifiable over time.

---

## 13. Rewritten module summary for the document

## 13.1 Dashboard
Shows onboarding progress, trust readiness, snapshot status, and key next actions.

## 13.2 Profile
Stores the organisation’s foundational registration and identity information.

## 13.3 Members
Supports organisational participation, team setup, and role-based readiness.

## 13.4 Projects
Organises the charity’s operational initiatives and links them to accountability outputs.

## 13.5 Reports
Supports structured report submission and accountability evidence.

## 13.6 Policy Kit
Manages governance and policy documents required for trust and certification readiness.

## 13.7 Compliance
Tracks structured compliance preparation and exportable readiness material.

## 13.8 Trust
Shows the organisation’s trust progress and score-related readiness indicators.

## 13.9 Certification
Supports readiness checks, application submission, status tracking, and certification history.

## 13.10 Accounting
Provides the financial operations layer including bank accounts, funds, transactions, payment requests, statements, reporting, and month close.

---

## 14. Recommended replacement of the old conceptual framing

The older `amanah_gp_OS.md` leaned more toward concept and ambition. The rewritten repo-based framing should now replace that with this clearer statement:

> AmanahOS is not only an organisation onboarding portal. It is the operating workspace where organisations build governance evidence, maintain accountable financial records, manage project reporting, complete compliance and policy requirements, monitor trust readiness, and submit for certification.

That sentence is much closer to the real product now present in `apps/org`.

---

## 15. Suggested document status label

Recommended label to place at the top of the rewritten file:

**Status: Repo-Based Rewrite — reflects current implemented AmanahOS in `apps/org`**

---

## 16. Suggested next documentation split

After this rewrite, it would be best to split the documentation into three separate files:

1. `amanah_gp_OS.md`  
   Organisation-facing product definition based on actual `apps/org`

2. `amanah_console_v2.md`  
   Reviewer/platform-side console definition

3. `amanah_platform_overview.md`  
   End-to-end relationship between AmanahHub, AmanahOS, and Console

This will keep product boundaries much cleaner.

---

## 17. Final positioning statement

**AmanahOS is the organisation’s internal accountability engine.**

It is where an organisation becomes ready for transparency, ready for trust, and ready for certification.

