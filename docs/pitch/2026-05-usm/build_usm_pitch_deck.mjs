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

const OUT = "docs/pitch/2026-05-usm/AGP_USM_OrgBehaviour_Pitch_Deck.pptx";
const SCREENSHOT = "docs/pitch/2026-05-usm/live_probe/amanahhub_charities.png";
const presentation = Presentation.create({ slideSize: { width: 1920, height: 1080 } });

const colors = {
  ink: "#172A2A",
  body: "#344542",
  muted: "#65746F",
  soft: "#EEF5F1",
  paper: "#FBFAF6",
  green: "#1F6F5B",
  darkGreen: "#123F35",
  gold: "#B8872D",
  blue: "#2D6684",
  red: "#A54C40",
  line: "#D7E2DD",
};

function compose(slide, children, opts = {}) {
  slide.compose(
    column(
      {
        name: "root",
        width: fill,
        height: fill,
        padding: { x: 86, y: 62 },
        gap: 24,
        ...opts,
      },
      children,
    ),
    { frame: { left: 0, top: 0, width: 1920, height: 1080 }, baseUnit: 8 },
  );
}

function header(kicker, title, subtitle, max = 1420) {
  return column({ width: fill, height: hug, gap: 10 }, [
    text(kicker.toUpperCase(), {
      width: fill,
      height: hug,
      style: { fontSize: 18, bold: true, color: colors.green },
    }),
    text(title, {
      width: wrap(max),
      height: hug,
      style: { fontSize: 50, bold: true, color: colors.ink },
    }),
    subtitle
      ? text(subtitle, {
          width: wrap(1320),
          height: hug,
          style: { fontSize: 23, color: colors.muted },
        })
      : text("", { width: fill, height: fixed(1), style: { fontSize: 1 } }),
  ]);
}

function note(value, options = {}) {
  return text(value, {
    width: options.width ?? fill,
    height: hug,
    style: {
      fontSize: options.size ?? 23,
      color: options.color ?? colors.body,
      bold: options.bold ?? false,
    },
  });
}

function stat(number, label, accent = colors.green) {
  return column({ width: fill, height: hug, gap: 8 }, [
    text(number, { width: fill, height: hug, style: { fontSize: 56, bold: true, color: accent } }),
    text(label, { width: fill, height: hug, style: { fontSize: 20, color: colors.body } }),
  ]);
}

function callout(label, body, accent = colors.green) {
  return panel(
    { width: fill, height: hug, padding: { x: 22, y: 18 }, borderRadius: "rounded-lg" },
    column({ width: fill, height: hug, gap: 8 }, [
      text(label, { width: fill, height: hug, style: { fontSize: 17, bold: true, color: accent } }),
      text(body, { width: fill, height: hug, style: { fontSize: 21, color: colors.ink, bold: true } }),
    ]),
  );
}

function bulletLine(value) {
  return row({ width: fill, height: hug, gap: 12 }, [
    text("-", { width: fixed(18), height: hug, style: { fontSize: 24, bold: true, color: colors.green } }),
    text(value, { width: fill, height: hug, style: { fontSize: 24, color: colors.body } }),
  ]);
}

function stage(number, title, body, accent = colors.green) {
  return column({ width: fill, height: hug, gap: 8 }, [
    text(number, { width: fill, height: hug, style: { fontSize: 20, bold: true, color: accent } }),
    text(title, { width: fill, height: hug, style: { fontSize: 25, bold: true, color: colors.ink } }),
    text(body, { width: fill, height: hug, style: { fontSize: 19, color: colors.muted } }),
  ]);
}

function cover() {
  const slide = presentation.slides.add();
  compose(
    slide,
    [
      row({ width: fill, height: hug }, [
        text("AMANAH GOVERNANCE PLATFORM", {
          width: fill,
          height: hug,
          style: { fontSize: 22, bold: true, color: colors.green },
        }),
        text("May 2026", {
          width: fixed(160),
          height: hug,
          style: { fontSize: 20, color: colors.muted },
        }),
      ]),
      rule({ width: fixed(320), stroke: colors.gold, weight: 5 }),
      text("Public-Interest Governance Infrastructure for Islamic Social Finance", {
        width: wrap(1500),
        height: hug,
        style: { fontSize: 76, bold: true, color: colors.ink },
      }),
      text(
        "AGP-led grant and development proposal with Prof. Anuar as advising member and JAKIM/MAIN as potential authority-side partners.",
        { width: wrap(1280), height: hug, style: { fontSize: 30, color: colors.body } },
      ),
      row({ width: fill, height: hug, gap: 28 }, [
        callout("Position", "Live seeded MVP, not a paper concept", colors.green),
        callout("Principle", "Charity organizations do not pay AGP", colors.red),
        callout("Route", "Keep all grant pathways open", colors.blue),
      ]),
    ],
    { gap: 34 },
  );
}

