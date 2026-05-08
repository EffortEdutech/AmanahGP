# 00 Master SOP Register

**Document ID:** AGP-SOP-00-MASTER  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This master register lists the real-life operating SOPs required to run AGP from first onboarding to accounting, payment control, project evidence, donation reconciliation, CTCF certification, Amanah Index scoring, audit readiness, security, and seed-data QA.

## 2. Operating Lifecycle

```text
Organization registration → profile completion → bank/accounting setup → team and SoD setup → policy upload → public listing approval → live transactions → payment approvals → month close → projects and evidence → donations and webhooks → CTCF review → Amanah Index updates → annual audit/renewal
```

## 3. SOP File Index

| File | Coverage |
|---|---|
| 00_MASTER_SOP_REGISTER.md | SOP index, lifecycle, role map, control model |
| 01_ORGANIZATION_ONBOARDING_SOP.md | Registration, profile, bank, team, policies, listing |
| 02_ACCOUNTING_STARTUP_SOP.md | Opening balance, funds, chart of accounts, first transactions |
| 03_PAYMENT_REQUEST_APPROVAL_SOP.md | Payment requests, approvals, emergency, related party |
| 04_MONTHLY_CLOSE_SOP.md | Month-end, reconciliation, evidence, lock, governance pack |
| 05_PROJECT_REPORTING_EVIDENCE_SOP.md | Projects, reports, evidence, verification, completion |
| 06_DONATION_WEBHOOK_RECONCILIATION_SOP.md | Donation transaction, gateway webhook, confirmation, reconciliation |
| 07_CTCF_CERTIFICATION_REVIEW_SOP.md | Certification application, gate review, scoring, renewal |
| 08_AMANAH_INDEX_TRUST_EVENT_SOP.md | Trust events, score recalculation, history, downgrade/recovery |
| 09_POLICY_KIT_GOVERNANCE_SOP.md | Financial control, procurement, COI, zakat, waqf policies |
| 10_AUDIT_READINESS_SOP.md | Audit pack, sampling, findings, management response |
| 11_SECURITY_ACCESS_AUDIT_LOG_SOP.md | Access, roles, audit logs, privacy incident, RLS |
| 12_PLATFORM_SEED_DATA_QA_SOP.md | Seed preparation, FK validation, UI checks, known-good release |

## 4. Complete SOP Register

