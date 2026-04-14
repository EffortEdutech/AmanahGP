# Amanah Index™ & Charity Transparency Certification Framework (CTCF)
## Consolidated Blueprint — Phase 1

**Document ID:** 02-TRUST-BLUEPRINT-P1  
**Version:** v1.0  
**Date:** 2026-04-02  
**Owner:** Darya Malak  
**Status:** Consolidated professional blueprint derived from current Phase 1 source pack

---

## 1) Purpose

This blueprint consolidates the current Phase 1 trust-framework materials into one implementation-ready reference for:

- organization administrators
- reviewers
- auditors / Shariah auditors
- scholars / Shariah advisors
- super admins / platform operators
- product, engineering, QA, and policy teams

It combines:

- the **CTCF certification model** for structured, evidence-based evaluation
- the **Amanah Index™** model for ongoing trust scoring and public explainability
- the practical evidence checklist, review workflow, audit controls, and role responsibilities needed to operate both consistently

---

## 2) Relationship to Existing Source Documents

This blueprint consolidates and normalizes the following materials already present in the project source pack:

1. **CTCF Criteria & Scoring (Phase 1)**
2. **Amanah Index™ Trust Score Specification (Phase 1)**
3. **Malaysia Islamic Charity Governance & Compliance Matrix**
4. **Phase 1 Compiled Master File**
5. **Phase 1 Development Lock Pack**
6. **RLS / access-control and evidence-publication rules**
7. **Quran, Hadith, and Shariah-auditing reference notes**

Where the original source pack was brief, fragmented, or split across files, this document fills in the operating structure and checklist detail without changing the locked Phase 1 direction.

---

## 3) Core Principles

### 3.1 Non-custodial principle
The platform does **not** hold donation funds. It evaluates transparency, trust, governance, evidence, certification status, and public accountability.

### 3.2 Evidence-first principle
No score or certification decision should rely only on narrative claims. Evidence, metadata, reviewer notes, and decision records must exist.

### 3.3 Explainability principle
Public trust indicators must be explainable at category level. Internal scoring must be explainable at criterion level.

### 3.4 Append-only trust history
Amanah history, trust events, certification history, and key audit actions must be stored as append-only or immutable records.

### 3.5 Malaysia-first fairness
Certification and trust expectations must adapt to organization type, oversight authority, fund type, and legal reality in Malaysia.

### 3.6 Shariah governance sensitivity
This framework measures operational trustworthiness and compliance discipline. It does **not** judge sincerity, niyyah, or spiritual merit.

---

## 4) Audience and Roles

### 4.1 Organization-side roles
- **org_admin** — accountable owner for submissions, evidence completeness, declarations, and response to review findings
- **org_manager** — prepares projects, reports, financial snapshots, and supporting documents
- **org_viewer** — read-only internal stakeholder

### 4.2 Platform-side roles
- **reviewer** — performs structured review, evidence validation, scoring, and certification decisions within policy
- **scholar** — advisory Shariah notes and issue escalation where Shariah-sensitive interpretation is needed
- **super_admin** — platform governance, escalation, overrides, version activation, reconciliation, and audit visibility

### 4.3 Assurance roles
- **auditor / external auditor** — validates financial, governance, process, or Shariah compliance evidence independently
- **Shariah auditor / Shariah reviewer** — validates Shariah-sensitive fund treatment, governance, segregation, and compliance controls

---

## 5) Framework Separation — CTCF vs Amanah Index™

### 5.1 CTCF
**CTCF** is a **structured certification framework**.

Use CTCF when the platform needs a formal, versioned evaluation of whether an organization meets a minimum and graded transparency standard.

CTCF answers:
- Is the organization certifiable?
- What grade did it achieve under the current version?
- Which criteria passed, failed, or were not applicable?
- What evidence supports the certification decision?

### 5.2 Amanah Index™
**Amanah Index™** is an **ongoing trust score**.

Use Amanah Index when the platform needs a rolling, event-driven public trust indicator that updates as verified activity occurs.

Amanah Index answers:
- How trustworthy and accountable does the organization currently appear based on verified signals?
- Has transparency improved or deteriorated over time?
- What recent verified events caused score movement?

