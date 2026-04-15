// apps/org/lib/policy-templates.ts
// Sprint 22 — Policy Kit Template Definitions
//
// 7 governance policy templates for Malaysian mosques and NGOs.
// Each template provides:
//   - document_type key (matches org_documents.document_type)
//   - Display metadata
//   - Full template content (Bahasa Malaysia + English)
//   - CTCF layer connection
//   - Trust event points
//   - Applicable org types

export interface PolicyTemplate {
  id:            string;        // document_type value
  title:         string;
  titleBM:       string;
  category:      'governance' | 'financial' | 'shariah' | 'operations' | 'data';
  ctcfLayer:     string;
  ctcfCriterion: string;
  trustPts:      number;        // gov_policy_uploaded points
  emoji:         string;
  description:   string;
  appliesToTypes?: string[];    // if set, only show for these org fund_types
  required:      boolean;       // required for CTCF Layer 1 gate?
  template:      string;        // pre-filled template text for preview
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. Financial Control Policy
  // ─────────────────────────────────────────────────────────────
  {
    id:            'financial_control_policy',
    title:         'Financial Control Policy',
    titleBM:       'Dasar Kawalan Kewangan',
    category:      'financial',
    ctcfLayer:     'Layer 2',
    ctcfCriterion: 'Annual financial statement + programme/admin breakdown',
    trustPts:      15,
    emoji:         '💰',
    required:      false,
    description:   'Defines how financial transactions are authorised, recorded, and reviewed. Covers segregation of duties, approval thresholds, and reporting requirements.',
    template: `FINANCIAL CONTROL POLICY
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
This policy establishes internal financial controls to ensure all funds are managed transparently, in accordance with amanah principles and applicable Malaysian regulations.

2. SCOPE
This policy applies to all committee members, staff, volunteers, and any person handling funds on behalf of the organisation.

3. SEGREGATION OF DUTIES
- No single person shall control more than one of: authorise, record, and custody of funds.
- The person who raises a payment request shall not be the same person who approves it.
- All bank signatories shall be held by at least 2 committee members.

4. APPROVAL THRESHOLDS
- Below RM1,000: Treasurer approval
- RM1,000 – RM10,000: Treasurer + Committee Chairman approval
- Above RM10,000: Full committee approval required

5. RECEIPTS AND DOCUMENTATION
- Every expense must be supported by an original receipt or invoice.
- Petty cash claims above RM50 require receipts.
- All documents shall be retained for a minimum of 7 years.

6. BANK ACCOUNTS
- All funds shall be deposited into the organisation's registered bank account.
- No personal bank accounts shall be used for organisational funds.
- Bank statements shall be reconciled monthly.

7. FINANCIAL REPORTING
- Monthly financial reports shall be prepared and presented to the committee.
- Annual financial statements shall be prepared within 3 months of financial year-end.
- An independent audit shall be conducted annually.

8. FUND SEGREGATION
- Zakat funds shall be maintained in a dedicated account and used exclusively for eligible asnaf.
- Waqf funds shall not be commingled with operational funds.
- Sadaqah funds shall be tracked and reported separately.

Approved by: _____________________ (Chairman)
Date: _____________________________`,
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Procurement Policy
  // ─────────────────────────────────────────────────────────────
  {
    id:            'procurement_policy',
    title:         'Procurement Policy',
    titleBM:       'Dasar Perolehan',
    category:      'governance',
    ctcfLayer:     'Layer 1',
    ctcfCriterion: 'Governance & conflict of interest controls',
    trustPts:      15,
    emoji:         '🛒',
    required:      false,
    description:   'Governs how goods and services are purchased, ensuring value for money, fairness, and prevention of conflicts of interest.',
    template: `PROCUREMENT POLICY
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
To ensure all procurement is conducted transparently, economically, and free from conflict of interest.

2. PROCUREMENT THRESHOLDS
- Below RM500: Direct purchase with receipt
- RM500 – RM5,000: Minimum 2 written quotations
- Above RM5,000: Minimum 3 written quotations + committee approval
- Above RM20,000: Open tender or committee resolution required

3. CONFLICT OF INTEREST
- No committee member shall participate in any procurement where they or their associates have a personal interest.
- Conflicts of interest must be declared in writing before any procurement process begins.

4. PREFERRED VENDOR CRITERIA
- Vendors must be registered businesses or individuals with valid identification.
- Priority may be given to Bumiputera and local vendors, all else being equal.
- Halal certification required for food and consumable purchases.

5. VENDOR DOCUMENTATION
- All approved vendors shall be recorded in a vendor register.
- Vendor contracts exceeding RM10,000 shall be signed by two authorised signatories.

6. RECEIPT AND DELIVERY
- All goods received shall be physically verified before payment is authorised.
- Goods received notes shall be signed and filed.

7. AUDIT TRAIL
- All procurement decisions shall be documented in writing.
- Quotations, approvals, and invoices shall be retained for 7 years.

Approved by: _____________________ (Chairman)
Date: _____________________________`,
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Conflict of Interest Policy
  // ─────────────────────────────────────────────────────────────
  {
    id:            'coi_policy',
    title:         'Conflict of Interest Policy',
    titleBM:       'Dasar Konflik Kepentingan',
    category:      'governance',
    ctcfLayer:     'Layer 1 — Gate',
    ctcfCriterion: 'REQUIRED: conflict of interest policy for CTCF certification',
    trustPts:      15,
    emoji:         '⚖',
    required:      true,
    description:   'CTCF Layer 1 gate requirement. Ensures committee members disclose and manage conflicts of interest in organisational decisions.',
    template: `CONFLICT OF INTEREST POLICY
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
This policy promotes transparency and integrity in the governance of [Organisation Name] by ensuring that all decisions are made in the best interests of the organisation and its beneficiaries, free from personal gain.

2. DEFINITION OF CONFLICT OF INTEREST
A conflict of interest arises when a committee member or staff has a personal, financial, or professional interest that could inappropriately influence their judgement in carrying out their responsibilities.

3. DISCLOSURE REQUIREMENT
All committee members and key staff shall:
(a) Disclose any actual or potential conflict of interest at the earliest opportunity.
(b) Complete and sign an annual Conflict of Interest Declaration Form.
(c) Immediately disclose any new conflicts arising during their term of service.

4. PROCEDURES WHEN A CONFLICT EXISTS
Upon declaring a conflict, the affected person shall:
(a) Recuse themselves from discussions and voting on the relevant matter.
(b) Not attempt to influence the decision.
(c) Leave the meeting room during deliberation if requested.

5. ANNUAL DECLARATION
All committee members shall sign a Conflict of Interest Declaration Form at the beginning of each financial year. The signed declarations shall be retained in the organisation's records.

6. SANCTIONS
Failure to disclose a conflict of interest may result in removal from the committee and, where applicable, referral to relevant authorities.

DECLARATION
I, _________________________, understand and agree to comply with this Conflict of Interest Policy.

Signature: _____________________
Date: _____________________
Position: _____________________`,
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Donation Handling SOP
  // ─────────────────────────────────────────────────────────────
  {
    id:            'donation_handling_sop',
    title:         'Donation Handling SOP',
    titleBM:       'Prosedur Pengendalian Derma',
    category:      'operations',
    ctcfLayer:     'Layer 2',
    ctcfCriterion: 'Financial transparency + donor fund traceability',
    trustPts:      15,
    emoji:         '🤲',
    required:      false,
    description:   'Standard operating procedure for receiving, recording, and acknowledging donations — cash, online, and in-kind.',
    template: `DONATION HANDLING STANDARD OPERATING PROCEDURE (SOP)
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
To ensure all donations are received, recorded, and acknowledged in a transparent and accountable manner.

2. TYPES OF DONATIONS
(a) Cash donations
(b) Online / bank transfer donations
(c) In-kind donations (goods and services)

3. CASH DONATION HANDLING
- Cash shall be collected by at least 2 persons.
- Cash shall be counted by both persons and amounts agreed before recording.
- Official receipts shall be issued for all cash donations above RM10.
- Cash shall be banked within 2 working days of collection.
- No cash shall be retained by any individual.

4. ONLINE / TRANSFER DONATIONS
- A dedicated donation bank account shall be maintained.
- All incoming transfers shall be reconciled to donation records monthly.
- Acknowledgement receipts shall be issued via email within 3 working days.

5. IN-KIND DONATIONS
- All in-kind donations shall be valued at market price and recorded.
- A receipt of in-kind donation shall be issued to the donor.
- In-kind items shall be recorded in an asset or consumables register.

6. RECEIPT NUMBERING
- All receipts shall be sequentially numbered.
- Voided receipts shall be retained with a void stamp.

7. RESTRICTED DONATIONS
- Donations specified for a particular purpose shall be tracked separately.
- Funds shall not be redirected without donor consent and committee approval.
- Unused restricted funds shall be returned to the donor or applied as agreed.

8. DONOR PRIVACY
- Donor information shall be kept confidential and not shared without consent.
- Compliance with Malaysia's Personal Data Protection Act 2010 (PDPA) is mandatory.

Approved by: _____________________ (Chairman)
Date: _____________________________`,
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Zakat Distribution SOP
  // ─────────────────────────────────────────────────────────────
  {
    id:            'zakat_distribution_sop',
    title:         'Zakat Distribution SOP',
    titleBM:       'Prosedur Pengagihan Zakat',
    category:      'shariah',
    ctcfLayer:     'Layer 5',
    ctcfCriterion: 'Zakat eligibility governance + asnaf compliance',
    trustPts:      15,
    emoji:         '🌙',
    required:      false,
    appliesToTypes: ['zakat'],
    description:   'Governs Zakat collection, segregation, and distribution to eligible asnaf in compliance with MAIN/JAKIM requirements.',
    template: `ZAKAT DISTRIBUTION STANDARD OPERATING PROCEDURE (SOP)
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
To ensure Zakat funds are collected, held, and distributed strictly in accordance with Shariah principles and MAIN/JAKIM guidelines.

2. ZAKAT FUND SEGREGATION
- Zakat funds shall be held in a dedicated, separate bank account.
- No Zakat funds shall be commingled with general operational funds.
- All Zakat income and expenditure shall be tracked in a dedicated ledger.

3. ELIGIBLE RECIPIENTS (ASNAF)
Zakat shall only be distributed to eligible asnaf as defined under Shariah:
(a) Fakir — the absolutely poor
(b) Miskin — the poor with some means
(c) Amil — those administering Zakat (within limits)
(d) Muallaf — those whose hearts are inclined to Islam
(e) Riqab — those in bondage (context-appropriate modern interpretation)
(f) Gharimin — those in debt
(g) Fisabilillah — those striving in the way of Allah
(h) Ibnus Sabil — stranded travellers in need

4. ELIGIBILITY VERIFICATION
- All Zakat recipients shall be assessed against documented eligibility criteria.
- Assessment shall include home visit or documented interview where possible.
- Eligibility records shall be maintained per recipient.

5. DISTRIBUTION PROCESS
- All disbursements shall be approved by an authorised committee member.
- Recipients shall sign or thumbprint an acknowledgement of receipt.
- Distribution records shall include: recipient name, IC number (where consented), amount, date, and purpose.

6. REPORTING
- Monthly Zakat utilisation reports shall be prepared.
- Annual Zakat collection and distribution summary shall be submitted to MAIN/JAKIM as required.

7. PROHIBITED USES
- Zakat funds shall not be used for administrative salaries beyond the Amil entitlement.
- Zakat funds shall not be invested in non-Shariah compliant instruments.

Approved by: _____________________ (Chairman)
Date: _____________________________
Shariah Advisor: _____________________ (if applicable)`,
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Waqf Governance SOP
  // ─────────────────────────────────────────────────────────────
  {
    id:            'waqf_governance_sop',
    title:         'Waqf Governance SOP',
    titleBM:       'Prosedur Tadbir Urus Waqf',
    category:      'shariah',
    ctcfLayer:     'Layer 5',
    ctcfCriterion: 'Waqf asset governance + permanent restriction compliance',
    trustPts:      15,
    emoji:         '🕌',
    required:      false,
    appliesToTypes: ['waqf'],
    description:   'Governs the administration of Waqf assets — ensuring the principal is preserved, income is correctly applied, and assets are properly registered.',
    template: `WAQF GOVERNANCE STANDARD OPERATING PROCEDURE (SOP)
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
To ensure Waqf assets are administered in perpetuity in accordance with the terms of the Waqf deed and Shariah principles, under the oversight of the relevant State Islamic Religious Council (SIRC).

2. WAQF ASSET REGISTER
- All Waqf assets shall be recorded in a Waqf Asset Register.
- The register shall include: asset description, Waqf deed reference, donor (Waqif) name, date of dedication, valuation, and permitted uses.
- The register shall be updated annually.

3. PRESERVATION OF PRINCIPAL
- The principal of Waqf (the endowed asset) shall not be sold, gifted, or mortgaged.
- Any proposed disposal or development of Waqf land must receive prior approval from the relevant SIRC.

4. PERMISSIBLE USES OF WAQF INCOME
- Income derived from Waqf assets may be applied to:
  (a) Maintenance and upkeep of the Waqf asset
  (b) Charitable purposes as specified in the Waqf deed
  (c) Administrative costs (within approved limits)

5. PROHIBITED ACTS
- Waqf funds shall not be used for non-Shariah compliant activities.
- Waqf income shall not be commingled with general operational funds.
- No individual shall personally benefit from Waqf assets beyond lawful compensation.

6. REPORTING
- Annual Waqf asset and income reports shall be submitted to the relevant SIRC.
- Accounts relating to each Waqf shall be maintained separately.

7. SHARIAH COMPLIANCE
- All Waqf matters shall be subject to the supervision of a qualified Shariah advisor.

Approved by: _____________________ (Chairman)
Date: _____________________________
SIRC Reference: _____________________`,
  },

  // ─────────────────────────────────────────────────────────────
  // 7. PDPA Data Protection Policy
  // ─────────────────────────────────────────────────────────────
  {
    id:            'pdpa_policy',
    title:         'Data Protection Policy (PDPA)',
    titleBM:       'Dasar Perlindungan Data Peribadi',
    category:      'data',
    ctcfLayer:     'Governance',
    ctcfCriterion: 'Donor privacy + beneficiary data protection',
    trustPts:      15,
    emoji:         '🔒',
    required:      false,
    description:   'Ensures compliance with Malaysia\'s Personal Data Protection Act 2010 (PDPA). Covers donor data, beneficiary records, and member information.',
    template: `DATA PROTECTION POLICY (PDPA)
[Organisation Name]
Effective Date: [Date] | Version: 1.0

1. PURPOSE
This policy ensures compliance with the Personal Data Protection Act 2010 (Malaysia) and protects the privacy of donors, beneficiaries, members, and staff.

2. SCOPE
This policy applies to all personal data collected, processed, stored, or shared by [Organisation Name] in the course of its operations.

3. PRINCIPLES OF DATA PROTECTION
We adhere to the following PDPA principles:
(a) General — personal data shall only be processed with consent or lawful authority.
(b) Notice — data subjects shall be informed of the purpose of data collection.
(c) Disclosure — personal data shall not be disclosed without consent.
(d) Security — reasonable measures shall be taken to protect personal data.
(e) Retention — personal data shall not be retained longer than necessary.
(f) Data Integrity — personal data shall be accurate and up to date.
(g) Access — data subjects have the right to access and correct their data.

4. DATA WE COLLECT
- Donor information: name, contact details, donation amounts, payment references.
- Beneficiary information: name, IC number, household details, assistance received.
- Member and volunteer information: name, contact details, role.

5. USE OF DATA
- Donor data is used to issue receipts, send acknowledgements, and maintain records.
- Beneficiary data is used solely for eligibility assessment and distribution records.
- Member data is used for internal governance and communication.

6. DATA SHARING
- Personal data shall not be shared with third parties without written consent, except:
  (a) As required by law or regulatory authority.
  (b) To the Amanah Governance Platform for transparency reporting purposes.

7. DATA SECURITY
- Personal data shall be stored in secure, access-controlled systems.
- Physical documents containing personal data shall be kept in locked storage.
- Access to personal data is restricted to authorised personnel only.

8. RETENTION
- Donor and transaction records: 7 years (for audit and tax purposes).
- Beneficiary records: 5 years after last assistance.
- Member records: duration of membership + 3 years.

9. DATA SUBJECT RIGHTS
Individuals may request access to, correction of, or deletion of their personal data by contacting: [Contact Email]

10. BREACH REPORTING
In the event of a data breach, the matter shall be reported to the Chairman within 24 hours, and appropriate authorities notified as required by law.

Approved by: _____________________ (Chairman)
Date: _____________________________`,
  },
];
