# Charity Transparency Certification Framework (CTCF) — Criteria & Scoring v2

**Document ID:** 02-TRUST-CTCF-V2  
**Replaces:** Doc08_CTCF_Criteria_Scoring_Phase1.md (ctcf_v1)  
**Version:** v2.0  
**Date:** April 2026  
**Owner:** Darya Malak / Effort Studio  
**Status:** Specification — Ready for Implementation  

---

## 1. Purpose and Scope

The Charity Transparency Certification Framework (CTCF) is AGP's structured evaluation standard for Islamic charities in Malaysia. It assesses **governance integrity, financial transparency, project accountability, impact discipline, and Shariah governance controls**.

CTCF is explicitly **not**:
- a judgement of niyyah (intention) or spiritual merit
- a guarantee of impact outcomes
- a Shariah fatwa or endorsement
- a substitute for regulatory audit by ROS, JAKIM, or state Islamic councils

`ctcf_v2` supersedes `ctcf_v1`. All new certification evaluations use `ctcf_v2`. Existing `ctcf_v1` records remain valid and append-only — they are never migrated or overwritten.

---

## 2. What Changed from v1

| Area | v1 | v2 |
|---|---|---|
| **Criterion scoring** | Binary: Yes (full) / No (zero) | Graduated: Full / Partial / No |
| **Org size awareness** | None — uniform criteria | Four size bands; audit thresholds scale by size |
| **Theory of Change** | Not present | New sub-criterion in Layer 4 (KPI quality) |
| **Evidence staleness** | Not evaluated | Stale evidence flag affects reviewer input |
| **Geo-verification** | Binary yes/no | Graduated with N/A for non-project orgs |
| **Layer 2 minimum** | ≥12/20 | ≥10/20 (adjusted for graduated scoring) |
| **Shariah advisor** | Binary | Graduated: external qualified / internal only / none |
| **Reviewer input format** | Yes / No / N/A per criterion | Full / Partial / No / N/A per criterion |
| **Engine version constant** | `ctcf_v1` | `ctcf_v2` |

---

## 3. Scoring Model Summary

**Layer 1** is a mandatory **Pass/Fail Gate**. Failure at Layer 1 → Not Certifiable. No score computed.

| Layer | Theme | Max Points |
|---|---|---:|
| 2 | Financial Transparency | 20 |
| 3 | Project Transparency & Traceability | 25 |
| 4 | Impact & Sustainability | 20 |
| 5 | Shariah Governance | 15 |
| | **Total** | **80** |

> **Note on the 80-point total:** Layer 1 is a gate, not scored. The remaining four layers sum to 80. Scores are normalised to 0–100 for display and grade thresholds. See Section 6 for the normalisation formula.

**Certification threshold:** ≥55 (normalised 0–100)  
**Layer 2 floor:** normalised Layer 2 score ≥10/20  

---

## 4. Certification Grades

| Normalised Score | Grade |
|---:|---|
| 85 – 100 | Platinum Amanah |
| 70 – 84 | Gold Amanah |
| 55 – 69 | Silver Amanah |
| < 55 | Not Certified |

Grades are displayed on the public organisation profile alongside the CTCF badge. Grade history is append-only and visible as a trust timeline.

---

## 5. Organisation Size Bands

Certain criterion thresholds scale by organisation size. Size is determined from the **annual receipts** field in the organisation's most recent verified Financial Snapshot.

| Band | Annual Receipts (RM) | Code |
|---|---|---|
| Micro | < 100,000 | `micro` |
| Small | 100,000 – 499,999 | `small` |
| Medium | 500,000 – 1,999,999 | `medium` |
| Large | ≥ 2,000,000 | `large` |

If no verified Financial Snapshot exists, the reviewer assigns the size band manually during the evaluation. The assigned band is stored alongside the evaluation record.

---

## 6. Graduated Scoring and Normalisation

### 6.1 Response Scale

Each scored criterion (Layers 2–5) accepts one of four responses:

| Response | Multiplier | Meaning |
|---|---:|---|
| **Full** | 1.0 | Criterion fully met with documented evidence |
| **Partial** | 0.5 | Criterion partially met or informally addressed |
| **No** | 0.0 | Criterion not met |
| **N/A** | — | Not applicable to this org type; excluded from denominator |

`criterion_score = criterion_max_points × multiplier`

