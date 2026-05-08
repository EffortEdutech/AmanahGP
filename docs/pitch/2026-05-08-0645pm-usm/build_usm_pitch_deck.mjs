import {
  Presentation,
  PresentationFile,
  row,
  column,
  grid,
  panel,
  text,
  image,
  rule,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto,
} from "file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const OUT = "docs/pitch/2026-05-08-0645pm-usm/AGP_USM_OrgBehaviour_Pitch_Deck_reformatted.pptx";
const SCREENSHOT = "docs/pitch/2026-05-08-0645pm-usm/live_probe/amanahhub_charities.png";

const presentation = Presentation.create({ slideSize: { width: 1920, height: 1080 } });

const colors = {
  ink: "#172A2A",
  body: "#344542",
  muted: "#667872",
  green: "#1F6F5B",
  darkGreen: "#123F35",
  mint: "#E8F5EF",
  gold: "#B8872D",
  blue: "#2D6684",
  red: "#A54C40",
  line: "#D6E2DD",
};

function compose(slide, children, opts = {}) {
  slide.compose(
    column(
      {
        name: "root",
        width: fill,
        height: fill,
        padding: { x: 76, y: 54 },
        gap: 22,
        ...opts,
      },
      children,
    ),
    { frame: { left: 0, top: 0, width: 1920, height: 1080 }, baseUnit: 8 },
  );
}

function topBar(label = "AMANAH GOVERNANCE PLATFORM", right = "May 2026") {
  return row({ width: fill, height: hug }, [
    text(label, { width: fill, height: hug, style: { fontSize: 21, bold: true, color: colors.green } }),
    text(right, { width: fixed(190), height: hug, style: { fontSize: 19, color: colors.muted } }),
  ]);
}

function titleBlock(kicker, title, subtitle, titleSize = 52) {
  return column({ width: fill, height: hug, gap: 10 }, [
    text(kicker.toUpperCase(), { width: fill, height: hug, style: { fontSize: 18, bold: true, color: colors.green } }),
    text(title, { width: wrap(1580), height: hug, style: { fontSize: titleSize, bold: true, color: colors.ink } }),
    text(subtitle, { width: wrap(1500), height: hug, style: { fontSize: 24, color: colors.body } }),
    rule({ width: fixed(300), stroke: colors.gold, weight: 4 }),
  ]);
}

function proof(label, body, accent = colors.green, large = false) {
  return panel(
    { width: fill, height: fill, padding: { x: 26, y: 22 }, borderRadius: "rounded-lg" },
    column({ width: fill, height: fill, gap: 10 }, [
      text(label, { width: fill, height: hug, style: { fontSize: large ? 23 : 18, bold: true, color: accent } }),
      text(body, { width: fill, height: hug, style: { fontSize: large ? 29 : 23, bold: true, color: colors.ink } }),
    ]),
  );
}

function bodyText(value, size = 24, color = colors.body, bold = false) {
  return text(value, { width: fill, height: hug, style: { fontSize: size, color, bold } });
}

function bullet(value) {
  return row({ width: fill, height: hug, gap: 13 }, [
    text("-", { width: fixed(18), height: hug, style: { fontSize: 25, bold: true, color: colors.green } }),
    text(value, { width: fill, height: hug, style: { fontSize: 24, color: colors.body } }),
  ]);
}

function step(num, title, body, accent = colors.green) {
  return column({ width: fill, height: fill, gap: 8 }, [
    text(num, { width: fill, height: hug, style: { fontSize: 20, bold: true, color: accent } }),
    text(title, { width: fill, height: hug, style: { fontSize: 26, bold: true, color: colors.ink } }),
    text(body, { width: fill, height: hug, style: { fontSize: 21, color: colors.body } }),
  ]);
}

