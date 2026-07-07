# AmanahOS Accounting + Audit-Ready Reporting Study

Date: 2026-05-21  
Purpose: assess whether AmanahOS can credibly claim to provide accounting services and audit-ready reports for charities, and compare it with charity platforms, free accounting platforms, and cloud accounting software.

## Executive Finding

The claim is directionally correct, but it needs careful wording.

Strong claim:

> AmanahOS provides a charity governance workspace with Islamic fund accounting, basic double-entry bookkeeping, bank reconciliation, payment approval workflow, period close, nonprofit-style financial reports, compliance readiness checklists, and an audit-ready export package.

Safe free-access claim:

> During the pilot, charities can receive free access to AmanahOS accounting and audit-readiness tools.

Avoid or qualify:

- "Free accounting services" — sounds like professional bookkeeping/accountant service.
- "Audited financial report" — only an independent auditor can issue this.
- "MAIN/JAKIM accepted" — too strong unless formally validated by those bodies.
- "Full cloud accounting software replacement" — too broad at this stage.

Best positioning:

> AmanahOS is not trying to beat Xero, QuickBooks, Bukku, or AutoCount as a general accounting system. It is a purpose-built charity trust and fund-accounting layer for Malaysian Islamic nonprofits, mosques, waqf initiatives, and zakat/sadaqah-funded organizations.

## What AmanahOS Actually Provides Today

Based on repo inspection, AmanahOS has real accounting infrastructure:

- Islamic fund registry: `zakat`, `waqf`, `sadaqah`, `general`, `project`, `endowment`.
- Chart of accounts with 50+ nonprofit/mosque accounts.
- Double-entry journal entries and journal lines.
- Journal balance validation in the API.
- Append-only journal lines at the database/RLS design level.
- Physical bank/cash/e-wallet/payment gateway accounts.
- Bank reconciliation records by bank account and accounting period.
- Payment request workflow for expense approval.
- Segregation-of-duty concept: creator, reviewer, approver.
- Period-close function that locks period entries and records totals.
- Fund balance view computed from journal lines.
- Financial statements pages:
  - Statement of Financial Position.
  - Statement of Activities.
  - Statement of Changes in Funds.
  - Statement of Cash Flow.
  - Zakat Utilisation Report.
  - Project Fund Report.
- Compliance readiness page for:
  - ROS Annual Return.
  - MAIN/JAKIM Reporting Pack.
  - Donor Transparency Report.
- Printable compliance export pages.
- Audit-ready package ZIP with PDF, financial summary JSON, trust events JSON, and organization profile text.

Important implementation caution:

The audit package route currently appears to query some old/non-canonical table names:

- It queries `financial_period_closes`, but the current accounting table is `fund_period_closes`.
- It queries `reports`, but project reports are stored in `project_reports`.

So the "audit package" concept exists, but the route should be fixed before this is demonstrated as production-ready.

## Claim Check

| Claim | Verdict | Safer wording |
|---|---|---|
| "AmanahOS provides accounting services" | Partly true, but vague | "AmanahOS provides accounting tools/workspace for charity fund accounting." |
| "AmanahOS provides free accounting services for charities" | Too strong unless human bookkeeping is included | "Pilot charities receive free access to AmanahOS accounting and reporting tools." |
| "AmanahOS provides audit-ready reports" | Mostly fair | "AmanahOS generates audit-ready records and report packs for review by auditors/regulators." |
| "AmanahOS provides audited reports" | Not correct | "Auditor-ready, not audited." |
| "MAIN/JAKIM ready" | Directionally OK, but needs care | "Designed for MAIN/JAKIM-style reporting needs; formal acceptance requires partner validation." |
| "Replaces Xero/QuickBooks/Bukku" | Too broad | "Complements or replaces basic bookkeeping for small charities with Islamic fund-accounting needs." |

## 1. Comparison With Earlier Charity / Crowdfunding / Directory Players