### 6.2 Layer Normalisation

When one or more criteria within a layer are marked N/A, the layer score is normalised so that the org is not penalised for irrelevant criteria:

```
normalised_layer_score = (sum_earned / max_applicable_points) × layer_max_points
```

Where `max_applicable_points` = sum of max points for all non-N/A criteria in the layer.

If **all criteria** in a layer are N/A (edge case: e.g. a pure advocacy org with no projects), the layer score is treated as `layer_max_points` (full credit — not penalised for irrelevance).

### 6.3 Total Score Normalisation

The total raw score across Layers 2–5 is converted to a 0–100 scale:

```
normalised_total = ((L2_norm + L3_norm + L4_norm + L5_norm) / 80) × 100
```

Rounded to 2 decimal places. This normalised total is used for grade determination and Amanah Index input.

---

## 7. Evidence Staleness

From `ctcf_v2`, the reviewer interface surfaces a **staleness flag** on any uploaded evidence item. Evidence is considered stale when:

| Document type | Stale after |
|---|---|
| Annual financial statement | 18 months from filing date |
| Audit report | 18 months from audit period end |
| Project completion report | 3 years from project close date |
| Governing document (constitution/MOU) | 5 years unless amended |
| Shariah advisor letter | 2 years from issuance |

**Scoring rule:** A reviewer who relies on stale evidence to award Full credit should instead award Partial credit at most, and must note this in the evaluation record. The scoring engine does not auto-penalise staleness — it surfaces the flag to the reviewer as a decision input.

---

## 8. Layer 1 — Legal & Governance Gate (Pass/Fail)

All six criteria must pass. Failure on any single criterion → Not Certifiable.

| # | Criterion | Pass Condition |
|---|---|---|
| 1.1 | Legal identity / registration evidence | ROS cert, JAKIM letter, state council recognition, or equivalent |
| 1.2 | Governing document | Constitution, bylaws, deed of trust, or waqf deed — signed and dated |
| 1.3 | Named board / committee / trustees | Minimum 3 named individuals with roles; must be current |
| 1.4 | Conflict of interest policy | Written policy; board members acknowledge in writing or on record |
| 1.5 | Separate organisational bank account | Dedicated account in the org's name; no personal collection accounts |
| 1.6 | Physical contact and address | Verifiable address and at least one active contact point |

Failure notes must be recorded per criterion. The reviewer may mark an item as `pending` (missing but expected shortly) — but the gate is not passed until all six items are confirmed.

---

## 9. Layer 2 — Financial Transparency (20 pts)

**Layer 2 floor:** normalised Layer 2 score must be ≥ 10/20 for certification to proceed, regardless of total score.

### Criteria

#### 2.1 Annual Financial Statement (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Externally audited financial statements for the most recent completed financial year |
| Partial | 2.5 | Internally prepared financial statements without independent review |
| No | 0 | No financial statement provided |

> **Size scaling — Audit threshold:**
> - **Micro / Small:** Partial (internal statements) qualifies for Full credit provided the reviewer is satisfied with preparation quality. This reflects resource realities for small orgs.
> - **Medium / Large:** External audit by a registered accountant is required for Full credit. Internal statements only → Partial.

#### 2.2 Independent Audit Evidence (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Audited by registered external accountant; audit report provided and covers the evaluation period |
| Partial | 2.5 | Reviewed or compiled by a qualified person (not full audit); or internal audit committee with documented process |
| No | 0 | No audit evidence |

> **Size scaling:**
> - **Micro / Small:** Credible internal review or compilation qualifies for Partial credit; Full credit requires external accountant.
> - **Medium / Large:** Full credit requires external registered accountant audit. No exceptions.

#### 2.3 Programme vs Administrative Cost Breakdown (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Disclosed breakdown with percentages; formally documented in financials or annual report |
| Partial | 2.5 | Approximate breakdown stated informally (e.g. in a report narrative) but not formally documented |
| No | 0 | No breakdown provided |

#### 2.4 Zakat Fund Segregation and Traceability (max 5 pts) — N/A if non-Zakat org

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Dedicated Zakat account or sub-ledger; documented distribution trails; beneficiary categories recorded |
| Partial | 2.5 | Zakat tracked but commingled with general funds; some distribution records |
| No | 0 | No Zakat segregation or tracking |
| N/A | — | Organisation does not handle Zakat funds |

