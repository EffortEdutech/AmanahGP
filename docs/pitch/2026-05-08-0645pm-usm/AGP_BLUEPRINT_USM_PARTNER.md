# Amanah Governance Platform Blueprint

**Prepared for:** AGP-led grant, advisory, and JAKIM/MAIN development partner discussions  
**Advising member target:** Associate Professor Dr. Mohd Anuar bin Arshad, Organizational Behaviour / HRM / HRD / Organizational Learning, Universiti Sains Malaysia  
**Prepared on:** 8 May 2026  
**Source base:** AmanahGP repo `main` after `git fetch origin`, deployed AmanahHub and amanahOS pages, existing pitch/grant drafts in `docs/pitch`, and public USM profile sources.

## 1. Executive Thesis

Amanah Governance Platform (AGP) is a trust infrastructure layer for Malaysian Islamic social finance and community charities. It combines donor-facing transparency, organization-side governance operations, evaluator workflows, and an auditable Amanah Index so that giving is not only easier, but more institutionally trustworthy.

AGP is designed as public-interest infrastructure, not a commercial product sold to charity organizations. Charity organizations should not pay AGP for access to the trust, governance, onboarding, bookkeeping, audit-readiness, certification, reporting, or training support they receive. The sustainability model should be paid for by grants, zakat/waqf ecosystem partners, CSR/ESG sponsors, funders, and institutions that benefit from stronger governance across the sector.

One strong immediate approach is for AGP to apply directly for grants and propose JAKIM/MAIN as grant, development, or implementation partners. Prof. Anuar can be invited as an advising member rather than making USM the formal institutional anchor. This keeps the project flexible, lets AGP move faster, and still gives the work credible organizational behaviour guidance.

This does **not** exclude any other funding or partnership path. AGP should pursue all viable grant and institutional routes in parallel, including university-linked research applications, JAKIM/MAIN partnerships, JAWHAR engagement, MDEC, Hasanah, Cradle, SC FIKRA, IERIF/INCEIF, IsDB, CSR/ESG sponsorships, state-level programmes, and OIC-region opportunities. The execution board in `docs/pitch/html/agp_grant_execution_board.html` remains a live reference for the broader funding pipeline.

The core adoption challenge is not only software delivery; it is changing how charity committees, mosque administrators, surau committees, NGO teams, donors, reviewers, MAIN officers, JAKIM-linked bodies, and regulators behave around accountability, evidence, reporting, learning, and trust. That makes organizational behaviour expertise valuable as an advisory layer while JAKIM/MAIN provide authority, access, and ecosystem legitimacy.

## 2. Current Product Surfaces

| Surface | Audience | Current role | Evidence from repo / deployed web |
|---|---|---|---|
| AmanahHub | Public donors and verified charities | Public trust directory, charity profiles, Amanah score, non-custodial donation journey | Live `/charities` page shows 46 visible organisations, 37 published trust profiles, non-custodial donation model, filters by type/state, and seeded/mock orgs across mosque/surau, waqf, zakat, foundation, cooperative, welfare and other categories. |
| amanahOS | Charity / mosque / NGO operators | Organization workspace for governance, accounting, compliance, projects, reports, trust score, certification, members | Live login surface is deployed at `amanah-os.vercel.app`; repo contains protected workspace routes for accounting, compliance, governance, policy kit, projects, reports, trust, certification, and org profile. |
| AGP Console | Platform admins, reviewers, scholars, evaluators | Evaluator authority and platform control plane | Live login surface is deployed at `amanah-hub-console.vercel.app`; repo navigation includes organizations, roles, trust events, governance cases, review workbench, scholar approval, publication command, compliance center, audit log, notifications, and production readiness. |
| `@agp/scoring` | Shared trust engine | Amanah Index and CTCF scoring logic | Package implements `amanah_v1` weighted score and CTCF test coverage. Current Amanah weights are governance 30%, financial transparency 25%, project transparency 20%, impact efficiency 15%, feedback 10%. |
| Supabase schema | Platform data and audit backbone | Multi-tenant records, donations, evidence, scoring history, trust events, fund accounting | Migrations include core schema/RLS, scholar notes, org documents, fund accounting, trust event engine, Amanah v2 baseline repair, live public profiles, and platform role updates. |