### 5.3 Operating rule
- **CTCF** = formal checkpoint / certification layer
- **Amanah Index™** = continuous accountability layer

An organization may:
- have an Amanah score without current certification
- be evaluated for certification periodically
- improve Amanah between certification cycles through verified transparency behavior

---

## 6) Applicability Classes

The framework should not force a rigid one-size-fits-all standard. Criteria applicability must adapt by entity type.

### 6.1 Recommended organization classes
- NGO / Foundation
- Mosque / Surau
- Tahfiz / Islamic school
- Waqf body
- State religious / statutory body
- Other Islamic institution

### 6.2 Key applicability variables
- `org_type`
- `oversight_authority`
- `registration_type`
- `fund_types`
- `zakat_handling_enabled`
- `waqf_handling_enabled`
- `shariah_governance_present`

### 6.3 Normalization rule
If a criterion is genuinely not applicable, exclude it from the denominator and normalize the layer result. Do not punish an organization for criteria that do not legally or operationally apply to its category.

---

## 7) CTCF Blueprint — Certification Model

### 7.1 Objective
CTCF evaluates whether an organization demonstrates minimum certifiable discipline in:

- legal and governance compliance
- financial transparency
- project transparency and traceability
- impact and sustainability discipline
- Shariah governance controls

### 7.2 Certification structure
#### Layer 1 — Legal & Governance Gate
This is a **pass/fail gate**.

If any required gate item fails, the organization is **Not Certifiable** regardless of weighted score.

#### Weighted layers after gate
| Layer | Theme | Max Points |
|---|---|---:|
| 2 | Financial Transparency | 20 |
| 3 | Project Transparency & Traceability | 25 |
| 4 | Impact & Sustainability | 20 |
| 5 | Shariah Governance | 15 |
|  | **Total Weighted Score** | **80 raw / normalized to 100 for certification output** |

#### Output rule
For user-facing simplicity, the platform should output a **normalized certification score out of 100** after applying Layer 1 gate and layer normalization.

## 7.3 Gate criteria — mandatory pass items
All must pass unless explicitly marked not applicable by organization class:

1. Legal registration / lawful operating basis
2. Constitution / bylaws / trust deed / governing instrument
3. Named board / committee / trustees
4. Conflict of interest declaration or policy
5. Organization bank-account separation
6. Clear contact identity and address / oversight traceability

**Gate result options:**
- Pass
- Pass with condition
- Fail
- Not applicable (restricted use only)

> Recommended rule: “Pass with condition” should still block certification if the missing condition affects legal identity, bank separation, or board legitimacy.

## 7.4 Weighted layers and baseline criteria

### Layer 2 — Financial Transparency (20)
| Code | Criterion | Default Points | Typical Evidence |
|---|---|---:|---|
| FT-01 | Annual financial statement provided | 5 | signed accounts / management accounts / annual statement |
| FT-02 | Audit evidence or credible equivalent | 5 | external audit, government audit, statutory review |
| FT-03 | Program vs admin breakdown disclosed | 5 | ratio table, notes, dashboard summary |
| FT-04 | Zakat / restricted-fund segregation where applicable | 5 | ledgers, policies, restricted account trail |

### Layer 3 — Project Transparency & Traceability (25)
| Code | Criterion | Default Points | Typical Evidence |
|---|---|---:|---|
| PT-01 | Budget vs actual tracking | 5 | project budget sheet, utilization summary |
| PT-02 | Verifiable location / geo or location marker | 5 | geo-tag, site record, address evidence |
| PT-03 | Before / during / after evidence where applicable | 5 | photos, files, milestones |
| PT-04 | Beneficiary metrics with context | 5 | counts, profiles, categories served |
| PT-05 | Timely completion / progress reporting | 5 | dated reports, periodic updates |

### Layer 4 — Impact & Sustainability (20)
| Code | Criterion | Default Points | Typical Evidence |
|---|---|---:|---|
| IS-01 | KPIs or outcomes defined | 5 | KPI set, targets, baseline |
| IS-02 | Sustainability / maintenance plan | 5 | maintenance SOP, successor responsibility |
| IS-03 | Continuity tracking cadence | 5 | recurring review cycle, follow-up reports |
| IS-04 | Impact efficiency / stewardship indicator | 5 | cost-per-beneficiary, continuity efficiency, output efficiency |