function cover() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    column({ width: fill, height: grow(1), gap: 30 }, [
      text("Public-Interest Governance Infrastructure for Islamic Social Finance", {
        width: wrap(1540),
        height: hug,
        style: { fontSize: 76, bold: true, color: colors.ink },
      }),
      text(
        "AGP-led grant and development proposal with Prof. Anuar as advising member and JAKIM/MAIN as potential authority-side partners.",
        { width: wrap(1320), height: hug, style: { fontSize: 31, color: colors.body } },
      ),
      rule({ width: fixed(360), stroke: colors.gold, weight: 5 }),
    ]),
    grid({ width: fill, height: fixed(190), columns: [fr(1), fr(1), fr(1)], rows: [fr(1)], columnGap: 22 }, [
      proof("Position", "Live seeded MVP, not a paper concept", colors.green, true),
      proof("Principle", "Charity organizations do not pay AGP", colors.red, true),
      proof("Route", "Keep all grant pathways open", colors.blue, true),
    ]),
  ]);
}

function evidence() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Evidence", "AmanahHub is already live with public trust profiles.", "Funders and partners can inspect a working public directory today, supported by deployed protected workspaces."),
    grid({ width: fill, height: fill, columns: [fr(0.88), fr(1.12)], rows: [fr(1)], columnGap: 28 }, [
      grid({ width: fill, height: fill, columns: [fr(1), fr(1)], rows: [fr(1), fr(1), fr(1)], columnGap: 16, rowGap: 16 }, [
        proof("46", "Visible organisations in the public charity directory", colors.green, true),
        proof("37", "Published donor-facing trust profiles", colors.blue, true),
        proof("Categories", "Mosque/surau, waqf, zakat, foundations, welfare and cooperative", colors.gold),
        proof("Trust tiers", "Gold, Silver and Bronze profile language is visible", colors.red),
        proof("Protected apps", "amanahOS and AGP Console are deployed login surfaces", colors.green),
        proof("Grant proof", "A live MVP reduces funder execution risk", colors.blue),
      ]),
      panel(
        { width: fill, height: fill, padding: { x: 0, y: 0 }, borderRadius: "rounded-lg" },
        image({ path: SCREENSHOT, width: fill, height: fill, fit: "cover", alt: "AmanahHub charities directory" }),
      ),
    ]),
  ]);
}

function problem() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Problem", "Islamic giving has scale, but governance is fragmented at the operating edge.", "The gap is not generosity. It is consistent evidence, reporting, review and public trust across thousands of community institutions."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("Donor confidence", "Donors need visible accountability before giving repeatedly.", colors.green),
      proof("Manual burden", "Reports and evidence often sit in scattered files, forms and spreadsheets.", colors.gold),
      proof("Oversight pressure", "Authorities need a live view without replacing state or institutional authority.", colors.blue),
      proof("Volunteer reality", "Mosque and surau committees need simple routines, not heavy software.", colors.red),
      proof("Behaviour change", "Better governance requires habit formation and guided adoption.", colors.green),
      proof("Public trust", "Amanah must be visible, reviewable and updated over time.", colors.blue),
    ]),
  ]);
}

function solution() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Solution", "AGP connects donor trust, organization operations and evaluator control.", "Three live product surfaces share one evidence and scoring backbone."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1)], columnGap: 24 }, [
      proof("AmanahHub", "Public directory, verified profiles, Amanah scores, certification tiers and direct-to-charity giving context.", colors.green, true),
      proof("amanahOS", "Workspace for profiles, accounting, evidence, projects, reports, policy kit, trust score and certification.", colors.gold, true),
      proof("AGP Console", "Control plane for trust events, governance cases, review queues, scholar approval and publication.", colors.blue, true),
    ]),
    bodyText("Shared backbone: Amanah scoring engine, trust events, fund accounting, audit logs, public profile publication controls and Supabase-backed evidence records.", 23, colors.muted),
  ]);
}