function liveEvidence() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Evidence",
      "AmanahHub is already live with public trust profiles.",
      "The current deployed public directory provides a credible demo base for funders, JAKIM/MAIN discussions, and advisor review.",
    ),
    grid({ width: fill, height: fill, columns: [fr(0.84), fr(1.16)], rows: [auto], columnGap: 34 }, [
      column({ width: fill, height: hug, gap: 24 }, [
        stat("46", "visible organisations in the public charity directory", colors.green),
        stat("37", "published trust profiles with donor-facing trust cards", colors.blue),
        stat("Gold / Silver / Bronze", "certification language already visible in seeded profiles", colors.gold),
        note("Live protected surfaces also exist for amanahOS and AGP Console.", { size: 20, color: colors.muted }),
      ]),
      panel(
        { width: fill, height: fixed(610), padding: { x: 0, y: 0 }, borderRadius: "rounded-lg" },
        image({ path: SCREENSHOT, width: fill, height: fill, fit: "cover", alt: "AmanahHub charities directory screenshot" }),
      ),
    ]),
  ]);
}

function problem() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Problem",
      "Islamic giving has scale, but governance remains fragmented at the operating edge.",
      "Mosques, suraus, waqf initiatives and charities often need a shared system for evidence, reporting, review and public trust.",
    ),
    row({ width: fill, height: fill, gap: 42 }, [
      column({ width: grow(1), height: hug, gap: 20 }, [
        bulletLine("Public generosity is real, but donor confidence depends on visible accountability."),
        bulletLine("Manual reporting and scattered files make oversight slow, reactive and difficult to standardise."),
        bulletLine("Volunteer-led committees need routines, training and simple workflows, not only policy reminders."),
        bulletLine("Authorities need dashboards that respect MAIN/JAKIM authority while reducing administrative burden."),
      ]),
      column({ width: grow(0.82), height: hug, gap: 18 }, [
        callout("Behavioural insight", "The bottleneck is not only technology adoption. It is organizational habit formation.", colors.blue),
        callout("Governance insight", "Trust improves when evidence, review, remediation and publication become routine.", colors.green),
        callout("Institutional insight", "A shared registry can help each authority see its ecosystem without replacing its authority.", colors.gold),
      ]),
    ]),
  ]);
}

function solution() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Solution",
      "AGP connects public trust, organization operations and evaluator control.",
      "The platform is structured as a public-interest governance layer rather than a commercial product sold to charities.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [auto], columnGap: 30 }, [
      stage("01", "AmanahHub", "Public donor directory, verified trust profiles, scores, certification tiers and direct-to-charity giving context.", colors.green),
      stage("02", "amanahOS", "Organisation workspace for profiles, accounting, evidence, projects, reports, policy kit, trust score and certification.", colors.gold),
      stage("03", "AGP Console", "Evaluator and platform control plane for trust events, governance cases, review queues, scholar approval and publication.", colors.blue),
    ]),
    note("Shared backbone: Amanah scoring engine, Supabase schema, trust events, fund accounting, audit logs and public profile publication controls.", {
      size: 22,
      color: colors.body,
    }),
  ]);
}