### Layer 5 — Shariah Governance (15)
| Code | Criterion | Default Points | Typical Evidence |
|---|---|---:|---|
| SG-01 | Named Shariah advisor / religious oversight | 5 | appointment letter, governance profile |
| SG-02 | Written Shariah compliance policy | 3 | policy document, SOP |
| SG-03 | Zakat eligibility governance where applicable | 3 | asnaf policy, approval process |
| SG-04 | Waqf governance where applicable | 4 | waqf instrument, trustee process, restrictions |

## 7.5 Certification grades
| Normalized Score | Grade |
|---:|---|
| 85–100 | Platinum Amanah |
| 70–84 | Gold Amanah |
| 55–69 | Silver Amanah |
| Below 55 | Not Certified |

## 7.6 Certification outputs
Each evaluation must generate:
- gate decision
- criterion-by-criterion results
- layer totals
- normalized final score
- grade
- reviewer notes
- scholar/advisor notes where used
- decision status
- evidence references
- version label (for example `ctcf_v1`)

## 7.7 Certification decision statuses
Recommended Phase 1 statuses:
- draft
- submitted
- under_review
- changes_requested
- approved / certified
- rejected / not_certified
- suspended
- expired

---

## 8) Amanah Index™ Blueprint — Ongoing Trust Score

### 8.1 Objective
Amanah Index™ is the platform’s rolling trust score from 0–100, driven by verified operational behavior and recorded trust events.

### 8.2 Baseline formula (Phase 1)
| Component | Weight |
|---|---:|
| Governance Score | 30% |
| Financial Transparency Score | 25% |
| Project Transparency Score | 20% |
| Impact Efficiency Score | 15% |
| Feedback / Trust Signal Score | 10% |

**Formula:**

`Amanah Index = (0.30 × Governance) + (0.25 × Financial) + (0.20 × Project) + (0.15 × Impact) + (0.10 × Feedback)`

All components are normalized to 0–100.

### 8.3 Core event triggers
Recalculate when verified events occur, such as:
- `report_verified`
- `financial_submitted`
- `financial_verified`
- `certification_updated`
- `donation_confirmed`
- `complaint_logged`
- `complaint_resolved`
- `report_overdue_flagged`
- `report_overdue_cleared`
- `manual_recalc`

### 8.4 Operating behavior
- score history must be append-only
- recalculation must be idempotent
- duplicate trust events must be deduplicated by idempotency key where applicable
- public output must show a public-safe reason summary
- internal output may show component deltas and triggering references

### 8.5 Recommended score band labels
| Score | Public Interpretation |
|---:|---|
| 85–100 | Strong trust discipline |
| 70–84 | Good trust discipline |
| 55–69 | Moderate trust discipline |
| 40–54 | Weak transparency / improvement needed |
| Below 40 | High caution / insufficient verified trust signals |

### 8.6 Recommended component logic

#### Governance component
Signals may include:
- current gate compliance state
- board completeness
- policy completeness
- unresolved governance findings
- repeated reviewer escalations

#### Financial component
Signals may include:
- current financial disclosure completeness
- audit availability
- restricted-fund segregation
- timeliness of financial submissions
- consistency between reported and verified financial data

#### Project component
Signals may include:
- verified reports present
- evidence completeness
- traceable location / beneficiary reporting
- overdue or missing project reporting
- project closure / completion discipline

#### Impact component
Signals may include:
- outcome metrics completeness
- continuity updates
- maintenance / sustainability evidence
- efficiency trend

#### Feedback / trust-signal component
Signals may include:
- donor / stakeholder complaints
- complaint resolution timing
- public trust-event trend
- positive verification milestones

## 8.7 Explainability output
For every published score history entry, store:
- timestamp
- score version
- score value
- public reason summary
- internal component breakdown
- triggering event reference where available

---

## 9) Evidence Model — What Must Be Submitted