function trustLoop() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Operating Model", "The trust loop turns amanah into a repeatable governance rhythm.", "AGP creates a path from registration to evidence, review, scoring and selective publication."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1), fr(1)], rows: [fr(1)], columnGap: 18 }, [
      panel({ width: fill, height: fill, padding: { x: 20, y: 20 }, borderRadius: "rounded-lg" }, step("1", "Register", "Authority-linked organization record and public baseline.", colors.green)),
      panel({ width: fill, height: fill, padding: { x: 20, y: 20 }, borderRadius: "rounded-lg" }, step("2", "Operate", "Members update reports, projects, bookkeeping and evidence.", colors.gold)),
      panel({ width: fill, height: fill, padding: { x: 20, y: 20 }, borderRadius: "rounded-lg" }, step("3", "Review", "Console routes trust events, findings and scholar approval.", colors.blue)),
      panel({ width: fill, height: fill, padding: { x: 20, y: 20 }, borderRadius: "rounded-lg" }, step("4", "Score", "Verified behaviour becomes donor-readable trust signals.", colors.green)),
      panel({ width: fill, height: fill, padding: { x: 20, y: 20 }, borderRadius: "rounded-lg" }, step("5", "Publish", "Approved profiles create public confidence and transparency.", colors.red)),
    ]),
  ]);
}

function publicInterest() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Public-Interest Model", "AGP is funded around charities, not from charities.", "The platform protects charity organizations from AGP fees while institutions and sponsors fund the infrastructure they benefit from."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1)], rows: [fr(1)], columnGap: 28 }, [
      panel({ width: fill, height: fill, padding: { x: 30, y: 26 }, borderRadius: "rounded-lg" }, column({ width: fill, height: fill, gap: 18 }, [
        bodyText("Funded by", 32, colors.ink, true),
        bullet("Grant funding for development, expansion and operations."),
        bullet("Corporate ESG/CSR sponsorship for onboarding and audit-readiness cohorts."),
        bullet("Zakat, waqf, council and institutional support for long-term ecosystem value."),
      ])),
      panel({ width: fill, height: fill, padding: { x: 30, y: 26 }, borderRadius: "rounded-lg" }, column({ width: fill, height: fill, gap: 18 }, [
        bodyText("Sponsored service lines", 32, colors.ink, true),
        bullet("Organisation SaaS subscription and managed bookkeeping."),
        bullet("Audit-readiness, certification support and governance workshops."),
        bullet("Institutional dashboards, CSR/funder reporting tools and reviewer/Shariah marketplace."),
      ])),
    ]),
  ]);
}

function jakimMain() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("JAKIM / MAIN Development Model", "Register the ecosystem first; activate governance over time.", "AGP can become the implementation partner for a living registry and governance workflow under an authority scope."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("Authority scope", "JAKIM or a state MAIN identifies the pilot or rollout cohort.", colors.green),
      proof("AGP registration", "AGP registers mosques, suraus, charities, waqf initiatives and approved entities.", colors.gold),
      proof("Member activation", "Organizations update profiles, reports, evidence and certification progress over time.", colors.blue),
      proof("For JAKIM/MAIN", "Dashboards show reporting gaps, audit-readiness signals and improvement progress.", colors.green),
      proof("For organizations", "Guided onboarding and governance support without AGP fees.", colors.red),
      proof("For donors", "Clearer trust signals before donating.", colors.blue),
    ]),
  ]);
}

function advisor() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Advisor Role", "Prof. Anuar strengthens the behaviour-change and evaluation layer.", "The recommended role is advising member, allowing AGP to apply directly while keeping academic and research pathways open."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1)], rows: [fr(1)], columnGap: 22 }, [
      proof("Adoption model", "Explain what drives digital governance uptake among committees and administrators.", colors.green),
      proof("Training design", "Shape workshops around HRD, organizational learning and volunteer-led capability.", colors.gold),
      proof("Evaluation method", "Guide baseline/endline logic, interviews and behavioural measurement.", colors.blue),
      proof("Credibility", "Position AGP as a serious governance intervention, not only software.", colors.red),
    ]),
    bodyText("USM-linked co-applications remain available where a funder specifically values academic anchoring.", 23, colors.muted),
  ]);
}