| SOP ID | SOP Name | Main owner | Main module/record |
|---|---|---|---|
| AGP-SOP-001 | New Organization Registration | Org Admin | organizations |
| AGP-SOP-002 | Organization Identity Verification | Org Admin + Reviewer | Profile / Console |
| AGP-SOP-003 | Organization Type Classification | Reviewer | org_type / oversight authority |
| AGP-SOP-004 | Oversight Authority Declaration | Org Admin | Profile |
| AGP-SOP-005 | Bank Account Setup | Treasurer | bank_accounts |
| AGP-SOP-006 | Fund Type Declaration | Treasurer | Funds |
| AGP-SOP-007 | Chart of Accounts Activation | Finance Officer | accounts |
| AGP-SOP-008 | Team Invitation and Role Setup | Org Admin | org_members |
| AGP-SOP-009 | Segregation of Duties | Org Admin / Treasurer | Members / Payment Requests |
| AGP-SOP-010 | Governance Policy Upload | Org Admin | Policy Kit / trust_events |
| AGP-SOP-011 | Onboarding Completion Review | Reviewer | Console |
| AGP-SOP-012 | Public Profile Listing Approval | Reviewer / Super Admin | listing_status |
| AGP-SOP-013 | Opening Balance Setup | Treasurer | Accounting |
| AGP-SOP-014 | Fund Segregation Setup | Treasurer / Shariah Reviewer | Funds |
| AGP-SOP-015 | First Transaction Recording | Finance Officer | journal_entries |
| AGP-SOP-016 | Donation Income Recording | Finance Officer | Donations / Transactions |
| AGP-SOP-017 | Expense Recording | Finance Officer | Transactions |
| AGP-SOP-018 | Receipt / Invoice Evidence | Finance Officer | Evidence |
| AGP-SOP-019 | Journal Entry Approval | Finance Manager | Accounting |
| AGP-SOP-020 | Accounting Correction | Finance Manager | Audit Logs |
| AGP-SOP-021 | Locked Period Adjustment | Treasurer / Trustee | Month Close |
| AGP-SOP-022 | Cash Collection | Treasurer | Accounting |
| AGP-SOP-023 | Cash Count Verification | Treasurer + Committee | Reconciliation |
| AGP-SOP-024 | Bank Reconciliation | Finance Officer | Bank Accounts |
| AGP-SOP-025 | Payment Request Creation | Requestor | payment_requests |
| AGP-SOP-026 | Payment Evidence Review | Finance Manager | Evidence |
| AGP-SOP-027 | Budget Availability Check | Finance Manager | Projects / Accounting |
| AGP-SOP-028 | Restricted Fund Payment | Treasurer / Shariah Reviewer | Funds |
| AGP-SOP-029 | Multi-Level Approval | Trustee / Committee | Payment Requests |
| AGP-SOP-030 | Payment Execution | Treasurer | Payment Requests |
| AGP-SOP-031 | Payment Rejection | Approver | Payment Requests |
| AGP-SOP-032 | Emergency Payment | Treasurer + Trustee | Payment Requests |
| AGP-SOP-033 | Related-Party Transaction | Org Admin / Reviewer | Governance |
| AGP-SOP-034 | Month-End Cut-Off | Finance Manager | Month Close |
| AGP-SOP-035 | Monthly Reconciliation | Finance Officer | Reconciliation |
| AGP-SOP-036 | Missing Evidence Review | Finance Manager | Reports / Evidence |
| AGP-SOP-037 | Restricted Fund Compliance Check | Treasurer / Shariah Reviewer | Funds |
| AGP-SOP-038 | Budget vs Actual Review | Finance Manager | Reports |
| AGP-SOP-039 | Monthly Journal Adjustment | Finance Manager | Journal Entries |
| AGP-SOP-040 | Month Close Approval | Finance Manager / Trustee | Month Close |
| AGP-SOP-041 | Monthly Governance Pack | Treasurer | Reports |
| AGP-SOP-042 | Monthly Committee Review | Org Admin / Committee | Dashboard |
| AGP-SOP-043 | New Project Creation | Org Manager | projects |
| AGP-SOP-044 | Project Budget Setup | Project Manager / Treasurer | Projects |
| AGP-SOP-045 | Project Public Visibility | Org Admin | Projects |
| AGP-SOP-046 | Project Donation Allocation | Finance Officer | Donations / Projects |
| AGP-SOP-047 | Project Progress Report | Project Manager | project_reports |
| AGP-SOP-048 | Project Evidence Upload | Project Manager | evidence_files |
| AGP-SOP-049 | Beneficiary Metrics | Project Manager | Reports |
| AGP-SOP-050 | Project Verification | Reviewer | Console |
| AGP-SOP-051 | Project Overdue Report | Org Manager / Reviewer | Trust Events |
| AGP-SOP-052 | Project Completion | Project Manager / Treasurer | Projects |
| AGP-SOP-053 | Project Closure and Learning | Org Admin | Reports |
| AGP-SOP-054 | Donation Checkout | Donor / System | AmanahHub |
| AGP-SOP-055 | Donation Transaction Creation | System | donation_transactions |
| AGP-SOP-056 | Payment Webhook Capture | System | payment_webhook_events |
| AGP-SOP-057 | Donation Confirmation | System / Finance | Donations |
| AGP-SOP-058 | Donation Reconciliation | Finance Officer | Accounting |
| AGP-SOP-059 | Failed Donation | System | Donations |
| AGP-SOP-060 | Duplicate Webhook | System / Admin | Webhook Events |
| AGP-SOP-061 | Donation Receipt | System / Org | AmanahHub |
| AGP-SOP-062 | Donation Refund / Reversal | Finance Manager | Donations / Accounting |
| AGP-SOP-063 | Evidence Upload | Org User | Evidence |
| AGP-SOP-064 | Evidence Metadata | Org User | Evidence |
| AGP-SOP-065 | Evidence Privacy Classification | Org Admin | Evidence |
| AGP-SOP-066 | Public Evidence Approval | Reviewer | Console |
| AGP-SOP-067 | Evidence Rejection | Reviewer | Console |
| AGP-SOP-068 | Evidence Replacement | Org Admin | Evidence |
| AGP-SOP-069 | Audit Evidence Export | Auditor / Reviewer | Console |
| AGP-SOP-070 | CTCF Readiness Check | Org Admin | Certification |
| AGP-SOP-071 | Certification Application | Org Admin | certification_applications |
| AGP-SOP-072 | Legal and Governance Gate Review | Reviewer | Console |
| AGP-SOP-073 | Financial Transparency Review | Reviewer / Auditor | Console |
| AGP-SOP-074 | Project Transparency Review | Reviewer | Console |
| AGP-SOP-075 | Impact and Sustainability Review | Reviewer | Console |
| AGP-SOP-076 | Shariah Governance Review | Shariah Reviewer | Console |
| AGP-SOP-077 | Changes Requested | Reviewer | Console |
| AGP-SOP-078 | Certification Approval | Reviewer / Super Admin | certification_history |
| AGP-SOP-079 | Certification Suspension | Super Admin | Console |
| AGP-SOP-080 | Certification Renewal | Org Admin / Reviewer | Certification |
| AGP-SOP-081 | Trust Event Creation | System / Reviewer | trust_events |
| AGP-SOP-082 | Trust Event Validation | Reviewer / System | Console |
| AGP-SOP-083 | Amanah Score Recalculation | System | Amanah Index |
| AGP-SOP-084 | Amanah History Append | System | amanah_index_history |
| AGP-SOP-085 | Amanah Score Explanation | System / Reviewer | Trust Score |
| AGP-SOP-086 | Score Downgrade | Reviewer / System | Trust Score |
| AGP-SOP-087 | Score Recovery | Reviewer / System | Trust Score |
| AGP-SOP-088 | Manual Recalculation | Super Admin | Console |
| AGP-SOP-089 | Reviewer Queue Triage | Reviewer | Console |
| AGP-SOP-090 | Reviewer Evidence Sampling | Reviewer | Console |
| AGP-SOP-091 | Reviewer Comment | Reviewer | Console |
| AGP-SOP-092 | Auditor Access | Super Admin | Console |
| AGP-SOP-093 | Audit Finding | Auditor | Console |
| AGP-SOP-094 | Shariah Escalation | Reviewer / Scholar | Console |
| AGP-SOP-095 | Super Admin Override | Super Admin | Console |
| AGP-SOP-096 | Reviewer Conflict of Interest | Super Admin | Console |
| AGP-SOP-097 | Financial Control Policy | Org Admin | Policy Kit |
| AGP-SOP-098 | Procurement Policy | Org Admin | Policy Kit |
| AGP-SOP-099 | Conflict of Interest Policy | Org Admin | Policy Kit |
| AGP-SOP-100 | Zakat Distribution | Shariah Reviewer / Org | Policy Kit |
| AGP-SOP-101 | Waqf Governance | Shariah Reviewer / Org | Policy Kit |
| AGP-SOP-102 | Document Retention | Org Admin | Policy Kit |
| AGP-SOP-103 | Annual Policy Review | Org Admin / Committee | Policy Kit |
| AGP-SOP-104 | User Invitation | Org Admin | Members |
| AGP-SOP-105 | User Removal | Org Admin | Members |
| AGP-SOP-106 | Role Change | Org Admin | Members |
| AGP-SOP-107 | Suspicious Activity | Super Admin | Audit Logs |
| AGP-SOP-108 | Audit Log Review | Super Admin | Audit Logs |
| AGP-SOP-109 | Data Correction | Super Admin / Reviewer | Console |
| AGP-SOP-110 | Privacy Incident | Super Admin | Console |
| AGP-SOP-111 | RLS Access Testing | Developer / Admin | Supabase / QA |
| AGP-SOP-112 | Annual Financial Snapshot | Treasurer | financial_snapshots |
| AGP-SOP-113 | Annual Statement Preparation | Treasurer | Reports |
| AGP-SOP-114 | Program vs Admin Ratio | Treasurer / Reviewer | Reports |
| AGP-SOP-115 | Zakat Utilisation Report | Treasurer / Shariah Reviewer | Reports |
| AGP-SOP-116 | Waqf Utilisation Report | Treasurer / Shariah Reviewer | Reports |
| AGP-SOP-117 | Annual Activity Report | Org Manager | Reports |
| AGP-SOP-118 | Audit Preparation | Treasurer / Auditor | Reports / Evidence |
| AGP-SOP-119 | Annual Certification Renewal | Org Admin / Reviewer | Certification |
| AGP-SOP-120 | Seed Data Management | Developer | Database |
| AGP-SOP-121 | Database Migration | Developer | Supabase |
| AGP-SOP-122 | Seed Validation | Developer | SQL |
| AGP-SOP-123 | Release Testing | Developer / QA | GitHub / Vercel |
| AGP-SOP-124 | Demo Environment Reset | Developer | Supabase |
| AGP-SOP-125 | Reviewer Training | Platform Operator | Console |
| AGP-SOP-126 | Org Training | Platform Operator | amanahOS |

## 5. Core Control Rules

- Every important operational claim must be supported by evidence.
- Evidence is private by default unless explicitly approved for public display.
- Trust events, Amanah Index history, and certification history are append-only.
- Donation transactions must exist before webhook events reference them.
- Payment requests must preserve segregation of duties.
- Month close must stop uncontrolled editing of closed periods.
- Reviewer decisions must include reasons, not only status changes.
- RLS must ensure one organization cannot access another organization's private records.
- Seed data must simulate real workflows, not isolated table inserts.

## 6. Recommended Implementation Order

1. Organization Onboarding SOP
2. Accounting Start-Up SOP
3. Payment Request Approval SOP
4. Monthly Close SOP
5. Project Reporting and Evidence SOP
6. Donation Webhook Reconciliation SOP
7. CTCF Certification Review SOP
8. Amanah Index Trust Event SOP
9. Audit Readiness SOP
10. Security Access Audit Log SOP
11. Policy Kit Governance SOP
12. Platform Seed Data QA SOP

## 7. Change Control

Any future SOP change must record the change date, changed by, reason, affected SOP ID, product/database impact, migration or seed impact, and reviewer approval where governance, scoring, access, or certification is affected.