### 9.1 Gate / legal evidence
- registration certificate or lawful authority basis
- constitution / bylaws / trust deed / committee document
- board / trustee / committee list
- conflict-of-interest policy or declaration
- bank-account evidence for organization-controlled funds
- address or operating-basis traceability

### 9.2 Financial evidence
- annual statements
- audit report or official equivalent
- restricted-fund policy
- program-vs-admin allocation
- fund-type policy for zakat / waqf / sadaqah / general funds

### 9.3 Project evidence
- project profile and scope
- budget and actual expenditure record
- milestone updates
- photos / media / documents
- location evidence
- beneficiary metrics
- completion report

### 9.4 Shariah governance evidence
- Shariah advisor profile / appointment
- compliance policy
- zakat distribution policy / asnaf governance
- waqf restrictions / trustee governance
- any Shariah review report or advisory note

### 9.5 Metadata requirements for every file
- file type
- upload date
- issuer / source
- applicable period
- expiration date where relevant
- reviewer verification status
- remarks / rejection note if not accepted

---

## 10) Checklist — Organization Admin

Use this as the operating checklist before submission.

### 10.1 Legal and governance readiness
- organization legal identity is complete
- organization type and oversight authority are correctly selected
- board / committee / trustees are listed and current
- conflict-of-interest policy or declaration is uploaded
- organization bank account evidence is uploaded
- contact, address, and responsible officer are verified internally

### 10.2 Financial readiness
- current-year or latest annual financial statement is uploaded
- audit report or official equivalent is uploaded where available
- fund-type classification is accurate
- zakat segregation documents are uploaded if zakat is handled
- program-vs-admin breakdown is prepared and internally reviewed

### 10.3 Project transparency readiness
- each active public project has a project profile
- at least one progress or completion report exists for certifiable projects
- evidence files are complete, named properly, and attached to the right report
- beneficiary counts and context are included
- budget-vs-actual information is present

### 10.4 Shariah readiness
- Shariah advisor or oversight basis is declared if applicable
- zakat governance notes are clear if zakat is handled
- waqf restrictions are documented if waqf is handled
- any religious compliance note is documented consistently

### 10.5 Submission declaration
Before submission, org_admin should confirm:
- the information is true to the best of the organization’s knowledge
- evidence is authentic and not misleading
- restricted funds are correctly classified
- no material reviewer-facing document has been intentionally withheld

---

## 11) Checklist — Reviewer

Use this as the structured scoring and certification checklist.

### 11.1 Gate review
- verify legal status against uploaded evidence
- verify governance instrument exists and is relevant to entity type
- verify board / committee / trustee legitimacy
- verify organizational bank separation
- verify conflict-of-interest control exists
- confirm no gate-critical item is missing or clearly deficient

### 11.2 Evidence integrity review
- file belongs to the claimed entity
- file date / period is appropriate
- file metadata is complete
- evidence is attached to correct project / application / financial period
- no obvious inconsistency across documents

### 11.3 CTCF scoring review
- mark each criterion as pass / partial / fail / not applicable
- apply normalized scoring where criteria are not applicable
- ensure deductions are explained
- ensure supporting evidence references are recorded
- add reviewer notes for any conditional approval or weakness

### 11.4 Amanah trust-event review
- confirm verified events are legitimate triggers
- reject duplicate or invalid events
- ensure recalculation happened once
- confirm public-safe reason summary is accurate
- confirm score movement is explainable internally

### 11.5 Decision integrity review
- decision status matches evidence and score outcome
- changes requested are specific and actionable
- public evidence is approved only if safe and appropriate
- escalation to scholar or auditor is recorded when necessary

---

## 12) Checklist — Auditor / Shariah Auditor

Use this for independent assurance work.

### 12.1 Governance assurance
- confirm governance structure is documented and functioning
- confirm minutes / approvals / authorizations exist where relevant
- test conflict-of-interest controls
- test separation between personal and organizational funds

### 12.2 Financial assurance
- inspect financial statement consistency
- inspect restricted-fund treatment
- trace samples from inflow to allocation where possible
- review audit trail quality, not only totals
- verify whether disclosure claims match supporting records