| Platform | Primary role | Accounting features | Audit-ready reporting | AmanahOS difference |
|---|---|---:|---:|---|
| Hati.my | Free Malaysian charity directory | No public accounting workspace found | No | Hati solves discovery; AmanahOS solves internal governance, fund accounting, evidence, and trust reporting. |
| NGOBase | NGO directory/database | No accounting workspace found | No | NGOBase helps search/listing; AmanahOS manages charity records and fund controls. |
| GlobalSadaqah | CSR, zakat, waqf, Islamic crowdfunding/management platform | Campaign/platform-level impact and due diligence; no public evidence of charity bookkeeping workspace | Partner due diligence and impact reporting, not full org accounting | GlobalSadaqah is stronger in campaign fundraising and partner network; AmanahOS is stronger as an internal operating/governance system. |
| Kitafund | Crowdfunding platform for medical/humanitarian/emergency campaigns | Campaigners manage campaigns; fund usage updates/receipts required for disbursement | Campaign transparency, not full org accounting | Kitafund tracks campaign fundraising/disbursement; AmanahOS tracks organization-wide funds, journals, bank reconciliation, and reports. |
| Seedkind | Islamic crowdfunding | Donation history, recurring/anonymous giving, campaign updates, audit/monitoring claims | Campaign monitoring/reviews | Seedkind is donor/campaign oriented; AmanahOS is accounting/governance oriented. |

Conclusion:

Against the earlier players, AmanahOS accounting is a real differentiator. Those platforms mostly handle discovery, fundraising, campaign verification, campaign updates, and donor flow. They do not visibly offer a charity-side accounting operating system with double-entry journals, fund segregation, period close, and auditor-ready packs.

## 2. Platforms Providing Free Accounting Software

### Wave

Wave positions nonprofit accounting as simple software "starting at free." It highlights bill/invoice reminders, bank connections, receipt scanning, accountant-friendly double-entry accounting, and nonprofit cash-flow control.

Strengths:

- Easy free entry.
- Beginner-friendly.
- Double-entry accounting.
- Receipts and bank connection features.

Limits vs AmanahOS:

- Not Islamic fund-specific.
- Not designed around zakat/waqf/sadaqah fund segregation.
- Does not produce Amanah Index, CTCF, trust events, or donor trust profiles.

### Akaunting

Akaunting is free, open-source, and online accounting software for SMEs/freelancers. It includes invoicing, expense tracking, categories, cash flow, client portal, and source-code availability for the self-hosted version.

Strengths:

- Open-source/self-hostable.
- Good general SME accounting.
- Invoicing and expense management.

Limits vs AmanahOS:

- General business accounting, not charity governance.
- Nonprofit fund accounting likely needs configuration/customization.
- No built-in Islamic fund/reporting trust layer.

### GnuCash

GnuCash is free GPL software for personal and small-business accounting. It highlights double-entry accounting, small-business accounting, reports/graphs, imports, transaction matching, scheduled transactions, and financial calculations.

Strengths:

- Fully free/open-source.
- Mature double-entry engine.
- Can be adapted by knowledgeable treasurers.

Limits vs AmanahOS:

- Desktop-style finance tool, not multi-user charity governance SaaS.
- No built-in Amanah/CTCF workflow.
- No donor-facing trust layer.
- Not tailored to Malaysian Islamic nonprofit reporting.

### Manager.io

Manager.io presents a downloadable accounting product with desktop and cloud editions. Its public page is sparse, but it is widely positioned as free desktop accounting with paid cloud options.

Strengths:

- Simple accounting package.
- Desktop edition can be low-cost/free.

Limits vs AmanahOS:

- General accounting, not Islamic charity governance.
- No public trust/certification workflow.

### Zoho Books Free Plan

Zoho Books has a forever-free plan for small businesses. It includes invoicing, online payments, customer management, expense tracking, bank statement import/reconciliation, 50+ reports, quotes, recurring invoices, banking, documents, and accountant access.

Strengths:

- Strong free tier for micro businesses.
- Polished cloud accounting.
- Reports, bank imports, expenses, invoicing.

Limits vs AmanahOS:

- Business accounting first.
- Revenue threshold and plan limits may apply.
- No native zakat/waqf/sadaqah trust reporting.

Conclusion:

Free accounting products exist and are strong for general bookkeeping. AmanahOS should not claim uniqueness as "free accounting software." The defensible claim is:

> Free pilot access to Islamic charity fund-accounting and audit-readiness tools, connected to trust scoring and donor transparency.

That combination is much more unique.

## 3. Comparison With Cloud Accounting Software

### Aplos

Aplos is the closest conceptual benchmark because it is built for nonprofits and churches. It provides fund accounting, multiple funds/grants/projects, nonprofit reports, Statement of Activities, Statement of Financial Position, donation-to-accounting flows, and fund balance reporting.