## 3. Live Evidence Snapshot

As of 8 May 2026, AmanahHub is already live with seeded/mock public data. The `/charities` page demonstrates:

- 46 visible organisations.
- 37 published trust profiles.
- Public filters by organisation type and Malaysian state.
- Organisation categories including NGO/welfare association, mosque/surau, waqf institution, zakat body, foundation/yayasan, cooperative, and other.
- Public Amanah trust cards with visible scores, certification tiers such as Gold, Silver and Bronze, and explanations of why donors may consider each organisation.
- Examples include waqf dialysis support, waqf clinic support, hospital equipment funds, zakat bodies, education foundations, mosque/surau welfare programmes, and environmental waqf reporting.

This matters for grants: AGP is not only a proposal. It is a live seeded MVP with demonstrable public trust profiles, deployed org/admin workspaces, and enough data structure to support pilots, demos, funder diligence, and JAKIM/MAIN conversations.

## 4. Platform Logic

AGP is structured around a simple trust loop:

1. Organizations operate through amanahOS: maintain profiles, projects, reports, evidence, accounting records, policy kit, and certification applications.
2. Trust events are generated from material changes, submissions, risk signals, or reviewer actions.
3. AGP Console routes trust events into governance cases, review workbench tasks, clarification requests, scholar approval, and final publication control.
4. The scoring engine computes and preserves trust outputs through append-only histories.
5. AmanahHub publishes verified trust signals to donors through charity profiles and the Amanah Index.
6. Donors give directly to the organization through non-custodial rails, while AGP records trust and reporting evidence.

## 5. Why This Is Not Just a Donation Platform

AGP's defensible value is governance instrumentation. It makes invisible institutional behaviour visible: whether a charity files reports, resolves findings, maintains evidence, separates restricted funds, handles conflicts, obtains Shariah review, and improves over time.

This positions AGP as:

- A trust registry for donors.
- A governance operating system for Islamic charities and mosques.
- A reviewer workflow for scholars and evaluators.
- A behavioural change intervention for transparency and accountability.
- A research platform for organizational learning in community institutions.

## 6. Public-Interest Sustainability Model

AGP's sustainability strategy has three stages:

1. **Grant funding** for initial development, pilot expansion, operational readiness, evaluation, and national proof-building.
2. **Corporate partnerships and ESG sponsorships** to fund governance onboarding programmes, training cohorts, reporting improvement, and audit-readiness support for charity organizations.
3. **Alignment with zakat and waqf ecosystems** for long-term institutional support, especially where councils, zakat bodies, waqf institutions, foundations, and funders benefit from better governance data and lower oversight burden.

AGP may charge service fees to zakat bodies, waqf institutions, foundations, CSR funders, councils, or other institutional sponsors for services delivered to charity organizations, but **AGP will not collect payment from the charity organizations themselves**.

The sponsored service lines are:

- Organisation SaaS subscription.
- Managed bookkeeping service.
- Audit-readiness programme.
- Certification support.
- Institutional dashboard subscription.
- CSR/funder reporting tools.
- Training and governance workshops.
- Reviewer and Shariah marketplace.

This keeps the platform's incentive aligned with public trust: charities are supported to improve governance without being burdened by new fees, while institutions that need sector-level transparency fund the infrastructure.

## 7. JAKIM/MAIN Development Partner Model

The most strategic institutional path is to approach JAKIM and all state MAINs as grant, development, or implementation partners.

**Partner benefit to JAKIM/MAIN:**

- Centralised visibility of mosques, suraus, charities, waqf initiatives, and registered Islamic organizations under their authority.
- A structured onboarding and governance-readiness process without requiring each organization to build its own system.
- Institutional dashboards for compliance, evidence status, certification readiness, reporting gaps, and risk signals.
- Lower administrative burden because AGP handles registration, initial data structuring, digital profiles, onboarding support, and training.
- Better donor and public confidence through verified public trust profiles and evidence-backed Amanah scoring.
- A practical pathway to standardise governance reporting across states while preserving each MAIN's authority.

