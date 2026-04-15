// apps/org/app/api/audit-package/route.ts
// Sprint 29 — Audit-Ready Package Download
//
// GET /api/audit-package
//
// Fetches all org data, generates:
//   - audit-package.pdf (reportlab via Python)
//   - financial-summary.json
//   - trust-events.json
//   - organisation-profile.txt
//   - README.txt
// Bundles into ZIP and returns as download.
//
// The Python script is at scripts/generate_audit_pdf.py
// Must be deployed alongside the Next.js app.

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';
import { spawn }               from 'child_process';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { tmpdir }              from 'os';
import path                    from 'path';

// Dynamically import archiver (install: npm install archiver @types/archiver)
// Fallback: use JSZip if archiver not available
async function createZipBuffer(files: Array<{ name: string; content: Buffer | string }>): Promise<Buffer> {
  try {
    const archiver = await import('archiver');
    return await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = (archiver as unknown as typeof import('archiver').default).create('zip', { zlib: { level: 9 } });
      archive.on('data',  (chunk: Buffer) => chunks.push(chunk));
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
    // Fallback: concatenate all files as a simple multi-file text bundle
    // (not a real ZIP, but better than nothing if archiver not installed)
    const parts: string[] = ['=== AMANAH AUDIT PACKAGE ===\n'];
    for (const f of files) {
      parts.push(`\n--- ${f.name} ---\n`);
      parts.push(typeof f.content === 'string' ? f.content : f.content.toString('base64'));
    }
    return Buffer.from(parts.join(''), 'utf8');
  }
}