Where Aplos is stronger:

- Mature nonprofit accounting product.
- Built specifically for nonprofits/churches.
- Stronger claim to GAAP-style nonprofit reports.
- Likely more complete support, onboarding, and accounting-service ecosystem.

Where AmanahOS is stronger/different:

- Malaysia-first Islamic social finance.
- Zakat, waqf, sadaqah, project, endowment fund categories are native.
- Trust score and certification workflow are built into the same platform.
- Reviewer/scholar/governance-event layer.
- Public AmanahHub trust profile can consume outputs.

### QuickBooks

QuickBooks markets nonprofit accounting with bank sync, donation tracking, fund/program allocation, automatic categorization, mobile donation recording, and reports for boards/donors.

Where QuickBooks is stronger:

- Mature accounting ecosystem.
- Bank feeds, app marketplace, accountant familiarity.
- Strong general accounting automation.

Where AmanahOS is stronger/different:

- Purpose-built fund categories for Islamic charity.
- Charity trust/certification layer.
- Donor transparency and governance-stage public profile.
- Less business/profit-language mismatch for mosque/NGO users.

### Xero

Xero is mature cloud accounting with bank reconciliation, bills, receipts, profit/loss, cash-flow widgets, and real-time financial view.

Where Xero is stronger:

- Bank feeds/reconciliation ecosystem.
- Accounting advisor ecosystem.
- Mobile and automation maturity.

Where AmanahOS is stronger/different:

- Islamic restricted-fund accounting.
- Audit-readiness tied to governance/trust events.
- Nonprofit reports like fund changes, zakat utilisation, and project fund use.

### Bukku

Bukku is Malaysia-focused cloud accounting for SMEs. It offers LHDN e-invoicing, automated data entry, WhatsApp receipts, bank reconciliation, asset depreciation, 50+ financial reports, SST, inventory, bank feeds, and journal entries.

Where Bukku is stronger:

- Malaysia tax/e-invoice readiness.
- Bank reconciliation and local SME accounting maturity.
- Financial reports and inventory.

Where AmanahOS is stronger/different:

- Charity fund accounting, not SME sales/accounting.
- Zakat/waqf/sadaqah/restricted fund reporting.
- Donor and regulator trust outputs.

### AutoCount / SQL Account

AutoCount and SQL Account are strong Malaysian business accounting platforms. They emphasize LHDN e-invoice, SST, sales/purchase modules, inventory, financial reports, multi-currency, cloud access, unlimited invoices/storage in SQL Cloud, and mature dealer/support ecosystems.

Where they are stronger:

- Malaysian SME compliance and accounting depth.
- Inventory/sales/purchase workflows.
- Established market adoption.

Where AmanahOS is stronger/different:

- Not trying to run a retail/trading business.
- Built around funds, evidence, governance, and trust.
- Handles charity-specific program/admin, project fund, and zakat utilisation framing.

## Service Positioning Matrix

| Capability | AmanahOS | Aplos | QuickBooks | Xero | Bukku / AutoCount / SQL | Wave / Zoho / GnuCash |
|---|---:|---:|---:|---:|---:|---:|
| Double-entry accounting | Yes | Yes | Yes | Yes | Yes | Yes |
| Fund accounting | Yes, Islamic charity funds | Strong nonprofit funds | Via fund/program tracking | Possible via tracking/categories | Usually configurable | Limited/configurable |
| Zakat/waqf/sadaqah native | Strong | No | No | No | No | No |
| Bank reconciliation | Basic/manual records | Yes | Strong | Strong | Strong | Varies |
| Payment approval workflow | Yes | Varies | Varies | Varies | Varies | Limited |
| Period close / lock | Yes | Yes | Yes | Yes | Yes | Varies |
| Nonprofit statements | Yes | Strong | Yes/configured | Configurable | Business reports | Varies |
| Audit-ready package | Yes, but route needs fix | Strong reports | Accountant reports | Accountant reports | Strong business reports | Varies |
| Donor trust profile | Yes | No | No | No | No | No |
| Certification / reviewer workflow | Yes | No | No | No | No | No |
| Malaysia Islamic governance | Strong | No | No | No | Malaysia business, not Islamic charity | No |

## Recommended Public Claim

Use this:

> AmanahOS gives pilot charities free access to an Islamic charity accounting and audit-readiness workspace: fund segregation for zakat, waqf, sadaqah and project funds; double-entry records; bank reconciliation; payment approval; period close; nonprofit financial statements; compliance readiness checks; and auditor-ready export packs.