---

## 10. Layer 3 — Project Transparency & Traceability (25 pts)

### Criteria

#### 3.1 Budget vs Actuals Tracking (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Formal budget vs actuals report per project; documented variances explained |
| Partial | 2.5 | Informal tracking; approximate figures available but not formally documented |
| No | 0 | No tracking |

#### 3.2 Geo-Verified Reporting (max 5 pts) — N/A for non-field orgs (e.g. pure advocacy, scholarship funds)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | GPS-tagged photos, geo-stamped media, or credible third-party location verification |
| Partial | 2.5 | Location stated (address, district) but not independently verified |
| No | 0 | No location information provided |
| N/A | — | Organisation type does not conduct field activities |

#### 3.3 Before / After Documentation (max 5 pts) — N/A for non-construction / non-field orgs

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Structured before/after evidence with dates, photos, and measurable baseline |
| Partial | 2.5 | Post-implementation evidence only; no documented baseline |
| No | 0 | No documentation |
| N/A | — | Project type does not involve physical change with a measurable before state |

#### 3.4 Beneficiary Impact Metrics with Context (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Quantified beneficiary count plus at least one outcome metric with contextual explanation |
| Partial | 2.5 | Beneficiary count only; no outcome metrics |
| No | 0 | No beneficiary data |

#### 3.5 Completion Report Timeliness (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Completion report filed within 30 days of project close date |
| Partial | 2.5 | Filed within 90 days |
| No | 0 | Not filed, or filed after 90 days |

> For ongoing programmes without a defined close date, timeliness is evaluated against the periodic reporting schedule declared by the organisation.

---

## 11. Layer 4 — Impact & Sustainability (20 pts)

### Criteria

#### 4.1 KPI Quality and Theory of Change Alignment (max 5 pts)

This criterion is upgraded from v1's simple "KPIs defined" check. It now evaluates **whether the organisation can articulate why its activities produce the outcomes it claims** — not just that it has targets.

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | SMART KPIs with a written rationale documenting the causal link between activities and stated outcomes (logic model, theory of change, or equivalent) |
| Partial | 2.5 | KPIs stated but not SMART, or KPIs present without any documented causal rationale |
| No | 0 | No KPIs defined |

> **Size scaling:**
> - **Micro / Small:** A short written narrative (1–2 paragraphs) explaining the intended causal chain qualifies for Full credit. A formal logic model is not required.
> - **Medium / Large:** A structured theory of change document or logic model is expected for Full credit. Narrative only → Partial.

#### 4.2 Sustainability and Maintenance Plan (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Written maintenance plan with assigned responsible parties, timeline, and funding source identified |
| Partial | 2.5 | Verbal or informal plan acknowledged; no written documentation |
| No | 0 | No plan |

#### 4.3 Jariah Continuity Tracking Cadence (max 5 pts)

Specific to Sadaqah Jariah — evaluates whether the organisation has a structured approach to monitoring the ongoing benefit of completed projects.

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Formal tracking schedule (quarterly or annual); documented continuation reports |
| Partial | 2.5 | Ad hoc tracking; no formal schedule |
| No | 0 | No continuity tracking |

#### 4.4 Impact-per-Cost Efficiency Metric (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Cost per beneficiary or cost per outcome unit documented and disclosed in the report |
| Partial | 2.5 | Total project cost disclosed but no per-beneficiary or per-outcome breakdown |
| No | 0 | No efficiency metric |

---

## 12. Layer 5 — Shariah Governance (15 pts)

Layer 5 is the distinctive layer of the CTCF. It evaluates whether the organisation has structural Shariah governance — not whether its intentions are good.

### Criteria

#### 5.1 Named Shariah Advisor (max 5 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 5 | Named, externally engaged, qualified Shariah scholar with documented scope of engagement and active relationship |
| Partial | 2 | Internal Shariah committee or panel without an externally qualified scholar; or named advisor with no documented engagement letter |
| No | 0 | No Shariah advisor named |

#### 5.2 Written Shariah Compliance Policy (max 3 pts)

| Response | Points | Evidence |
|---|---:|---|
| Full | 3 | Board-approved written policy governing how Shariah compliance is ensured across fund handling, disbursement, and programme activities |
| Partial | 1.5 | Informal policy acknowledged verbally or referenced in governing documents but not a standalone written policy |
| No | 0 | No policy |