### 12.3 Project assurance
- sample reported projects and verify evidence traceability
- test whether project reports match budget usage and stated outputs
- verify timeliness and completeness of reporting

### 12.4 Shariah assurance
- review zakat eligibility governance where applicable
- review waqf restrictions and trustee compliance where applicable
- review administrative fee reasonableness and basis
- review whether non-halal or doubtful income handling is documented
- review whether donor restrictions are respected

### 12.5 Assurance output
Auditor output should clearly state:
- scope reviewed
- procedures performed
- exceptions found
- material risks
- recommendations
- whether exceptions should block certification, reduce Amanah signals, or trigger follow-up review

---

## 13) Role Reference Matrix

| Activity | Org Admin | Reviewer | Auditor | Scholar | Super Admin |
|---|---|---|---|---|---|
| Prepare organization submission | A/R | C | I | I | I |
| Upload evidence and metadata | A/R | C | I | I | I |
| Gate review | I | A/R | C | C | I |
| CTCF criterion scoring | I | A/R | C | C | I |
| Certification decision | I | A/R | C | C | C |
| Amanah recalculation trigger validation | I | A/R | C | I | C |
| Audit / Shariah audit opinion | I | C | A/R | C | I |
| Public evidence approval | I | A/R | C | C | I |
| Version activation / platform policy override | I | I | I | C | A/R |

**Legend:** A = Accountable, R = Responsible, C = Consulted, I = Informed

---

## 14) Public vs Internal Output Rules

### 14.1 Public may show
- current certification status
- certification grade
- public-safe score summary
- Amanah score history summary
- verified project summaries
- approved public evidence only

### 14.2 Internal only
- detailed reviewer notes
- rejected evidence details
- internal component breakdowns where sensitive
- raw audit findings
- raw webhook / operational logs
- private governance or donor-sensitive records

---

## 15) Anti-Tamper and Control Rules

- submitted and verified records must become immutable except through privileged correction flow
- public evidence requires both visibility intent and reviewer approval
- Amanah history must never be overwritten
- certification history must never be overwritten
- all critical changes must create audit logs and/or trust events
- RLS and private-by-default evidence rules remain the primary protection boundary

---

## 16) Versioning and Governance

### 16.1 Version labels
- `ctcf_v1`
- `amanah_v1`

### 16.2 Change rules
A formula or criteria change requires:
- a new version label
- documented rationale
- effective date
- migration / compatibility note
- QA regression on scoring integrity

### 16.3 Do not overwrite historical decisions
Old evaluations and old score history remain attached to the version used at the time.

---

## 17) Implementation Notes for Product and Engineering

### 17.1 Minimum data objects
- certification application
- certification evaluation
- certification history
- trust events
- amanah index history
- evidence files
- financial snapshots
- reviewer notes / decision records
- audit logs

### 17.2 Minimum UI surfaces
- org admin checklist page
- evidence upload and verification-status panel
- reviewer scoring workspace
- certification decision view
- Amanah history timeline
- public trust summary card
- audit / reconciliation view for admins

### 17.3 Minimum QA scenarios
- pass gate + pass weighted score
- fail gate regardless of weighted score
- non-applicable criterion normalization
- duplicate trust-event replay prevention
- public evidence approval gate
- score history append-only verification
- certification history immutability verification

---

## 18) Recommended Immediate Next Companion Files

1. `CTCF_SCORING_MATRIX.json` — criterion codes, weights, applicability, evidence requirements
2. `AMANAH_INDEX_RULES.json` — event-to-component mapping and recalculation rules
3. `REVIEWER_DECISION_PLAYBOOK.md` — approval / reject / changes-request rules
4. `AUDIT_EVIDENCE_REGISTER_TEMPLATE.xlsx` — operational audit sampling template
5. `PUBLIC_TRUST_DISCLOSURE_COPY.md` — donor-facing wording for score and certification disclaimers

---

## 19) Final Statement

This document is the **professional consolidated blueprint** for operating both:

- **CTCF** as the formal certification framework, and
- **Amanah Index™** as the ongoing event-driven trust score.

It should now serve as the main working reference for policy, product, engineering, review operations, audit, and public explainability in Phase 1.

Bismillah.