**Operational model:**

1. MAIN/JAKIM appoints AGP as development or implementation partner.
2. AGP registers all organizations under that authority into the platform, including mosques, suraus, Islamic charities, waqf initiatives, schools, foundations, or other approved entities.
3. Initial registration captures core organization identity, authority link, location, committee/contact structure, fund categories, and public profile baseline.
4. Charity members and administrators update records over time through amanahOS: reports, projects, evidence, governance documents, bookkeeping records, and certification progress.
5. AGP Console provides MAIN/JAKIM dashboards, review queues, trust events, compliance signals, and publication control.
6. AmanahHub publishes verified public profiles where appropriate, improving public confidence without exposing private evidence.

This model can begin with one MAIN or JAKIM-linked cohort, then expand state by state.

## 8. Prof. Anuar Advisory Fit

Dr. Mohd Anuar Arshad's public USM profile identifies alignment in Organizational Behaviour, HRM, Organizational Development, HRD, Organizational Learning, Business Ethics, Corporate Communication, and community knowledge transfer. The recommended role is **Advising Member for Organizational Behaviour and Governance Adoption**, not necessarily USM as the formal grant partner.

His advisory contribution can support:

- Digital trust adoption among mosque and NGO committees.
- Governance behaviour change under evidence-based reporting.
- Organizational learning from review feedback and remediation cycles.
- Ethics, accountability, and spiritual quotient in Islamic nonprofit management.
- Human resource development and training design for volunteer-led institutions.
- Trust as a measurable organizational capability.

## 9. Proposed Research + Pilot Model

**Working title:** Digitising Amanah: Organizational Behaviour, Trust, and Governance Capability in Malaysian Islamic Social Finance Institutions.

**Pilot population:** A JAKIM-linked cohort or one state MAIN cohort of 10 to 30 mosques, suraus, Islamic NGOs, waqf initiatives, or community charities. A wider rollout can register all organizations under the authority of a participating MAIN, with phased activation as charity members update their data over time.

**Duration:** 12 months.

**Core intervention:** deploy amanahOS + AGP Console + AmanahHub public profiles, combined with AGP-led onboarding, MAIN/JAKIM institutional coordination, and Prof. Anuar-advised behavioural measurement and capacity-building design.

**Research questions:**

- What predicts adoption of digital governance tools among mosque and NGO administrators?
- Does structured evidence submission improve perceived accountability and reporting discipline?
- Does visible Amanah scoring affect donor trust and willingness to give?
- How do review feedback loops change organizational learning and compliance behaviour?
- Which training formats best improve governance capability in volunteer-heavy institutions?

**Methods:**

- Baseline and endline organizational governance assessment.
- TAM/UTAUT-style adoption survey adapted for Islamic nonprofit governance.
- Trust perception survey for donors and administrators.
- Usage analytics from AGP.
- Case study interviews with administrators, reviewers, donors, and scholars.
- Pre/post comparison of report timeliness, evidence completeness, remediation closure, and Amanah score movement.

## 10. Pilot KPIs

| Dimension | Metric | Target |
|---|---|---|
| Adoption | Active pilot organizations | 10-20 onboarded and trained |
| Registry | Initial institutional registration | 100% of agreed MAIN/JAKIM pilot cohort registered |
| Governance | Evidence completeness | 80% of pilot orgs complete core evidence pack |
| Reporting | Report timeliness | 50% reduction in late or incomplete reporting |
| Trust | Amanah score movement | Average score improvement of 10-15 points where baseline gaps exist |
| Learning | Remediation closure | 70% of findings resolved within agreed cycle |
| Donor confidence | Trust perception | 20% increase in stated confidence after viewing public profiles |
| Research | Outputs | 1 pilot report, 1 grant report, 1 conference/paper manuscript, 1 practitioner toolkit |