function pilotMetrics() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Pilot Evaluation", "Success is measured as capability change, not account creation.", "The pilot should prove that organizations become more evidence-ready, report more consistently and improve trust signals."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("Registry coverage", "100% of agreed JAKIM/MAIN pilot cohort registered.", colors.green),
      proof("Evidence readiness", "80% complete core evidence pack.", colors.gold),
      proof("Reporting discipline", "50% improvement in timeliness against baseline.", colors.blue),
      proof("Amanah movement", "+10 to +15 points where baseline gaps exist.", colors.green),
      proof("Remediation", "70% of findings closed within agreed cycle.", colors.red),
      proof("Trust perception", "20% donor confidence lift after viewing public profiles.", colors.blue),
    ]),
  ]);
}

function funding() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Funding Strategy", "Lead with AGP direct applications, but keep every viable route open.", "The grant execution board remains the pipeline: no route is dropped while JAKIM/MAIN and advisor conversations mature."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("Immediate base", "MD Status, Hasanah Micro, IsDB Engage registration, JAKIM/MAIN letter.", colors.green),
      proof("Build credibility", "Cradle CIP, SC FIKRA ACE, JAWHAR engagement, Shariah advisor.", colors.gold),
      proof("Accelerate", "MDEC MDCG, IERIF/INCEIF, Hasanah Special Grant, pilot coordinators.", colors.blue),
      proof("Scale prep", "IsDB Transform Fund, pilot evidence pack, CSR/ESG sponsorships.", colors.green),
      proof("Scale", "MDAG, additional state MAIN expansion, regional OIC partnerships.", colors.red),
      proof("Academic route", "University-linked co-applications remain open when funder fit is strong.", colors.blue),
    ]),
  ]);
}

function budget() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Use of Funds", "RM550,000 funds a serious 12-month proof cycle.", "The budget supports product hardening, research/evaluation, training, field operations and institutional readiness."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("RM180k", "Platform development, configuration, trust profile polish and data exports.", colors.green),
      proof("RM90k", "Research design, surveys, interviews, analysis and reporting.", colors.blue),
      proof("RM80k", "Training, governance workshops, materials and facilitation.", colors.gold),
      proof("RM90k", "Pilot operations, helpdesk, field coordination and onboarding support.", colors.green),
      proof("RM55k", "Cloud, storage, monitoring, backup, security and compliance support.", colors.blue),
      proof("RM55k", "Dissemination and contingency for delivery risk.", colors.red),
    ]),
  ]);
}

function meetingAsk() {
  const slide = presentation.slides.add();
  compose(slide, [
    topBar(),
    titleBlock("Meeting Ask", "Leave with advisory support and a practical institutional path.", "The decision is not to close every route today; it is to secure enough alignment to move the next proposals forward."),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [fr(1), fr(1)], columnGap: 22, rowGap: 22 }, [
      proof("1. Advisor confirmation", "Invite Prof. Anuar to advise behaviour-change, training and evaluation.", colors.green),
      proof("2. Institutional door", "Identify the first JAKIM/MAIN or JAWHAR conversation and authority scope.", colors.gold),
      proof("3. Grant packaging", "Prepare modular proposals for direct grants, institutions and academic routes.", colors.blue),
      panel({ width: fill, height: fill, padding: { x: 28, y: 24 }, borderRadius: "rounded-lg" }, column({ width: fill, height: fill, gap: 14 }, [
        bodyText("Proposed close", 27, colors.ink, true),
        bodyText("Can Prof. Anuar advise the organizational behaviour model while AGP approaches JAKIM/MAIN and keeps all grant routes open?", 28, colors.green, true),
      ])),
      proof("Next artifact", "One-page JAKIM/MAIN proposal letter plus modular grant concept notes.", colors.red),
      proof("Near-term proof", "Use the live 46-org / 37-profile MVP as the demo evidence.", colors.blue),
    ]),
  ]);
}

[
  cover,
  evidence,
  problem,
  solution,
  trustLoop,
  publicInterest,
  jakimMain,
  advisor,
  pilotMetrics,
  funding,
  budget,
  meetingAsk,
].forEach((fn) => fn());

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(OUT);
console.log(OUT);