#### 5.3 Zakat Eligibility Governance (max 3 pts) — N/A if org does not handle Zakat

Evaluates whether the org has a documented process for determining and verifying Zakat recipient eligibility (asnaf categories).

| Response | Points | Evidence |
|---|---:|---|
| Full | 3 | Formal eligibility criteria documented; verification process in place; records kept per beneficiary |
| Partial | 1.5 | Eligibility informally screened but not formally documented |
| No | 0 | No eligibility governance |
| N/A | — | Organisation does not distribute Zakat to individuals |

#### 5.4 Waqf Asset Governance (max 4 pts) — N/A if org does not manage Waqf assets

Evaluates whether the org has a formal governance structure for Waqf assets under its management.

| Response | Points | Evidence |
|---|---:|---|
| Full | 4 | Documented Waqf asset register; clear governance rules covering permissible uses, prohibited uses, and oversight responsibility; reviewed annually |
| Partial | 2 | Informal tracking of Waqf assets; governance rules acknowledged but not formally documented |
| No | 0 | No Waqf governance |
| N/A | — | Organisation does not manage Waqf assets |

---

## 13. Certification Decision Rules

After the score is computed, the reviewer makes a certification decision. The following rules apply:

| Condition | Outcome |
|---|---|
| Layer 1 any item failed | Not Certifiable — no score computed |
| Layer 2 normalised score < 10 | Not Certifiable — even if total score ≥ 55 |
| Normalised total < 55 | Not Certified |
| Normalised total 55–69 | Silver Amanah — certifiable |
| Normalised total 70–84 | Gold Amanah — certifiable |
| Normalised total ≥ 85 | Platinum Amanah — certifiable |

### Active Org Alert Override

If the organisation has an active `org_alert` of status `investigation_pending` or `suspended`, certification decisions are **blocked** regardless of score. The reviewer sees a notification. Alert must be resolved by a `super_admin` before a certification decision can be recorded.

---

## 14. Versioning Rules

- All evaluations record the CTCF version used: `ctcf_v1` or `ctcf_v2`.
- `ctcf_v1` evaluations remain valid and visible in the certification history.
- `ctcf_v1` evaluations do not display a staleness flag.
- When an organisation re-applies for certification, the reviewer must use `ctcf_v2` going forward.
- The `@agp/scoring` package exports `CTCF_VERSION = 'ctcf_v2'` as the active constant.
- Old `ctcf_v1` engine code is retained in the package as `computeCtcfScore_v1` (renamed) for audit trail reproducibility.

---

## 15. Reviewer Guidance Notes

### On Graduated Responses

"Partial" is not a consolation prize — it is the accurate score for an organisation that is genuinely on a governance improvement journey. Reviewers should:

- Award Full only when documented evidence is present and current.
- Award Partial when intent is clear and some evidence exists, but it is informal, incomplete, or stale.
- Award No when there is no evidence or the criterion is clearly unmet.
- Never award Full based on verbal assurance alone, regardless of how credible the organisation appears.

### On N/A Usage

N/A must be applied only when the criterion genuinely does not apply to the organisation's activities — not as a way to avoid a No score. If a mosque claims it handles Zakat funds but cannot evidence Zakat segregation, the correct response is No (not N/A).

### On Size Scaling

The reviewer confirms the org's size band at the start of the evaluation. If the size band was pre-populated from a verified Financial Snapshot, the reviewer may override it with a note. The size band selection is stored as part of the evaluation record and affects how the audit evidence criteria (2.1, 2.2) are interpreted.

### On Scholar Notes

Layer 5 responses should be cross-referenced with any published Scholar Notes on the organisation. If a scholar has flagged concerns about Shariah compliance in their notes, a Full response on Layer 5 criteria requires explicit justification from the reviewer.

---

## 16. Public Display Rules

The following are displayed on the public organisation profile:

| Item | Displayed |
|---|---|
| Current CTCF grade (badge) | Yes |
| Normalised total score | Yes |
| Layer breakdown (5 bars) | Yes |
| Individual criterion responses | No — reviewer input is not public |
| Reviewer identity | No |
| Certification date | Yes |
| Previous grade history (timeline) | Yes |
| Evaluation version used | Yes (`ctcf_v1` or `ctcf_v2`) |
| Scholar notes (if published) | Yes, where `is_publishable = true` |