function trustLoop() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Operating Model",
      "The trust loop turns amanah into a repeatable governance rhythm.",
      "Each stage creates evidence that can be reviewed, improved and selectively published.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1), fr(1), fr(1)], rows: [auto], columnGap: 18 }, [
      stage("1", "Register", "AGP creates the authority-linked organization record and public baseline.", colors.green),
      stage("2", "Operate", "Members update reports, projects, bookkeeping, policies and evidence over time.", colors.gold),
      stage("3", "Review", "Console routes trust events, clarifications, findings and scholar approval.", colors.blue),
      stage("4", "Score", "Amanah Index converts verified behaviour into donor-readable trust signals.", colors.green),
      stage("5", "Publish", "Approved public profiles help donors and authorities see accountable progress.", colors.red),
    ]),
    rule({ width: fill, stroke: colors.line, weight: 2 }),
    note("This is especially useful for organizations that are under the authority of JAKIM or a state MAIN but have varying levels of digital maturity.", {
      size: 22,
      color: colors.muted,
    }),
  ]);
}

function publicInterest() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Public-Interest Principle",
      "Charity organizations receive governance services without paying AGP.",
      "The payer model should be aligned with public trust: funders and institutions support the infrastructure because they benefit from sector-wide accountability.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1)], rows: [auto], columnGap: 42 }, [
      column({ width: fill, height: hug, gap: 16 }, [
        note("Funded by", { size: 28, bold: true, color: colors.ink }),
        bulletLine("Grant funding for development, expansion and operations."),
        bulletLine("Corporate ESG/CSR sponsorship for onboarding and audit-readiness cohorts."),
        bulletLine("Zakat, waqf, council and institutional support for long-term ecosystem value."),
      ]),
      column({ width: fill, height: hug, gap: 16 }, [
        note("Sponsored service lines", { size: 28, bold: true, color: colors.ink }),
        bulletLine("Organisation SaaS subscription and managed bookkeeping."),
        bulletLine("Audit-readiness, certification support and governance workshops."),
        bulletLine("Institutional dashboards, CSR/funder reporting tools and reviewer/Shariah marketplace."),
      ]),
    ]),
  ]);
}

function jakimMain() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "JAKIM / MAIN Development Model",
      "Register the ecosystem first; activate governance over time.",
      "AGP can become the implementation partner that creates a living registry and governance workflow for organizations under an authority scope.",
    ),
    row({ width: fill, height: fill, gap: 34 }, [
      column({ width: grow(1), height: hug, gap: 16 }, [
        stage("Step 1", "Authority scope", "JAKIM or a state MAIN identifies the organizations under the selected pilot or rollout scope.", colors.green),
        stage("Step 2", "AGP registration", "AGP registers mosques, suraus, charities, waqf initiatives and other approved entities into the platform.", colors.gold),
        stage("Step 3", "Member activation", "Organization members update profiles, reports, evidence, bookkeeping and certification progress over time.", colors.blue),
      ]),
      column({ width: grow(0.92), height: hug, gap: 16 }, [
        callout("For JAKIM/MAIN", "Central dashboard visibility, reporting gaps, audit-readiness signals and better public confidence.", colors.green),
        callout("For organizations", "Guided onboarding, governance support and public trust profile readiness without AGP fees.", colors.gold),
        callout("For donors", "Clearer trust signals before donating, with direct-to-charity giving context.", colors.blue),
      ]),
    ]),
  ]);
}

function advisor() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Advisor Role",
      "Prof. Anuar can strengthen the behaviour-change and evaluation layer.",
      "The recommended role is advising member, allowing AGP to apply directly while still benefiting from organizational behaviour expertise.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1)], rows: [auto, auto], columnGap: 28, rowGap: 22 }, [
      callout("Adoption model", "Explain what drives digital governance uptake among committees and administrators.", colors.green),
      callout("Training design", "Shape workshops around HRD, organizational learning and volunteer-led capability building.", colors.gold),
      callout("Evaluation method", "Guide baseline/endline logic, interview framing and behavioural measurement.", colors.blue),
      callout("Credibility", "Help position AGP as a serious governance intervention, not just a software demo.", colors.red),
    ]),
    note("This keeps USM-linked research possibilities open without making USM the only route or formal applicant anchor.", {
      size: 22,
      color: colors.muted,
    }),
  ]);
}