Add this disclaimer:

> AmanahOS helps charities prepare cleaner records for auditors, reviewers, donors, and regulators. It does not replace a licensed accountant, independent audit opinion, or formal regulator approval.

## Suggested One-Slide Position

Title: Accounting Is Not the Product. Trust-Ready Records Are.

Message:

- Crowdfunding platforms collect and update campaigns.
- Accounting software records transactions.
- AmanahOS connects charity accounting, governance evidence, and public trust.

Proof points:

- Islamic fund segregation.
- Double-entry ledger.
- Bank reconciliation.
- Payment approval workflow.
- Period close.
- Audit-ready export.
- CTCF/Amanah Index linkage.
- Donor-facing trust profile.

## Gaps To Fix Before Demo

1. Fix audit package route table names:
   - `financial_period_closes` → `fund_period_closes`
   - `reports` → `project_reports`

2. Remove or soften unsupported UI claim:
   - Current text says "The Zakat Utilisation Report is accepted by MAIN/JAKIM." Replace with "designed for MAIN/JAKIM-style reporting requirements" until validated.

3. Add a clear "not audited" disclaimer to exports:
   - "Generated from organization records; subject to independent review."

4. Add evidence attachments into audit package:
   - receipts
   - uploaded invoices
   - bank statement references
   - governance policies
   - project evidence

5. Add export formats:
   - PDF for board/regulator.
   - CSV/Excel for auditor.
   - JSON for platform evidence/audit trail.

6. Create a sample completed organization:
   - 12 months of journal entries.
   - 2 reconciled bank accounts.
   - 1 zakat fund.
   - 1 waqf/project fund.
   - 3 submitted/verified reports.
   - 1 complete audit package.

## Bottom Line

AmanahOS is not "just accounting software." That would invite comparison with mature general ledgers where AmanahOS is not yet strongest.

The stronger and more accurate claim is:

> AmanahOS provides Islamic charity fund-accounting and audit-readiness tools as part of a trust and governance infrastructure platform.

This is differentiated from Hati, Kitafund, GlobalSadaqah, and Seedkind because those platforms focus on discovery, fundraising, campaign updates, and partner due diligence. It is differentiated from Xero, QuickBooks, Bukku, AutoCount, SQL Account, Wave, Zoho Books, Akaunting, and GnuCash because AmanahOS connects accounting records to Islamic restricted funds, governance review, CTCF certification, Amanah Index, and donor-facing trust transparency.

## Sources

- Hati.my About: https://www.hati.my/about/
- GlobalSadaqah About: https://www.globalsadaqah.com/en/
- GlobalSadaqah Partners: https://globalsadaqah.com/partners
- Kitafund About: https://kitafund.com/about-us
- Seedkind: https://seedkind.my/en/
- Aplos Fund Accounting: https://www.aplos.com/fund-accounting-software
- Wave Nonprofit Accounting: https://www.waveapps.com/accounting/nonprofit
- Akaunting: https://akaunting.com/
- GnuCash: https://www.gnucash.org/index.phtml?lang=en_US
- Manager.io: https://www.manager.io/?locale=en
- Zoho Books Free Accounting: https://www.zoho.com/us/books/free-accounting-software/
- QuickBooks Nonprofit Accounting: https://quickbooks.intuit.com/industry/non-profits/
- Xero Accounting App: https://www.xero.com/accounting-software/xero-accounting-mobile-app/
- Bukku via UOB: https://www.uob.com.my/business/digital/accounting/bukku.page
- SQL Account Cloud: https://www.sql.com.my/
- AutoCount Cloud Accounting: https://autocloud.my/autocount-cloud-accounting/
- Local code: `apps/org/app/api/audit-package/route.ts`
- Local code: `apps/org/app/api/accounting/journal-entries/route.ts`
- Local code: `apps/org/app/api/accounting/bank-reconciliations/route.ts`
- Local code: `apps/org/app/api/accounting/close-period/route.ts`
- Local code: `apps/org/app/(protected)/accounting/reports/page.tsx`
- Local schema: `supabase/migrations/0020_fund_accounting.sql`
- Local schema: `supabase/migrations/0021_accounting_statements.sql`
- Local schema: `supabase/migrations/0022_accounting_full.sql`
