// apps/org/app/api/audit-package/route.ts
// Sprint 29 — Audit-Ready Package Download
//
// GET /api/audit-package?orgId=<uuid>   (orgId optional — falls back to membership lookup)
//
// DEPENDENCY: pnpm add pdf-lib  (in apps/org)

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

// ── Helpers ───────────────────────────────────────────────────────────────────
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

/** Returns true only for plausible UUID-shaped strings */
function isValidUuid(v: string | null | undefined): v is string {
  if (!v || v === 'undefined' || v === 'null') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// ── ZIP builder ───────────────────────────────────────────────────────────────
async function createZipBuffer(
  files: Array<{ name: string; content: Buffer | string }>
): Promise<Buffer> {
  try {
    const archiver = await import('archiver');
    return await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archiverFn = (
        ((archiver as { default?: unknown }).default ?? archiver) as unknown as (
          format: 'zip',
          options?: { zlib?: { level?: number } }
        ) => {
          append: (input: Buffer | string, data: { name: string }) => void;
          finalize: () => void | Promise<void>;
          on: (event: string, listener: (...args: unknown[]) => void) => void;
        }
      );
      const archive = archiverFn('zip', { zlib: { level: 9 } });
      archive.on('data',  (chunk) => chunks.push(chunk as Buffer));
      archive.on('error', reject);
      archive.on('end',   () => resolve(Buffer.concat(chunks)));
      for (const f of files) {
        archive.append(
          typeof f.content === 'string' ? Buffer.from(f.content, 'utf8') : f.content,
          { name: f.name }
        );
      }
      archive.finalize();
    });
  } catch {
    const parts: string[] = ['=== AMANAH AUDIT PACKAGE ===\n'];
    for (const f of files) {
      parts.push(`\n--- ${f.name} ---\n`);
      parts.push(typeof f.content === 'string' ? f.content : f.content.toString('base64'));
    }
    return Buffer.from(parts.join(''), 'utf8');
  }
}