---

# 01 Organization Onboarding SOP

**Document ID:** AGP-SOP-01-ONBOARDING  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP governs onboarding from first organization registration to approved public listing. It follows the real amanahOS onboarding journey: complete profile, add bank account, set chart of accounts, record first transaction, invite team member, upload governance policy, and enable public profile.

## 2. Scope

Applies to NGOs, mosques, surau, tahfiz, foundations, waqf bodies, Islamic institutions, and pilot/demo organizations using amanahOS.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Create or accept organization account invitation | Org Admin | Email, user account, organization name | Workspace exists |
| 2 | Complete organization profile | Org Admin | Name, legal name, registration number, address, contact email/phone, state, org type | Profile gate passes |
| 3 | Declare oversight authority | Org Admin | ROS, SIRC/MAIN, SSM, trustees, school board, or lawful authority | Oversight recorded |
| 4 | Declare fund types handled | Org Admin / Treasurer | Zakat, sadaqah, waqf, general, project, restricted funds | Fund classification recorded |
| 5 | Add bank/cash account | Treasurer | Bank/cash account details and active status | Bank step completed |
| 6 | Activate chart of accounts | Finance Officer / Treasurer | AGP Islamic nonprofit chart | Accounts step completed |
| 7 | Record first valid transaction | Finance Officer | Income or expense entry with evidence | Live ledger begins |
| 8 | Invite at least one additional active member | Org Admin | Treasurer, finance officer, committee member, or approver | SoD can operate |
| 9 | Upload governance policy | Org Admin | Financial control, procurement, COI, zakat, waqf, or retention policy | Policy evidence exists |
| 10 | Submit for review | Org Admin | Complete profile and evidence | Reviewer queue item |
| 11 | Review onboarding package | Reviewer | Profile, evidence, bank/accounting/team setup | Approved / changes requested / rejected |
| 12 | Approve public listing | Reviewer / Super Admin | Approved onboarding and safe public profile | Organization listed or kept private |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Organization profile | organizations |
| Membership | org_members |
| Bank account | bank_accounts |
| Chart of accounts | accounts |
| First transaction | journal_entries or equivalent accounting transaction |
| Policy signal | trust_events.event_type = gov_policy_uploaded |
| Listing status | organizations.listing_status |
| Review status | organizations.onboarding_status |
| Audit trail | audit_logs |

## 6. Acceptance Checklist

- [ ] Organization identity and contact details are complete.
- [ ] Organization type and oversight authority are declared.
- [ ] Fund types are declared accurately.
- [ ] At least one active bank/cash account exists.
- [ ] Chart of accounts is active.
- [ ] At least one real transaction is recorded.
- [ ] At least two active members exist for segregation of duties.
- [ ] At least one governance policy is uploaded.
- [ ] Reviewer comments are recorded when changes are requested.
- [ ] Public listing happens only after approval.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Approved + listed | Set onboarding approved and listing listed. |
| Approved + unlisted | Approve but keep private/unlisted. |
| Changes requested | Record specific missing evidence or correction required. |
| Rejected | Record clear reason and escalate if safety/legal issue exists. |
| Suspended | Freeze public listing and record audit log. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| No formal registration number | Reviewer records lawful operating basis and oversight alternative. |
| Mosque/surau under religious authority | Record relevant SIRC/MAIN/local committee oversight. |
| Bank account under personal name | Do not approve as fully compliant unless documented transitional exception exists. |
| One-person organization | Allow draft/private onboarding only; block full SoD readiness. |
| Duplicate organization | Super Admin resolves merge/reject/duplicate status. |

## 9. Exit Criteria

- [ ] All required onboarding steps are complete.
- [ ] Reviewer decision is recorded.
- [ ] Public listing decision is recorded.
- [ ] Relevant trust/audit events are created.
- [ ] Organization can proceed to live accounting, projects, and certification readiness.


---

# 02 Accounting Start-Up SOP

**Document ID:** AGP-SOP-02-ACCOUNTING-STARTUP  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP guides a newly onboarded organization to start proper Islamic nonprofit accounting inside amanahOS, including opening balances, fund segregation, chart of accounts, first transactions, document evidence, and correction controls.

## 2. Scope

Applies to all organizations starting live accounting, including those migrating from manual records or spreadsheet accounting.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Confirm accounting start date | Treasurer | Board/committee decision or operating start date | Accounting period begins |
| 2 | List bank and cash balances | Treasurer / Finance Officer | Bank statements, cash count, petty cash record | Opening balance schedule |
| 3 | Declare fund categories | Treasurer | General, sadaqah, zakat, waqf, restricted project, admin fund | Fund basis |
| 4 | Activate chart of accounts | Finance Officer | Standard AGP nonprofit chart | Accounts ready |
| 5 | Create opening balance entries | Finance Officer | Opening balance schedule | Ledger initialized |
| 6 | Record first income transaction | Finance Officer | Donation receipt/bank/gateway/cash count | Income posting |
| 7 | Record first expense transaction | Finance Officer | Invoice, receipt, approval, proof | Expense posting |
| 8 | Attach evidence | Finance Officer | Receipt, invoice, bank slip, payment proof | Evidence complete |
| 9 | Review initial ledger | Treasurer | Transaction list and balances | Startup review complete |
| 10 | Approve startup pack | Org Admin / Treasurer | Opening balances and first transactions | Accounting live |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Opening balance | Bank statements, cash count, opening balance schedule |
| Funds | General, sadaqah, zakat, waqf, project, restricted fund classification |
| Accounts | Active chart of accounts |
| Income | Donation receipt, bank credit, cash count, gateway record |
| Expense | Invoice, receipt, approval note, payment proof |
| Correction | Journal explanation and approval note |
| Audit trail | audit_logs |

## 6. Acceptance Checklist

- [ ] Accounting start date is approved.
- [ ] Opening balances are supported.
- [ ] Bank/cash accounts are organization-controlled or exception is documented.
- [ ] Fund types are defined before restricted transactions.
- [ ] Chart of accounts is active.
- [ ] At least one income or expense transaction is recorded.
- [ ] Evidence is attached to important transactions.
- [ ] Treasurer reviews the starting ledger.
- [ ] Any uncertainty is documented.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Wrong account | Create approved reclassification journal. |
| Wrong fund | Create correction with restricted-fund note. |
| Wrong project tag | Correct through adjustment/audit trail. |
| Duplicate transaction | Mark duplicate or reverse; do not silently delete after reporting. |
| Missing receipt | Flag as missing evidence until resolved. |
| Closed month error | Use locked-period adjustment SOP. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Existing accounting records incomplete | Start with documented opening balance and disclose limitation. |
| Zakat/waqf treatment unclear | Escalate to Shariah reviewer before posting. |
| Cash count difference | Investigate and approve adjustment before close. |
| Personal account used temporarily | Document transitional exception and target date for organization bank account. |

## 9. Exit Criteria

- [ ] Bank/cash accounts are active.
- [ ] Chart of accounts is active.
- [ ] Opening balance is recorded or marked not applicable.
- [ ] At least one transaction exists.
- [ ] Fund segregation is understood.
- [ ] Treasurer approves live accounting start.


---

# 03 Payment Request Approval SOP