async function generatePdf(data: object, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Find the Python script — relative to the project root
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_audit_pdf.py');
    const py         = spawn('python3', [scriptPath, pdfPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    py.stdin.write(JSON.stringify(data));
    py.stdin.end();

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    py.stderr.on('data', (d: Buffer) => (stderr += d.toString()));

    py.on('close', (code) => {
      if (code === 0 && stdout.includes('OK')) {
        resolve();
      } else {
        reject(new Error(`PDF generation failed (code ${code}): ${stderr}`));
      }
    });
  });
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return new NextResponse('Not found', { status: 404 });

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, organizations(id, name, legal_name, registration_no, org_type, state, oversight_authority, fund_types, contact_email, contact_phone, website_url, address_text, summary)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) return new NextResponse('No org', { status: 403 });

  const orgId = membership.organization_id;
  const org   = membership.organizations as Record<string, unknown> | null;

  // ── Fetch all data in parallel ─────────────────────────────
  const [
    membersRes, closesRes, projectsRes, reportsRes,
    policiesRes, certsRes, scoreRes, eventsRes,
  ] = await Promise.all([
    service.from('org_members')
      .select('org_role, users(display_name, email)')
      .eq('organization_id', orgId).eq('status', 'active'),

    service.from('fund_period_closes')
      .select('period_year, period_month, total_income, total_expense, closed_at')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false }).limit(24),

    service.from('projects')
      .select('title, objective, status, budget_amount')
      .eq('organization_id', orgId).in('status', ['active', 'completed']).limit(20),

    service.from('project_reports')
      .select('title, report_date, verification_status, submission_status, report_body')
      .eq('organization_id', orgId).eq('submission_status', 'submitted').limit(20),

    service.from('org_documents')
      .select('document_type, label, created_at')
      .eq('organization_id', orgId).eq('document_category', 'governance'),

    service.from('certification_history')
      .select('new_status, valid_from, valid_to, decision_reason, decided_at')
      .eq('organization_id', orgId)
      .order('decided_at', { ascending: false }).limit(5),

    service.from('amanah_index_history')
      .select('score_value, score_version, computed_at, breakdown')
      .eq('organization_id', orgId)
      .order('computed_at', { ascending: false }).limit(1).maybeSingle(),

    service.from('trust_events')
      .select('event_type, pillar, score_delta, occurred_at')
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false }).limit(20),
  ]);

  // Shape members for Python script
  const members = (membersRes.data ?? []).map((m) => {
    const u = m.users as { display_name: string | null; email: string } | null;
    return { name: u?.display_name ?? '—', email: u?.email ?? '—', role: m.org_role };
  });

  const packageData = {
    org,
    members,
    closes:   closesRes.data   ?? [],
    projects: projectsRes.data ?? [],
    reports:  reportsRes.data  ?? [],
    policies: policiesRes.data ?? [],
    certs:    certsRes.data    ?? [],
    score:    scoreRes.data    ?? {},
    events:   eventsRes.data   ?? [],
  };

  const now      = new Date();
  const dateStr  = now.toISOString().split('T')[0];
  const orgSlug  = (org?.name as string ?? 'org').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const tmpDir   = tmpdir();
  const pdfPath  = path.join(tmpDir, `audit-${orgSlug}-${dateStr}.pdf`);

  // ── Generate PDF ────────────────────────────────────────────
  let pdfBuffer: Buffer;
  try {
    await generatePdf(packageData, pdfPath);
    pdfBuffer = await readFile(pdfPath);
    await unlink(pdfPath).catch(() => {});
  } catch (err) {
    console.error('[audit-package] PDF generation error:', err);
    // Return an error response rather than crashing
    return NextResponse.json(
      { error: 'PDF generation failed. Ensure the Python script is deployed.' },
      { status: 500 }
    );
  }

  // ── Build supporting text files ─────────────────────────────
  const totalIncome  = (closesRes.data ?? []).reduce((s, c) => s + Number(c.total_income),  0);
  const totalExpense = (closesRes.data ?? []).reduce((s, c) => s + Number(c.total_expense), 0);

  const readmeTxt = `AMANAH GOVERNANCE PLATFORM — AUDIT PACKAGE
Generated: ${now.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
Organisation: ${org?.name}

FILES IN THIS PACKAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. audit-package.pdf
   Complete audit-ready document with all sections:
   - Organisation profile
   - Committee members
   - Financial summary
   - Fund accounting records
   - Programme activity
   - Progress reports
   - Governance policies
   - Trust events log
   - Certification history
   - Declaration pages (for signing)

2. financial-summary.json
   Machine-readable financial data for all closed periods.

3. trust-events.json
   Chronological log of governance trust events.

4. organisation-profile.txt
   Plain text organisation profile for quick reference.

5. README.txt
   This file.

USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Open audit-package.pdf in any PDF reader.
- Print and sign the Declaration page (Section 10).
- Submit to your auditor, regulator, or grant body.
- The JSON files can be imported by accounting software.

GENERATED BY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Amanah Governance Platform (amanahgp.com)
Trusted Giving. Transparent Governance.
`;

  const financialJson = JSON.stringify({
    generated_at:  now.toISOString(),
    organization:  org?.name,
    period:        `${dateStr}`,
    total_income:  totalIncome,
    total_expense: totalExpense,
    net_movement:  totalIncome - totalExpense,
    periods:       closesRes.data ?? [],
  }, null, 2);

  const eventsJson = JSON.stringify({
    generated_at:  now.toISOString(),
    organization:  org?.name,
    trust_events:  eventsRes.data ?? [],
  }, null, 2);

  const profileTxt = [
    'ORGANISATION PROFILE',
    '═'.repeat(40),
    `Name:               ${org?.name ?? '—'}`,
    `Legal name:         ${(org?.legal_name as string) ?? org?.name ?? '—'}`,
    `Registration no.:   ${(org?.registration_no as string) ?? '—'}`,
    `Type:               ${(org?.org_type as string)?.replace(/_/g, ' ') ?? '—'}`,
    `State:              ${(org?.state as string) ?? '—'}`,
    `Oversight:          ${(org?.oversight_authority as string) ?? '—'}`,
    `Fund types:         ${((org?.fund_types as string[]) ?? []).join(', ') || '—'}`,
    `Contact:            ${(org?.contact_email as string) ?? '—'}`,
    `Phone:              ${(org?.contact_phone as string) ?? '—'}`,
    `Website:            ${(org?.website_url as string) ?? '—'}`,
    `Address:            ${(org?.address_text as string) ?? '—'}`,
    '',
    'MISSION',
    '─'.repeat(40),
    (org?.summary as string) ?? '—',
  ].join('\n');

  // ── Create ZIP ──────────────────────────────────────────────
  const files = [
    { name: 'audit-package.pdf',      content: pdfBuffer },
    { name: 'financial-summary.json', content: financialJson },
    { name: 'trust-events.json',      content: eventsJson },
    { name: 'organisation-profile.txt', content: profileTxt },
    { name: 'README.txt',             content: readmeTxt },
  ];

  let zipBuffer: Buffer;
  let contentType: string;
  let fileExt: string;

  try {
    zipBuffer   = await createZipBuffer(files);
    contentType = 'application/zip';
    fileExt     = 'zip';
  } catch {
    // Final fallback — just return the PDF
    zipBuffer   = pdfBuffer;
    contentType = 'application/pdf';
    fileExt     = 'pdf';
  }

  const filename = `amanah-audit-package-${orgSlug}-${dateStr}.${fileExt}`;

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(zipBuffer.length),
      'Cache-Control':       'no-store',
    },
  });
}