---

## 17. Mapping to Amanah Index™ Input

After a `ctcf_v2` evaluation is completed and a certification decision is recorded, the `recalculate-amanah` Edge Function is triggered. It reads the following from the certification result:

| Amanah component | Derived from |
|---|---|
| `governanceScore` | Layer 1 pass + org approval status + Layer 5 normalised score |
| `financialTransparencyScore` | Layer 2 normalised score (scaled 0–100) |
| `projectTransparencyScore` | Layer 3 normalised score (scaled 0–100) |
| `impactEfficiencyScore` | Layer 4 normalised score (scaled 0–100) |
| `feedbackScore` | Phase 1: default 70; Phase 2: structured feedback questionnaire |

---

## 18. TypeScript Interface Changes (Implementation Reference)

The following shows the key interface differences from `ctcf_v1`. Full engine implementation is in `packages/scoring/src/ctcf.ts`.

```typescript
// v2 response type — replaces boolean inputs
export type CtcfResponse = 'full' | 'partial' | 'no' | 'na';

// Multipliers per response
export const RESPONSE_MULTIPLIER: Record<Exclude<CtcfResponse, 'na'>, number> = {
  full:    1.0,
  partial: 0.5,
  no:      0.0,
};

// Org size band — added to evaluation input
export type OrgSizeBand = 'micro' | 'small' | 'medium' | 'large';

export interface CtcfInput {
  sizeBand: OrgSizeBand;  // NEW in v2
  layer1: CtcfLayer1Input;
  layer2: CtcfLayer2Input_v2;
  layer3: CtcfLayer3Input_v2;
  layer4: CtcfLayer4Input_v2;
  layer5: CtcfLayer5Input_v2;
}

// Example: Layer 2 input (v2)
export interface CtcfLayer2Input_v2 {
  annualFinancialStatement: CtcfResponse;  // was: hasAnnualFinancialStatement: boolean
  auditEvidence:            CtcfResponse;  // was: hasAuditEvidence: boolean
  programAdminBreakdown:    CtcfResponse;  // was: hasProgramAdminBreakdown: boolean
  zakatSegregation:         CtcfResponse;  // was: hasZakatSegregation: boolean | null
}

// Layer 4 (v2) — KPI criterion expanded
export interface CtcfLayer4Input_v2 {
  kpiQualityAndTheoryOfChange: CtcfResponse;  // was: hasKpisDefined: boolean
  sustainabilityPlan:          CtcfResponse;  // was: hasSustainabilityPlan: boolean
  continuityTracking:          CtcfResponse;  // was: hasContinuityTracking: boolean
  impactPerCostMetric:         CtcfResponse;  // was: hasImpactPerCostMetric: boolean
}
```

---

## 19. Database Migration Notes

The `certification_evaluations` table stores the CTCF input and result as JSONB. No schema column changes are required — the new v2 input structure is stored in the same `evaluation_input` and `evaluation_result` JSONB columns. The `ctcf_version` column (`'ctcf_v1'` | `'ctcf_v2'`) already exists and correctly separates evaluation generations.

The `org_size_band` value should be stored inside the `evaluation_input` JSONB as `{ "sizeBand": "small", ... }`.

**No migration required on existing rows.** v1 rows remain as-is.

---

## 20. Evaluation Checklist for Reviewers

Before submitting a `ctcf_v2` evaluation:

- [ ] Org size band confirmed and recorded
- [ ] All Layer 1 gate criteria verified with document references
- [ ] Evidence staleness flags reviewed — stale evidence noted where it affected scoring
- [ ] N/A responses justified (not used to avoid No scores)
- [ ] Partial responses accompanied by a brief note explaining what is present and what is missing
- [ ] Scholar notes cross-referenced before completing Layer 5
- [ ] Score computed and grade confirmed
- [ ] Org alert status checked — no active `investigation_pending` or `suspended` alert
- [ ] Certification decision submitted (Grant / Do not certify)

---

## 21. Document Change Log

| Version | Date | Change |
|---|---|---|
| v1.0 | Feb 2026 | Initial CTCF specification (`ctcf_v1`) |
| v2.0 | Apr 2026 | Graduated scoring; org size bands; Theory of Change sub-criterion; evidence staleness; Layer 5 graduation; alert override; normalisation to 0–100; Layer 2 minimum adjusted to ≥10 |