**Document ID:** AGP-SOP-03-PAYMENT-REQUEST  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls how an organization requests, reviews, approves, executes, rejects, and documents payments while protecting donor funds through segregation of duties, evidence review, budget checks, and restricted-fund controls.

## 2. Scope

Applies to supplier payments, beneficiary aid, project expenses, utilities, operating expenses, emergency payments, reimbursements, and related-party transactions.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Create payment request | Requestor | Payee, amount, purpose, project, fund, due date | Draft request |
| 2 | Attach documents | Requestor | Invoice, quotation, memo, beneficiary support | Evidence package |
| 3 | Submit for review | Requestor | Complete request | Pending review |
| 4 | Check coding/completeness | Finance Officer | Account, fund, project, evidence, budget | Ready or changes requested |
| 5 | Check budget and restrictions | Treasurer / Finance Manager | Budget balance, fund restriction, Shariah notes | Financially valid |
| 6 | Approve by threshold | Approver / Trustee | Approval policy and evidence | Approved |
| 7 | Execute payment | Treasurer | Bank transfer, cheque, cash proof | Paid |
| 8 | Upload payment proof | Treasurer | Bank slip, transfer receipt, cheque copy | Payment evidence complete |
| 9 | Post accounting entry | Finance Officer | Payment request details and proof | Ledger updated |
| 10 | Reconcile payment | Finance Officer | Bank/cash statement | Reconciled |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Request | payment_requests |
| Evidence | Invoice, receipt, quotation, beneficiary support, approval memo |
| Budget | Project/fund budget check |
| Approval | Approver decision, timestamp, comment |
| Execution | Bank transfer/cheque/cash proof |
| Ledger | Accounting posting |
| Reconciliation | Bank/cash match |
| Audit trail | audit_logs |

## 6. Acceptance Checklist

- [ ] Payment purpose is clear.
- [ ] Payee details are complete.
- [ ] Required evidence is attached.
- [ ] Fund source is correct.
- [ ] Project tag is correct where applicable.
- [ ] Budget availability is checked.
- [ ] Restricted fund / zakat / waqf rules are checked.
- [ ] Approver is not the same person as requester where SoD is required.
- [ ] Payment proof is uploaded after execution.
- [ ] Accounting and reconciliation are completed.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Missing invoice/receipt | Changes requested with specific document list. |
| Wrong fund/project | Changes requested with correct coding required. |
| No budget | Reject or hold until budget approval. |
| Unclear beneficiary | Request beneficiary evidence with privacy protection. |
| Suspicious payee | Hold and escalate. |
| Related party not disclosed | Hold/reject until declaration and independent approval. |
| Zakat/waqf breach | Reject and record Shariah/control reason. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Emergency payment | Treasurer plus one authorized trustee may approve first; committee ratification follows. |
| Related-party transaction | Disclose, recuse conflicted person, document price reasonableness. |
| Payment after month close | Use locked-period adjustment/correction path. |
| Cash payment | Require cash voucher and recipient acknowledgment where suitable. |

## 9. Exit Criteria

- [ ] Request was approved according to policy.
- [ ] Payment was executed.
- [ ] Proof was uploaded.
- [ ] Ledger entry was posted.
- [ ] Bank/cash reconciliation confirms payment.
- [ ] Any exception or related-party note is auditable.


---

# 04 Monthly Close SOP

**Document ID:** AGP-SOP-04-MONTHLY-CLOSE  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP governs month-end closing so every month is complete, reconciled, reviewed, and protected from uncontrolled edits.

## 2. Scope

Applies to monthly financial closing for all live organizations and demo organizations that simulate operational accounting.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Announce month-end cut-off | Treasurer | Close calendar and period end date | Cut-off started |
| 2 | Review unposted/draft transactions | Finance Officer | Draft entries and pending payments | Complete transaction list |
| 3 | Record final income/expenses | Finance Officer | Donation, expenses, payment proof | Ledger complete |
| 4 | Perform bank reconciliation | Finance Officer | Bank statement, ledger, unreconciled list | Reconciliation report |
| 5 | Perform cash count reconciliation | Treasurer + Cash Counter | Cash count sheet | Cash confirmed |
| 6 | Review missing evidence | Finance Officer | Transactions without receipts/proof | Missing evidence report |
| 7 | Check restricted funds | Treasurer / Shariah Reviewer | Zakat, waqf, project, donor restrictions | Fund exception report |
| 8 | Review budget vs actual | Treasurer | Project budgets and actual spending | Variance report |
| 9 | Post monthly adjustments | Finance Officer | Accruals, reclassifications, corrections | Adjusted ledger |
| 10 | Generate governance pack | Treasurer | Financial, fund, project, exception reports | Monthly pack |
| 11 | Approve close | Treasurer / Committee | Governance pack and exceptions | Closed period |
| 12 | Lock/restrict period | System / Treasurer | Close status | Period protected |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Income/expense summary | Monthly financial activity |
| Fund balance report | General/restricted/zakat/waqf/project balances |
| Bank reconciliation | Bank balance confirmation |
| Cash count | Physical cash confirmation |
| Donation summary | Receipts and confirmations |
| Payment request summary | Approved/paid/rejected payments |
| Project budget vs actual | Project spending discipline |
| Missing evidence report | Documentation gaps |
| Restricted fund exception report | Misuse/risk alerts |
| Trust event summary | Governance signals for the month |

## 6. Acceptance Checklist

- [ ] All donation/gateway income is recorded or reconciled.
- [ ] All approved paid payment requests are posted.
- [ ] All bank accounts are reconciled.
- [ ] All cash accounts are counted and reconciled.
- [ ] Transactions without evidence are listed.
- [ ] Restricted funds are checked.
- [ ] Zakat and waqf movements are reviewed where applicable.
- [ ] Project budget vs actual is reviewed.
- [ ] Monthly adjustments are approved.
- [ ] Monthly governance pack is generated.
- [ ] Treasurer signs off.
- [ ] Closed period is locked or restricted.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Locked period error | Create locked-period adjustment; do not silently edit. |
| Large unexplained variance | Hold close until explanation is recorded. |
| Restricted fund deficit | Escalate to treasurer and Shariah reviewer. |
| Missing receipt | Keep on exception list until resolved. |
| Duplicate donation | Investigate before closing. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Bank statement unavailable | Close conditionally with documented reason. |
| Cash difference | Investigate, document, approve adjustment. |
| Unapproved payment | Exclude or flag until approved. |
| Late transaction | Record according to cut-off policy and disclose if material. |

## 9. Exit Criteria

- [ ] Bank/cash reconciliation is complete.
- [ ] Evidence exceptions are listed.
- [ ] Fund compliance is reviewed.
- [ ] Monthly reports are generated.
- [ ] Treasurer/committee approves the close.
- [ ] Period is locked/restricted.
- [ ] Audit logs exist for sensitive adjustments.


---

# 05 Project Reporting and Evidence SOP

**Document ID:** AGP-SOP-05-PROJECTS-EVIDENCE  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls how organizations create projects, allocate budgets and donations, submit progress reports, upload evidence, and complete projects for donor transparency, CTCF scoring, and Amanah Index trust signals.

## 2. Scope