## 11. Grant Positioning

The grant strategy should stay diversified. The AGP-led JAKIM/MAIN route is a primary near-term path because the primary beneficiaries and authority holders are JAKIM, MAIN, mosques, suraus, and Islamic charity organizations. At the same time, AGP should keep university-linked, accelerator, government, Islamic finance, CSR, state, and international routes open.

**Recommended first application framing:** AGP-led grant to build, register, onboard, and evaluate a digital governance infrastructure layer for mosques, suraus, waqf initiatives, and Islamic charity organizations under JAKIM/MAIN authority.

**Institutional partner framing:** JAKIM/MAIN gain dashboard visibility, standardized registration, onboarding support, audit-readiness, reporting improvement, and public trust infrastructure. Charity organizations receive services without paying AGP.

**Funding pathways to keep active, based on the execution board and prior grant intelligence:**

- Malaysia Digital (MD) Status as an immediate prerequisite for MDEC pathways.
- Hasanah Micro Grant and Hasanah Special Grant for pilot onboarding, capability building, and larger multi-year scale.
- Cradle CIP Spark / Sprint for MVP validation and commercialisation support.
- MDEC Malaysia Digital Catalyst Grant and MDAG after MD status and pilot evidence.
- SC FIKRA ACE for Islamic fintech credibility, mentorship, and industry connections.
- JAWHAR and direct JAKIM/MAIN engagement for institutional anchoring.
- IERIF / INCEIF for research-backed Islamic economics and governance innovation.
- IsDB Engage, Transform Fund, Tadamon, and OIC-region opportunities for international scale.
- Corporate CSR/ESG sponsorships from Islamic banks, takaful operators, GLCs, and foundations.
- State-level digital economy, Islamic affairs, waqf, zakat, and social impact programmes.
- University-linked co-applications where a specific funder benefits from academic anchoring.

## 12. Immediate Workplan

| Phase | Timeline | AGP role | Advisor / institutional partner role |
|---|---:|---|---|
| Advisor framing | Week 1-2 | Invite Prof. Anuar as advising member, not necessarily USM as applicant | Advise research framing, adoption model, training/evaluation logic |
| Institutional outreach | Week 1-4 | Prepare JAKIM/MAIN proposal and demo | JAKIM/MAIN identify authority scope and pilot cohort |
| Grant concept notes | Week 2-4 | Prepare modular grant versions for multiple funders | Advisor reviews methodology; JAKIM/MAIN confirms benefit where relevant |
| Pilot prep | Month 2-3 | Configure registry, onboarding, trust workflows | JAKIM/MAIN provides org list and official coordination |
| Field pilot | Month 4-10 | Register organizations, run platform, support users, collect usage data | Orgs update records over time; advisor supports evaluation |
| Evaluation | Month 11-12 | Export platform metrics, produce cases and scale plan | Advisor reviews learning outcomes; JAKIM/MAIN reviews institutional dashboard value |

## 13. Advisor And JAKIM/MAIN Ask

Ask Prof. Anuar to become an advising member for AGP, with three concrete commitments:

1. Co-develop the behavioural research and capacity-building model.
2. Review the grant concept note and evaluation methodology.
3. Help position AGP as a credible behaviour-change and organizational learning intervention for Islamic social finance governance.

Ask JAKIM/MAIN to consider AGP as a grant, development, or implementation partner, with three concrete commitments:

1. Provide authority-side endorsement or pilot access.
2. Share or validate the list of organizations under the selected scope for registration.
3. Use institutional dashboards and feedback to shape the governance reporting standard.

## 14. Decision Needed From The Next Meetings

The next meetings should not only seek general support. They should unlock specific next steps:

- Prof. Anuar: agreement to serve as advising member.
- JAKIM/MAIN: agreement on whether the route is grant, development partner, implementation partner, or pilot collaboration.
- Pilot scope: one state MAIN, JAKIM-linked organizations, or a mixed cohort.
- Registration model: full authority list registered first, with member updates over time.
- Grant target sequencing: which applications go first without dropping the others.