// ── PDF generator (pure TypeScript / pdf-lib) ─────────────────────────────────
async function generatePdfBuffer(data: {
  org:      Record<string, unknown>;
  members:  Array<{ name: string; email: string; role: string }>;
  closes:   Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  reports:  Array<Record<string, unknown>>;
  policies: Array<Record<string, unknown>>;
  certs:    Array<Record<string, unknown>>;
  score:    Record<string, unknown>;
  events:   Array<Record<string, unknown>>;
}): Promise<Buffer> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);

  const { org, members, closes, projects, reports, policies, certs, score, events } = data;

  const PAGE_W = PageSizes.A4[0];
  const PAGE_H = PageSizes.A4[1];
  const MARGIN = 50;
  const COL_W  = PAGE_W - MARGIN * 2;

  const GREEN = rgb(0.04, 0.44, 0.28);
  const BLACK = rgb(0, 0, 0);
  const GRAY  = rgb(0.4, 0.4, 0.4);
  const LGRAY = rgb(0.85, 0.85, 0.85);
  const WHITE = rgb(1, 1, 1);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const orgName = (org?.name as string) ?? '—';

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y    = PAGE_H - MARGIN;

  function newPage() { drawFooter(); page = doc.addPage([PAGE_W, PAGE_H]); y = PAGE_H - MARGIN; }
  function ensureSpace(n: number) { if (y - n < MARGIN + 40) newPage(); }
  function drawFooter() {
    page.drawLine({ start: { x: MARGIN, y: MARGIN + 20 }, end: { x: PAGE_W - MARGIN, y: MARGIN + 20 }, thickness: 0.5, color: LGRAY });
    page.drawText(`Amanah Governance Platform · ${dateStr} · amanahgp.com`, { x: MARGIN, y: MARGIN + 6, size: 7, font: reg, color: GRAY });
  }
  function drawText(text: string, opts: { size?: number; font?: typeof reg; color?: typeof BLACK; indent?: number }) {
    const { size = 10, font = reg, color = BLACK, indent = 0 } = opts;
    const maxW = COL_W - indent;
    const words = String(text ?? '').split(' ');
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxW && line) {
        ensureSpace(size + 4); page.drawText(line, { x: MARGIN + indent, y, size, font, color }); y -= size + 4; line = word;
      } else { line = trial; }
    }
    if (line) { ensureSpace(size + 4); page.drawText(line, { x: MARGIN + indent, y, size, font, color }); y -= size + 4; }
  }
  function drawSectionHeader(title: string) {
    ensureSpace(28); y -= 6;
    page.drawRectangle({ x: MARGIN, y: y - 4, width: COL_W, height: 20, color: GREEN });
    page.drawText(title, { x: MARGIN + 6, y: y + 2, size: 11, font: bold, color: WHITE });
    y -= 24;
  }
  function drawKV(label: string, value: unknown) {
    ensureSpace(14);
    const lw = bold.widthOfTextAtSize(`${label}: `, 9);
    page.drawText(`${label}: `, { x: MARGIN, y, size: 9, font: bold, color: BLACK });
    page.drawText(String(value ?? '—'), { x: MARGIN + lw, y, size: 9, font: reg, color: GRAY });
    y -= 13;
  }
  function drawHR() {
    ensureSpace(10); y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: LGRAY }); y -= 6;
  }
  function drawTableRow(cols: string[], widths: number[], isHeader: boolean, rowY: number) {
    let x = MARGIN;
    if (isHeader) page.drawRectangle({ x: MARGIN, y: rowY - 2, width: COL_W, height: 16, color: rgb(0.94, 0.97, 0.95) });
    for (let i = 0; i < cols.length; i++) {
      const t = cols[i].length > 40 ? cols[i].slice(0, 38) + '…' : cols[i];
      page.drawText(t, { x: x + 3, y: rowY + 2, size: 8, font: isHeader ? bold : reg, color: isHeader ? GREEN : BLACK });
      x += widths[i];
    }
  }
  function drawTable(headers: string[], rows: string[][], widths: number[]) {
    const rowH = 18;
    ensureSpace(rowH * 2);
    drawTableRow(headers, widths, true, y); y -= rowH;
    for (const row of rows) { ensureSpace(rowH); drawTableRow(row, widths, false, y); y -= rowH; }
    y -= 4;
  }

  // Cover
  page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: GREEN });
  page.drawText('AUDIT-READY PACKAGE',        { x: MARGIN, y: PAGE_H - 60,  size: 22, font: bold, color: WHITE });
  page.drawText('Amanah Governance Platform', { x: MARGIN, y: PAGE_H - 82,  size: 11, font: reg,  color: rgb(0.7, 0.9, 0.8) });
  page.drawText('amanahgp.com',               { x: MARGIN, y: PAGE_H - 98,  size: 9,  font: reg,  color: rgb(0.6, 0.85, 0.75) });
  y = PAGE_H - 150;
  page.drawText(orgName, { x: MARGIN, y, size: 18, font: bold, color: BLACK }); y -= 24;
  page.drawText(`Generated: ${dateStr}`, { x: MARGIN, y, size: 10, font: reg, color: GRAY }); y -= 20;
  drawHR();
  page.drawText('CONTENTS', { x: MARGIN, y, size: 10, font: bold, color: GREEN }); y -= 16;
  for (const s of [
    '1. Organisation Profile','2. Committee Members','3. Financial Summary',
    '4. Fund Accounting Records','5. Programme Activity','6. Progress Reports',
    '7. Governance Policies','8. Trust Events Log','9. Certification History','10. Declaration',
  ]) { page.drawText(`• ${s}`, { x: MARGIN + 10, y, size: 9, font: reg, color: BLACK }); y -= 13; }
  drawFooter();

  // Section 1
  newPage(); drawSectionHeader('1. Organisation Profile');
  const o = org as Record<string, unknown>;
  drawKV('Name',                orgName);
  drawKV('Registration No',     o?.registration_no);
  drawKV('Organisation Type',   o?.org_type);
  drawKV('Registration Type',   o?.registration_type);
  drawKV('State',               o?.state);
  drawKV('Oversight Authority', o?.oversight_authority);
  drawKV('Website',             o?.website_url);
  drawKV('Email',               o?.contact_email);
  drawKV('Phone',               o?.contact_phone);
  drawKV('Address',             o?.address_text);
  drawKV('Shariah Governance',  o?.shariah_governance_present ? 'Yes' : 'No');
  drawKV('Zakat Handling',      (o?.fund_types as string[] | undefined)?.includes('zakat') ? 'Enabled' : 'Disabled');
  drawKV('Waqf Handling',       (o?.fund_types as string[] | undefined)?.includes('waqf')  ? 'Enabled' : 'Disabled');
  drawKV('Amanah Score',        score?.score_value !== undefined ? `${score.score_value}/100` : '—');

  // Section 2
  drawSectionHeader('2. Committee Members');
  if (members.length === 0) drawText('No committee members recorded.', { color: GRAY });
  else drawTable(['Name','Email','Role'], members.map(m => [m.name, m.email, m.role]), [160, 200, 120]);

  // Section 3
  drawSectionHeader('3. Financial Summary');
  const totalIncome  = closes.reduce((s, c) => s + Number(c.total_income  ?? 0), 0);
  const totalExpense = closes.reduce((s, c) => s + Number(c.total_expense ?? 0), 0);
  drawKV('Total Periods Closed',        closes.length);
  drawKV('Total Income (all periods)',  `MYR ${totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`);
  drawKV('Total Expense (all periods)', `MYR ${totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`);
  drawKV('Net Surplus / (Deficit)',     `MYR ${(totalIncome - totalExpense).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`);

  // Section 4
  drawSectionHeader('4. Fund Accounting Records');
  if (closes.length === 0) drawText('No closed financial periods recorded.', { color: GRAY });
  else drawTable(
    ['Period','Income (MYR)','Expense (MYR)','Status'],
    closes.map(c => [
      String(c.period_label ?? c.period_name ?? c.id ?? '—').slice(0, 24),
      Number(c.total_income  ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }),
      Number(c.total_expense ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 }),
      String(c.status ?? 'closed'),
    ]),
    [130, 120, 120, 100]
  );

  // Section 5
  drawSectionHeader('5. Programme Activity');
  if (projects.length === 0) drawText('No programmes recorded.', { color: GRAY });
  else drawTable(
    ['Programme','Status','Start Date','End Date'],
    projects.map(p => [
      String(p.name ?? p.title ?? '—').slice(0, 30), String(p.status ?? '—'),
      String(p.start_date ?? '—').slice(0, 10),      String(p.end_date ?? '—').slice(0, 10),
    ]),
    [160, 80, 100, 100]
  );

  // Section 6
  drawSectionHeader('6. Progress Reports');
  if (reports.length === 0) drawText('No progress reports recorded.', { color: GRAY });
  else drawTable(
    ['Report Title','Period','Status','Submitted'],
    reports.map(r => [
      String(r.title ?? r.report_title ?? '—').slice(0, 28),
      String(r.reporting_period ?? r.period ?? '—').slice(0, 20),
      String(r.status ?? '—'),
      String(r.submitted_at ?? r.created_at ?? '—').slice(0, 10),
    ]),
    [160, 120, 80, 100]
  );

  // Section 7
  drawSectionHeader('7. Governance Policies');
  if (policies.length === 0) drawText('No governance policies uploaded.', { color: GRAY });
  else drawTable(
    ['Policy Name','Type','Status','Uploaded'],
    policies.map(p => [
      String(p.name ?? p.document_name ?? p.title ?? '—').slice(0, 30),
      String(p.document_type ?? p.type ?? '—'), String(p.status ?? '—'),
      String(p.created_at ?? '—').slice(0, 10),
    ]),
    [160, 120, 80, 100]
  );

  // Section 8
  drawSectionHeader('8. Trust Events Log');
  if (events.length === 0) drawText('No trust events recorded.', { color: GRAY });
  else drawTable(
    ['Event Type','Impact','Source','Date'],
    events.map(e => [
      String(e.event_type ?? '—').slice(0, 28),
      String(e.impact_direction ?? e.direction ?? '—'),
      String(e.source_table ?? e.source ?? '—').slice(0, 20),
      String(e.occurred_at ?? e.created_at ?? '—').slice(0, 10),
    ]),
    [160, 80, 120, 100]
  );

  // Section 9
  drawSectionHeader('9. Certification History');
  if (certs.length === 0) drawText('No certification records found.', { color: GRAY });
  else drawTable(
    ['Framework','Grade','Score','Date'],
    certs.map(c => [
      String(c.framework ?? c.certification_framework ?? '—').slice(0, 24),
      String(c.grade ?? c.certification_grade ?? '—'),
      String(c.score ?? c.total_score ?? '—'),
      String(c.evaluated_at ?? c.created_at ?? '—').slice(0, 10),
    ]),
    [160, 80, 80, 120]
  );

  // Section 10 — Declaration
  ensureSpace(300);
  if (y < PAGE_H - MARGIN - 200) newPage();
  drawSectionHeader('10. Declaration');
  drawText(
    `I, the undersigned, declare that the information contained in this Audit-Ready Package ` +
    `for ${orgName} is accurate and complete to the best of my knowledge, and that the ` +
    `organisation operates in compliance with its governing documents and applicable Malaysian regulations.`,
    { size: 9, color: BLACK }
  );
  y -= 20;
  const sigY  = y;
  const halfW = COL_W / 2 - 10;
  page.drawText('Authorised Signatory',        { x: MARGIN, y: sigY,      size: 9, font: bold, color: BLACK });
  page.drawText('Chairman / President',        { x: MARGIN, y: sigY - 13, size: 8, font: reg,  color: GRAY });
  page.drawLine({ start: { x: MARGIN, y: sigY - 40 }, end: { x: MARGIN + halfW, y: sigY - 40 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Signature & Date',            { x: MARGIN, y: sigY - 52, size: 7, font: reg,  color: GRAY });
  const rx = MARGIN + halfW + 20;
  page.drawText('Finance Officer / Treasurer', { x: rx, y: sigY,      size: 9, font: bold, color: BLACK });
  page.drawText('Finance Manager',             { x: rx, y: sigY - 13, size: 8, font: reg,  color: GRAY });
  page.drawLine({ start: { x: rx, y: sigY - 40 }, end: { x: rx + halfW, y: sigY - 40 }, thickness: 0.8, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Signature & Date',            { x: rx, y: sigY - 52, size: 7, font: reg,  color: GRAY });
  y -= 80;
  ensureSpace(90);
  page.drawRectangle({ x: MARGIN, y: y - 80, width: 160, height: 80, borderColor: LGRAY, borderWidth: 1, color: rgb(0.97, 0.97, 0.97) });
  page.drawText('Official stamp / Chop rasmi', { x: MARGIN + 8, y: y - 20, size: 8, font: reg, color: GRAY });
  y -= 100;
  drawFooter();

  return Buffer.from(await doc.save());
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Platform user (users table, keyed by auth_provider_user_id)
  const { data: platformUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_provider_user_id', user.id)
    .maybeSingle();

  if (!platformUser) {
    return NextResponse.json({ error: 'User record not found' }, { status: 403 });
  }

  const service = createServiceClient();

  // 3. Resolve orgId
  //    — use query param if it looks like a real UUID
  //    — otherwise fall back to the user's first active org membership
  const rawOrgId = req.nextUrl.searchParams.get('orgId');
  let   orgId    = '';

  if (isValidUuid(rawOrgId)) {
    orgId = rawOrgId;
  } else {
    // Fallback: derive from membership
    const { data: mem } = await service
      .from('org_members')
      .select('organization_id')
      .eq('user_id', platformUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!mem?.organization_id) {
      return NextResponse.json({ error: 'No organisation found for user' }, { status: 404 });
    }
    orgId = mem.organization_id;
  }

  // 4. Verify the requesting user belongs to this org (security — always run)
  const { data: membership } = await service
    .from('org_members')
    .select('org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Access denied to this organisation' }, { status: 403 });
  }

  // 5. Fetch all data in parallel
  const [
    orgRes, membersRes, closesRes, projectsRes,
    reportsRes, policiesRes, certsRes, scoreRes, eventsRes,
  ] = await Promise.all([
    service.from('organizations').select('*').eq('id', orgId).maybeSingle(),
    service.from('org_members')
      .select('org_role, users(display_name, email)')
      .eq('organization_id', orgId).eq('status', 'active'),
    service.from('financial_period_closes').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    service.from('projects').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    service.from('reports').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    service.from('org_documents').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    service.from('certification_evaluations').select('*').eq('organization_id', orgId).order('evaluated_at', { ascending: false }),
    service.from('amanah_index_history').select('*').eq('organization_id', orgId).order('computed_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('trust_events').select('*').eq('organization_id', orgId).order('occurred_at', { ascending: false }).limit(50),
  ]);

  const org     = orgRes.data ?? {};
  const members = (membersRes.data ?? []).map((m) => {
    const u = relationOne<{ display_name: string | null; email: string }>(m.users);
    return { name: u?.display_name ?? '—', email: u?.email ?? '—', role: m.org_role };
  });

  // 6. Generate PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePdfBuffer({
      org,
      members,
      closes:   closesRes.data   ?? [],
      projects: projectsRes.data ?? [],
      reports:  reportsRes.data  ?? [],
      policies: policiesRes.data ?? [],
      certs:    certsRes.data    ?? [],
      score:    (scoreRes.data   ?? {}) as Record<string, unknown>,
      events:   eventsRes.data   ?? [],
    });
  } catch (err) {
    console.error('[audit-package] PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed. Check server logs.' }, { status: 500 });
  }

  // 7. Supporting text files
  const now          = new Date();
  const dateStr      = now.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const orgSlug      = ((org?.name as string) ?? 'org').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const totalIncome  = (closesRes.data ?? []).reduce((s, c) => s + Number(c.total_income),  0);
  const totalExpense = (closesRes.data ?? []).reduce((s, c) => s + Number(c.total_expense), 0);
  const o = org as Record<string, unknown>;

  const financialJson = JSON.stringify({
    generated_at: now.toISOString(), organization: o?.name,
    summary: { total_income: totalIncome, total_expense: totalExpense, net_surplus: totalIncome - totalExpense, periods: closesRes.data?.length ?? 0 },
    periods: closesRes.data ?? [],
  }, null, 2);

  const trustEventsJson = JSON.stringify({
    generated_at: now.toISOString(), organization: o?.name,
    total_events: eventsRes.data?.length ?? 0, events: eventsRes.data ?? [],
  }, null, 2);

  const orgProfileTxt = `ORGANISATION PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:                ${o?.name ?? '—'}
Registration No:     ${o?.registration_no ?? '—'}
Organisation Type:   ${o?.org_type ?? '—'}
State:               ${o?.state ?? '—'}
Oversight Authority: ${o?.oversight_authority ?? '—'}
Contact Email:       ${o?.contact_email ?? '—'}
Website:             ${o?.website_url ?? '—'}
Amanah Score:        ${(scoreRes.data as Record<string, unknown> | null)?.score_value ?? '—'}/100
Generated:           ${dateStr}
Source:              Amanah Governance Platform (amanahgp.com)
`;

  const readmeTxt = `AMANAH GOVERNANCE PLATFORM — AUDIT PACKAGE
Generated: ${dateStr}
Organisation: ${o?.name ?? '—'}

FILES
  audit-package.pdf        — Complete audit-ready document (print & sign Section 10)
  financial-summary.json   — Machine-readable financial data
  trust-events.json        — Governance trust events log
  organisation-profile.txt — Plain text org profile

Amanah Governance Platform · amanahgp.com · Trusted Giving. Transparent Governance.
`;

  // 8. Build ZIP
  let zipBuffer: Buffer;
  try {
    zipBuffer = await createZipBuffer([
      { name: 'audit-package.pdf',        content: pdfBuffer },
      { name: 'financial-summary.json',   content: financialJson },
      { name: 'trust-events.json',        content: trustEventsJson },
      { name: 'organisation-profile.txt', content: orgProfileTxt },
      { name: 'README.txt',               content: readmeTxt },
    ]);
  } catch (err) {
    console.error('[audit-package] ZIP error:', err);
    return NextResponse.json({ error: 'Failed to build audit package.' }, { status: 500 });
  }

  const dateCode = now.toISOString().split('T')[0];
  const filename = `amanah-audit-${orgSlug}-${dateCode}.zip`;

  const zipBody = zipBuffer.buffer.slice(
    zipBuffer.byteOffset,
    zipBuffer.byteOffset + zipBuffer.byteLength
  ) as ArrayBuffer;

  return new NextResponse(zipBody, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(zipBuffer.length),
    },
  });
}