Applies to Ramadan aid, asnaf/zakat distribution, mosque renovation, tahfiz support, medical aid, waqf projects, disaster relief, public campaigns, and restricted donor projects.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Create project profile | Project Manager | Title, objective, location, beneficiary summary | Draft project |
| 2 | Set project budget | Project Manager / Treasurer | Budget, fund source, start/end dates | Budget baseline |
| 3 | Define KPI targets | Project Manager | Beneficiary count, meals, students, repairs, units | Impact baseline |
| 4 | Decide visibility | Org Admin | Public/private flag and donor-safe content | Visibility status |
| 5 | Allocate donations/funds | Finance Officer | Donation transactions, fund transfer, project tag | Funding trace |
| 6 | Record project expenses | Finance Officer | Payment requests, invoices, receipts, project coding | Actual cost trace |
| 7 | Prepare progress report | Project Manager | Narrative, KPI progress, budget vs actual | Draft report |
| 8 | Upload evidence | Project Manager | Photos, receipts, beneficiary proof, location proof | Evidence package |
| 9 | Submit for verification | Project Manager / Org Admin | Complete report and evidence | Submitted report |
| 10 | Review report/evidence | Reviewer | Completeness, credibility, privacy, public-safety | Verified/changes/rejected |
| 11 | Publish approved update | System / Reviewer | Verified report and public evidence | Public trust update |
| 12 | Complete project | Project Manager / Org Admin | Final report, final financials, remaining fund treatment | Completed project |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Project profile | Title, objective, location, budget, KPI, timeline, visibility |
| Financial evidence | Receipt, invoice, payment proof, budget vs actual |
| Activity evidence | Photos, delivery records, attendance, contractor report |
| Beneficiary evidence | Anonymized list, asnaf category, family count |
| Location evidence | Address, site photo, geo metadata where safe |
| Completion evidence | Final photos, delivery confirmation, final report |

## 6. Acceptance Checklist

- [ ] Project profile is complete.
- [ ] Budget and fund source are recorded.
- [ ] Report date and period are clear.
- [ ] Activities are described.
- [ ] KPI progress is measurable.
- [ ] Budget vs actual is updated.
- [ ] Evidence is attached to correct report.
- [ ] Sensitive information is not public by mistake.
- [ ] Reviewer decision and comment are recorded.
- [ ] Public evidence is approved separately from upload.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Verified | Report is credible, complete, evidence-supported. |
| Changes requested | Mostly acceptable but missing data/evidence. |
| Rejected | Unsupported, misleading, unsafe, or inconsistent. |
| Reviewer-only | Evidence valid but not safe for public. |
| Public approved | Evidence safe, relevant, and suitable for donors. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Overdue report | Flag, notify organization, possible trust event, clear after verified report. |
| Sensitive beneficiaries | Anonymize or keep evidence private. |
| Remaining project funds | Document reallocation/refund/carry-forward policy. |
| Cancelled project | Document reason, expenses, remaining funds, donor handling. |

## 9. Exit Criteria

- [ ] Project public profile is accurate.
- [ ] Budget/fund/expense trace exists.
- [ ] Progress reports are submitted.
- [ ] Evidence is verified.
- [ ] Public evidence is explicitly approved.
- [ ] Final closure report exists where completed.


---

# 06 Donation Webhook Reconciliation SOP

**Document ID:** AGP-SOP-06-DONATION-WEBHOOK  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls donation creation, gateway webhook capture, confirmation, reconciliation, receipts, and trust signals. It prevents invalid webhook rows that reference missing donation transactions.

## 2. Scope

Applies to AmanahHub donation checkout, external payment gateways, webhook tables, reconciliation, donation receipts, refunds, reversals, and seed-data simulation.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Donor selects organization/project | Donor | Org ID, optional project ID, amount, donor email | Checkout intent |
| 2 | Create donation transaction | System | donation_transactions record with pending status | Donation ID exists |
| 3 | Redirect to gateway | System | Gateway checkout/session ID | Payment in progress |
| 4 | Receive webhook | System | Gateway event ID, payload, headers, signature | Webhook captured |
| 5 | Validate signature | System | Gateway signature rules | Valid/invalid |
| 6 | Match webhook to donation | System | Gateway checkout ID/transaction ID/internal donation ID | Matched donation |
| 7 | Update donation status | System | Confirmed/failed/cancelled/refunded | Status updated |
| 8 | Create trust event for confirmed donation | System | donation_confirmed event | Trust signal |
| 9 | Record accounting income | Finance Officer / System | Donation amount, fee, fund/project coding | Ledger entry |
| 10 | Reconcile settlement | Finance Officer | Gateway settlement, bank statement, donation list | Reconciled |
| 11 | Issue receipt/confirmation | System / Org | Receipt/email confirmation | Donor confirmation |
| 12 | Review exceptions | Treasurer / Super Admin | Failed, duplicate, unmatched, refund, chargeback | Exception resolved |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Donation transaction | donation_transactions must exist before webhook references it |
| Webhook event | payment_webhook_events with valid donation_transaction_id |
| Gateway uniqueness | gateway + event_id or transaction ID |
| Accounting | Donation income and fee where applicable |
| Settlement | Gateway settlement and bank statement |
| Trust event | Created only after confirmed donation |
| Audit trail | Manual correction and override logs |

## 6. Acceptance Checklist

- [ ] Every webhook with donation reference points to an existing donation transaction.
- [ ] Every successful payment has one confirmed donation record.
- [ ] Duplicate webhook events do not duplicate donation income.
- [ ] Failed payments are not counted as donations.
- [ ] Settlement amount matches donation list after fees/timing.
- [ ] Bank deposit is matched to settlement.
- [ ] Refunds and reversals are documented.
- [ ] Donor privacy is protected.
- [ ] Trust event is created only after confirmed donation.
- [ ] Manual correction has audit log.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Valid payment success | Mark confirmed and create trust event. |
| Payment failure | Mark failed; no income/trust confirmation. |
| Duplicate webhook | Mark duplicate/processed; do not repost. |
| Unknown donation ID | Store unmatched safely; do not attach invalid FK. |
| Invalid signature | Reject or security-review; do not update donation. |
| Refund/reversal | Create reversal entry and update status. |
| Chargeback/dispute | Escalate to treasurer and super admin. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Gateway timeout | Keep pending until confirmed or expired. |
| Unmatched settlement | Investigate gateway ID, amount, date, donor reference. |
| Seed data FK risk | Insert donation_transactions before payment_webhook_events. |
| Privacy concern | Do not expose donor personal details publicly. |

## 9. Exit Criteria

- [ ] Donation transaction exists.
- [ ] Webhook is captured and validated.
- [ ] Donation status is updated.
- [ ] Accounting entry is recorded.
- [ ] Settlement is reconciled.
- [ ] Receipt is available where applicable.
- [ ] Trust event exists only for confirmed donation.


---

# 07 CTCF Certification Review SOP

**Document ID:** AGP-SOP-07-CTCF-CERTIFICATION  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP governs CTCF application, gate review, weighted scoring, certification decision, renewal, suspension, and public-safe publication.

## 2. Scope