function metrics() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Pilot Evaluation",
      "Success should be measured as capability change, not just account creation.",
      "The live seeded MVP gives funders confidence; the pilot should prove real organizational behaviour change.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [auto, auto], columnGap: 26, rowGap: 22 }, [
      callout("Registry coverage", "100% of agreed JAKIM/MAIN pilot cohort registered.", colors.green),
      callout("Evidence readiness", "80% complete core evidence pack.", colors.gold),
      callout("Reporting discipline", "50% improvement in timeliness against baseline.", colors.blue),
      callout("Amanah movement", "+10 to +15 points where baseline gaps exist.", colors.green),
      callout("Remediation", "70% of findings closed within agreed cycle.", colors.red),
      callout("Trust perception", "20% donor confidence lift after viewing public profiles.", colors.blue),
    ]),
  ]);
}

function funding() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Funding Strategy",
      "Lead with AGP direct applications, but keep every viable route open.",
      "The grant execution board remains the pipeline: no route is dropped while the JAKIM/MAIN and advisor conversations mature.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1), fr(1)], rows: [auto, auto], columnGap: 24, rowGap: 22 }, [
      callout("Immediate base", "MD Status, Hasanah Micro, IsDB Engage registration, JAKIM/MAIN letter.", colors.green),
      callout("Build credibility", "Cradle CIP, SC FIKRA ACE, JAWHAR engagement, Shariah advisor.", colors.gold),
      callout("Accelerate", "MDEC MDCG, IERIF/INCEIF, Hasanah Special Grant, pilot coordinators.", colors.blue),
      callout("Scale prep", "IsDB Transform Fund, pilot evidence pack, CSR/ESG sponsorships.", colors.green),
      callout("Scale", "MDAG, additional state MAIN expansion, regional OIC partnerships.", colors.red),
      callout("Academic route", "University-linked co-applications stay available when funder fit is strong.", colors.blue),
    ]),
  ]);
}

function budget() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Use of Funds",
      "RM550,000 funds a serious 12-month proof cycle.",
      "The budget supports product hardening, research/evaluation, training, field operations and institutional readiness.",
    ),
    grid({ width: fill, height: fill, columns: [fr(1), fr(1)], rows: [auto], columnGap: 44 }, [
      column({ width: fill, height: hug, gap: 14 }, [
        callout("RM180k", "Platform development, configuration, trust profile polish and data exports.", colors.green),
        callout("RM90k", "Research design, surveys, interviews, analysis and reporting.", colors.blue),
        callout("RM80k", "Training, governance workshops, materials and facilitation.", colors.gold),
      ]),
      column({ width: fill, height: hug, gap: 14 }, [
        callout("RM90k", "Pilot operations, helpdesk, field coordination and onboarding support.", colors.green),
        callout("RM55k", "Cloud, storage, monitoring, backup, security and compliance support.", colors.blue),
        callout("RM55k", "Dissemination and contingency for delivery risk.", colors.red),
      ]),
    ]),
  ]);
}

function ask() {
  const slide = presentation.slides.add();
  compose(slide, [
    header(
      "Meeting Ask",
      "Leave with advisory support and a practical institutional path.",
      "The decision is not to close every route today; it is to secure enough alignment to move the next proposals forward.",
    ),
    row({ width: fill, height: fill, gap: 42 }, [
      column({ width: grow(1), height: hug, gap: 18 }, [
        stage("1", "Advisor confirmation", "Invite Prof. Anuar to advise the behaviour-change, training and evaluation layer.", colors.green),
        stage("2", "Institutional door", "Identify the best first JAKIM/MAIN or JAWHAR conversation and authority scope.", colors.gold),
        stage("3", "Grant packaging", "Prepare modular proposals for direct grants, institutional partners and academic routes.", colors.blue),
      ]),
      panel(
        { width: grow(0.85), height: hug, padding: { x: 34, y: 30 }, borderRadius: "rounded-lg" },
        column({ width: fill, height: hug, gap: 18 }, [
          text("Proposed close", { width: fill, height: hug, style: { fontSize: 30, bold: true, color: colors.ink } }),
          text(
            "Can Prof. Anuar advise the organizational behaviour model while AGP approaches JAKIM/MAIN and keeps all grant routes open?",
            { width: fill, height: hug, style: { fontSize: 33, bold: true, color: colors.green } },
          ),
        ]),
      ),
    ]),
  ]);
}

[
  cover,
  liveEvidence,
  problem,
  solution,
  trustLoop,
  publicInterest,
  jakimMain,
  advisor,
  metrics,
  funding,
  budget,
  ask,
].forEach((fn) => fn());

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(OUT);
console.log(OUT);