Applies to formal certification review for organizations seeking Silver, Gold, Platinum, conditional, rejected, suspended, or renewed certification status.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Run readiness check | Org Admin | Checklist and dashboard readiness | Ready/not ready |
| 2 | Create certification application | Org Admin | Application record | Draft |
| 3 | Attach evidence | Org Admin / Treasurer | Legal, governance, financial, project, impact, Shariah evidence | Evidence package |
| 4 | Submit application | Org Admin | Declaration and complete evidence | Submitted |
| 5 | Assign reviewer | Super Admin / System | Reviewer availability and no conflict | Assigned |
| 6 | Perform legal/governance gate review | Reviewer | Registration, bylaws, board, COI, bank separation | Gate pass/fail |
| 7 | Perform weighted scoring | Reviewer | Financial, project, impact, Shariah criteria | Score |
| 8 | Request clarification | Reviewer | Specific missing evidence/comment | Changes requested |
| 9 | Escalate where needed | Reviewer | Financial or Shariah issue | Specialist input |
| 10 | Record decision | Reviewer / Super Admin | Score, grade, notes, valid dates | Certification history |
| 11 | Publish public-safe result | System / Reviewer | Grade/status and summary | Public status |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Application | certification_applications |
| Evaluation | certification_evaluations |
| History | certification_history |
| Evidence | Legal, governance, finance, project, impact, Shariah evidence |
| Reviewer notes | Decision notes and changes requested |
| Trust event | certification_updated where applicable |
| Audit log | Decision and override trail |

## 6. Acceptance Checklist

- [ ] Legal registration or lawful basis is provided.
- [ ] Governing instrument exists where applicable.
- [ ] Board/committee/trustees are identified.
- [ ] COI policy/declaration exists.
- [ ] Bank separation exists or exception is documented.
- [ ] Financial statement/audit evidence exists where applicable.
- [ ] Project budgets/reports/evidence exist.
- [ ] Impact targets or outcomes are recorded.
- [ ] Zakat/waqf/Shariah governance is reviewed where applicable.
- [ ] Decision reason and score are recorded.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Certified | Gate passes and score meets threshold. |
| Certified with condition | Minor non-blocking issue with deadline. |
| Changes requested | Missing evidence or scoring cannot be completed. |
| Not certified | Gate fails or score below threshold. |
| Suspended | Serious new risk after certification. |
| Expired | Validity period ends without renewal. |
| Withdrawn | Organization withdraws application. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Criterion not applicable | Exclude from denominator only with justification. |
| Reviewer conflict of interest | Reassign reviewer. |
| Fake evidence suspected | Hold review and escalate. |
| Major Shariah concern | Escalate to Shariah reviewer/scholar. |
| Public evidence unsafe | Keep private even if certification approved. |

## 9. Exit Criteria

- [ ] Application has final status.
- [ ] Evaluation score and notes are recorded.
- [ ] Certification history is appended, not overwritten.
- [ ] Evidence references are preserved.
- [ ] Public-safe status is updated.
- [ ] Organization receives actionable result.


---

# 08 Amanah Index Trust Event SOP

**Document ID:** AGP-SOP-08-AMANAH-INDEX  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls trust event creation, validation, Amanah Index recalculation, score history append, public explanation, downgrade, recovery, and manual recalculation.

## 2. Scope

Applies to trust_events, amanah_index_history, public trust cards, certification updates, project reports, donation confirmations, complaints, audit findings, and manual recalculation.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Detect eligible event | System / Reviewer | Report verified, financial verified, policy uploaded, donation confirmed, complaint resolved | Candidate event |
| 2 | Validate event source | System / Reviewer | Evidence, status, actor, source table, idempotency key | Valid or rejected |
| 3 | Append trust event | System | trust_events record | Immutable event |
| 4 | Recalculate score | System | Current scoring version and component inputs | New score |
| 5 | Append score history | System | amanah_index_history | Timeline updated |
| 6 | Generate public summary | System / Reviewer | Plain-language reason | Donor-facing explanation |
| 7 | Review unusual movement | Reviewer / Super Admin | Large jump/drop, manual/disputed event | Approved/corrected |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Trust event | trust_events with type, source, organization, timestamp |
| Score history | amanah_index_history with score, version, reason |
| Public summary | Public-safe reason for change |
| Audit log | Manual or sensitive change |
| Source record | Report, donation, certification, complaint, policy, audit finding |

## 6. Acceptance Checklist

- [ ] Every trust event has organization ID.
- [ ] Source event is traceable.
- [ ] Duplicate event is prevented or harmless.
- [ ] Score value is between 0 and 100.
- [ ] Score version is recorded.
- [ ] Score history is append-only.
- [ ] Public summary is safe.
- [ ] Manual recalculation is auditable.
- [ ] Downgrade and recovery have clear reasons.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Positive verified event | Append event and recalculate. |
| Negative event | Append event, recalculate, provide recovery path. |
| Duplicate event | Ignore or mark duplicate without second score effect. |
| Manual recalc | Require reason, actor, audit log, score version. |
| Disputed event | Hold public explanation or add reviewer note until resolved. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Webhook replay | Use idempotency key. |
| Report verified twice | Use report ID + verification event key. |
| Formula version change | Create new score version; do not overwrite history. |
| Public-sensitive reason | Use public-safe summary only. |
| Score stuck across many orgs | Check component inputs and event diversity. |

## 9. Exit Criteria

- [ ] Valid event exists.
- [ ] Score recalculation is completed.
- [ ] Score history is appended.
- [ ] Audit trail exists for sensitive events.
- [ ] Public-safe summary is available where score is public.


---

# 09 Policy Kit Governance SOP

**Document ID:** AGP-SOP-09-POLICY-KIT  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP governs how organizations adopt, upload, review, and maintain governance policies in AGP. Policy completeness supports onboarding, CTCF, Amanah Index, audit readiness, and donor trust.

## 2. Scope

Applies to financial control, procurement, conflict-of-interest, zakat, waqf, document retention, privacy, and emergency aid policies.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Select required template | Org Admin | Policy Kit template | Draft policy |
| 2 | Customize to organization reality | Org Admin / Treasurer | Thresholds, roles, approval matrix, fund rules | Usable draft |
| 3 | Review Shariah-sensitive sections | Shariah Reviewer | Zakat/waqf/asnaf wording | Shariah-ready draft |
| 4 | Approve internally | Committee / Trustees | Meeting minute or approval record | Approved policy |
| 5 | Upload policy | Org Admin | PDF/document and metadata | Policy evidence |
| 6 | Record trust event | System | gov_policy_uploaded or relevant event | Trust signal |
| 7 | Use policy operationally | All users | Payment, procurement, accounting, evidence workflows | Control active |
| 8 | Review annually | Org Admin / Committee | Review checklist and changes | Updated policy |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Financial control policy | Bank, cash, approvals, records |
| Procurement policy | Quotation, vendor, approval rules |
| Conflict-of-interest policy | Declaration, recusal, independent approval |
| Zakat policy | Asnaf eligibility, approval, evidence, reporting |
| Waqf policy | Restrictions, trustee duties, asset/fund tracking |
| Document retention policy | Retention period and privacy |
| Privacy policy | Donor/beneficiary data protection |
| Approval record | Committee/trustee approval minute |

## 6. Acceptance Checklist

- [ ] Required policies exist.
- [ ] Policies are approved by authorized body/person.
- [ ] Roles and thresholds match actual operations.
- [ ] Restricted fund rules are clear.
- [ ] Zakat/waqf requirements are accurate where applicable.
- [ ] COI process is usable.
- [ ] Emergency exceptions are documented.
- [ ] Policy files are uploaded with metadata.
- [ ] Old versions are retained/archived.
- [ ] Major changes are communicated to users.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Policy accepted | Use as onboarding/certification evidence. |
| Policy incomplete | Request changes with missing sections listed. |
| Policy outdated | Require annual review or updated version. |
| Shariah section unclear | Escalate to Shariah reviewer. |
| Policy contradicts practice | Flag audit finding or changes requested. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Small informal organization | Allow simple policy version but still require basic controls. |
| Authority-issued policy | Accept if relevant and current. |
| No committee minutes | Require written approval/declaration alternative. |
| Emergency policy absent | Require after first emergency exception. |

## 9. Exit Criteria

- [ ] Required policies exist.
- [ ] Policies are internally approved.
- [ ] Policies are uploaded as evidence.
- [ ] Policies are used in workflows.
- [ ] Policies are reviewed at least annually.
- [ ] Reviewer can rely on them for CTCF/Amanah evidence.


---

# 10 Audit Readiness SOP

**Document ID:** AGP-SOP-10-AUDIT-READINESS  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP prepares organizations for financial, governance, project, and Shariah audit or review by organizing evidence, accounting records, approvals, reports, and audit trails.

## 2. Scope

Applies to annual audit preparation, certification review, Shariah review, internal committee review, and platform reviewer sampling.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Treasurer | Owns bank, fund, accounting, payment, reconciliation, and financial integrity controls. |
| Finance Officer | Records transactions, prepares evidence, coding, reconciliations, and reports. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Confirm audit/review period | Org Admin / Treasurer | Financial year or review scope | Scope agreed |
| 2 | Close monthly periods | Treasurer | Month close records | Closed ledger |
| 3 | Prepare financial statements | Treasurer / Finance Officer | Income, expenses, fund balance, cash/bank summary | Financial pack |
| 4 | Prepare bank reconciliation pack | Finance Officer | Bank statements and reconciliation reports | Bank evidence |
| 5 | Prepare transaction evidence pack | Finance Officer | Receipts, invoices, approvals, payment proof | Transaction evidence |
| 6 | Prepare fund restriction schedule | Treasurer / Shariah Reviewer | Zakat, waqf, sadaqah, project fund balances | Fund pack |
| 7 | Prepare project evidence pack | Project Manager | Reports, photos, beneficiary metrics, completion evidence | Project pack |
| 8 | Prepare governance pack | Org Admin | Policies, minutes, committee list, COI declarations | Governance pack |
| 9 | Run exception report | Treasurer | Missing evidence, unreconciled items, related-party transactions | Exception list |
| 10 | Submit to auditor/reviewer | Org Admin | Complete audit pack and access | Audit starts |
| 11 | Respond to findings | Org Admin / Treasurer | Management response and corrective action | Finding resolution |
| 12 | Record final audit output | Auditor / Reviewer | Report, findings, recommendations | Audit history |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Organization profile | Registration, constitution, committee/trustee list |
| Policies | Financial control, procurement, COI, zakat, waqf, retention |
| Financial statements | Income/expense, fund balance, cash/bank summary |
| Bank/cash | Statements, reconciliations, cash count |
| Transactions | Ledger, receipts, invoices, approvals |
| Donations | Donation list, gateway settlement, receipts |
| Restricted funds | Zakat/waqf/project movement and balances |
| Projects | Budgets, reports, KPI, evidence |
| Trust/certification | CTCF records, Amanah Index history |
| Audit logs | Sensitive actions, corrections, overrides |

## 6. Acceptance Checklist

- [ ] All months in period are closed or explained.
- [ ] Bank reconciliation is complete.
- [ ] Cash counts are complete.
- [ ] Financial statements are generated.
- [ ] Restricted fund schedule is complete.
- [ ] Evidence files are organized.
- [ ] Project reports and closure files exist.
- [ ] Governance policies are current.
- [ ] COI declarations are available.
- [ ] Donation/gateway reconciliation is complete.
- [ ] Audit logs are available.
- [ ] Exception list is prepared.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Observation | Record improvement opportunity. |
| Minor finding | Correct within agreed period. |
| Major finding | Immediate corrective action required. |
| Critical finding | Escalate; possible suspension. |
| Resolved | Record closure evidence. |
| Repeated finding | Escalate risk level. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Incomplete historical records | Disclose limitation and start current-period controls. |
| Beneficiary privacy risk | Use anonymized evidence for audit pack. |
| Shariah-sensitive issue | Escalate to Shariah reviewer. |
| External auditor needs access | Provide read-only and log access. |

## 9. Exit Criteria

- [ ] Auditor/reviewer can trace balances to records.
- [ ] Records can be traced to evidence.
- [ ] Restricted funds are explainable.
- [ ] Project claims are supported.
- [ ] Exceptions are disclosed.
- [ ] Management response process exists.


---

# 11 Security Access and Audit Log SOP

**Document ID:** AGP-SOP-11-SECURITY-ACCESS  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls user access, role changes, removals, suspicious activity, audit log review, privacy incidents, and RLS testing.

## 2. Scope

Applies to organization users, reviewers, Shariah reviewers, auditors, super admins, public users, and seed/demo accounts.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Org Admin | Owns organization submission, declarations, internal coordination, and final approval inside the organization. |
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Auditor | Performs independent review, sampling, findings, and assurance recommendations. |
| Shariah Reviewer | Reviews zakat, waqf, asnaf, restricted donor intention, and Shariah-sensitive controls. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Identify user need | Org Admin | Role, email, reason | Access request |
| 2 | Select least-privilege role | Org Admin | Role matrix | Role selected |
| 3 | Send invitation | Org Admin / System | Email and organization ID | Invitation created |
| 4 | User accepts invitation | User | Auth account | Membership active |
| 5 | Verify active member count | Org Admin | Members list | SoD readiness |
| 6 | Record audit log | System | Invitation and acceptance event | Traceability |
| 7 | Remove/deactivate user when needed | Org Admin | Resignation, committee change, suspected misuse | Access removed |
| 8 | Review recent sensitive actions | Org Admin / Super Admin | Audit logs | Risk review |
| 9 | Reassign pending work | Org Admin | Open tasks/approvals/reports | Operational continuity |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Membership | org_members |
| Invitation | org_invitations where used |
| Role change | Old role, new role, actor, reason |
| Audit logs | Sensitive actions and overrides |
| Evidence privacy | visibility and public approval fields |
| Incident record | Privacy/security issue record |
| RLS test result | Access test evidence |

## 6. Acceptance Checklist

- [ ] Users access only their organizations.
- [ ] Roles follow least privilege.
- [ ] Sensitive role changes are reviewed.
- [ ] Departed users are removed promptly.
- [ ] Bank/payment/evidence/certification changes are logged.
- [ ] Private evidence is not public by default.
- [ ] Super admin override is documented.
- [ ] RLS tests pass after schema/policy changes.
- [ ] Privacy incidents are contained and documented.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| User invitation | Invite only with business need and correct role. |
| User removal | Deactivate and reassign tasks promptly. |
| Role change | Record reason and preserve SoD. |
| Suspicious activity | Preserve logs, restrict access if needed, investigate. |
| Privacy incident | Contain exposure, preserve evidence, assess severity, notify if required. |
| RLS failure | Block release and fix policy before production. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Emergency access | Grant temporary least-privilege access and expiry. |
| Committee transition | Review all roles after AGM/committee change. |
| Seed/demo accounts | Clearly label and isolate from production. |
| Public evidence mistake | Immediately remove public flag and investigate. |

## 9. Exit Criteria

- [ ] Memberships are accurate.
- [ ] Role privileges are least-privilege.
- [ ] Audit logs exist for sensitive actions.
- [ ] Privacy incidents are handled quickly.
- [ ] RLS tests pass after relevant changes.


---

# 12 Platform Seed Data QA SOP

**Document ID:** AGP-SOP-12-SEED-QA  
**Project:** Amanah Governance Platform (AGP) / amanahOS / AmanahHub / Amanah Console  
**Version:** v1.0  
**Date:** 2026-04-27  
**Owner:** Darya Malak / Amanah Governance Platform  
**Status:** Draft v1.0 for operating use  

---

## Document Control

| Item | Detail |
|---|---|
| Classification | Internal operating SOP |
| Operating principle | Evidence-first, private-by-default, role-based, append-only trust history |
| Review cycle | Quarterly during pilot; annually after stabilization |
| Primary users | Organization admins, treasurers, finance officers, reviewers, auditors, Shariah reviewers, platform operators |

---
## 1. Purpose

This SOP controls how AGP development/staging SQL seed packs are prepared, validated, corrected, and approved. It responds directly to the seed-building lesson that incomplete core-only seeds and invalid FK ordering can break realistic platform testing.

## 2. Scope

Applies to all local, staging, demo, and regression seed packs, including core-only, operational, full simulation, external accounting, and no-comments SQL packs.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Reviewer | Checks evidence, decisions, public approval, CTCF scoring, and trust-related actions. |
| Super Admin | Handles platform exceptions, overrides, suspensions, incident review, and policy/version control. |
| System | Stores records, enforces statuses, creates audit logs/trust events, and protects access through RLS. |

## 4. Main Procedure

| Step | Action | Owner | Required record/evidence | Output |
|---:|---|---|---|---|
| 1 | Confirm target schema version | Developer | Latest schema file and migrations | Schema baseline |
| 2 | Select seed scenario | Product Owner / Developer | Core, operational, full simulation, regression | Scenario definition |
| 3 | Reserve ID/prefix range | Developer | Pack code, org range, gateway IDs, idempotency keys | Collision prevention |
| 4 | Draft in dependency order | Developer | SQL inserts with valid FKs | Draft SQL |
| 5 | Remove comments if required | Developer | Production-ready SQL | Nocomments file |
| 6 | Run local dry-run | Developer | Supabase local/staging database | Execution result |
| 7 | Run FK validation queries | Developer | Anti-orphan SQL checks | FK clean result |
| 8 | Run idempotency/re-run test | Developer | Same SQL re-run where ON CONFLICT expected | Safe re-run result |
| 9 | Open apps and verify UI | QA / Developer | amanahOS, AmanahHub, Console | Functional check |
| 10 | Check free-tier size | Developer | Row counts/storage estimate | Free-tier assessment |
| 11 | Package and version file | Developer | Versioned filename and known-good note | Seed release |
| 12 | Record known-good status | Developer / Super Admin | Known-good seed register | Approved seed pack |

## 5. Required Records / Evidence

| Area | Required record / evidence |
|---|---|
| Required sequence | users → organizations → org_members → bank/accounts → projects → reports → evidence → donation_transactions → payment_webhook_events → financial_snapshots → certification → trust_events → amanah_index_history → audit_logs |
| Naming convention | NN.N_agp_pack_<name>_<scope>_<scenario>_FINAL_NOTEMP_vX_nocomments.sql |
| Validation SQL | Anti-orphan, duplicate, row count, idempotency checks |
| UI verification | amanahOS dashboard, accounting, projects, trust, certification, public directory, console queues |
| Known-good register | Version, date, schema, run result, limitations |

## 6. Acceptance Checklist

- [ ] Organizations have varied onboarding statuses.
- [ ] Organizations have varied listing statuses.
- [ ] Amanah scores are not all identical.
- [ ] CTCF/certification statuses are varied.
- [ ] Some organizations are approved/listed.
- [ ] Some are submitted/private.
- [ ] Some are draft/private.
- [ ] Users and org members can access simulated organizations where auth permits.
- [ ] Accounting/dashboard modules have meaningful data.
- [ ] Projects, reports, and evidence create realistic flows.
- [ ] Donation and webhook events are consistent.
- [ ] Trust events and Amanah history align with state.
- [ ] Audit logs exist for important actions.
- [ ] Seed size is safe for free-tier staging/demo use.

## 7. Decision Rules

| Situation | Required handling |
|---|---|
| Known-good | SQL runs cleanly, validation passes, UI works, row counts safe. |
| Needs correction | Any FK orphan, duplicate critical ID, UI crash, or unrealistic flat score. |
| Not safe for staging | Breaks RLS, exposes private data, exceeds free-tier, or cannot re-run safely. |
| Core-only limitation | Clearly label that it does not test full workflows. |

## 8. Exception Handling

| Exception | Handling |
|---|---|
| Webhook FK error | Insert donation_transactions before payment_webhook_events. |
| Amanah score stuck | Add diverse trust events/history/component inputs. |
| ON CONFLICT skipped parent | Validate parent exists before child inserts. |
| Free-tier concern | Reduce row counts, evidence blobs, and long histories. |
| Schema drift | Update seed to latest column/table names before running. |

## 9. Exit Criteria

- [ ] Seed pack runs without error.
- [ ] Critical validation queries return zero orphan rows.
- [ ] App UI verifies intended scenarios.
- [ ] Known-good status is recorded.
- [ ] Any limitation is documented clearly.

## 10. Required Validation SQL

Expected result for every query below: **0 rows**.


```sql
-- 1) Webhook orphan check
select pwe.id, pwe.donation_transaction_id
from payment_webhook_events pwe
left join donation_transactions dt on dt.id = pwe.donation_transaction_id
where pwe.donation_transaction_id is not null and dt.id is null;

-- 2) Org member orphan check
select om.id, om.organization_id, om.user_id
from org_members om
left join organizations o on o.id = om.organization_id
left join users u on u.id = om.user_id
where o.id is null or u.id is null;

-- 3) Project orphan check
select p.id, p.organization_id
from projects p
left join organizations o on o.id = p.organization_id
where o.id is null;

-- 4) Report orphan check
select pr.id, pr.organization_id, pr.project_id
from project_reports pr
left join organizations o on o.id = pr.organization_id
left join projects p on p.id = pr.project_id
where o.id is null or p.id is null;

-- 5) Amanah history orphan check
select aih.id, aih.organization_id, aih.computed_from_event_id
from amanah_index_history aih
left join organizations o on o.id = aih.organization_id
left join trust_events te on te.id = aih.computed_from_event_id
where o.id is null or (aih.computed_from_event_id is not null and te.id is null);
```

## 11. Critical Operating Sequence

```text
users → organizations → org_members → bank/accounts → projects → project_reports → evidence_files → donation_transactions → payment_webhook_events → financial_snapshots → certification records → trust_events → amanah_index_history → audit_logs
```

**Rule:** donation transaction first, webhook second, trust event after confirmation.
