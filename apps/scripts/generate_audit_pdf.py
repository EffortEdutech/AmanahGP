#!/usr/bin/env python3
"""
scripts/generate_audit_pdf.py
Sprint 29 — Amanah Audit Package Generator

Reads org data from stdin as JSON, generates a professional audit-ready PDF.
Usage: echo '{"org": {...}, ...}' | python3 generate_audit_pdf.py output.pdf

Called by the Next.js API route /api/audit-package via child_process.spawn.
"""

import sys
import json
from datetime import datetime
from io import BytesIO
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


# ── Colour palette ──────────────────────────────────────────
EMERALD  = colors.HexColor('#059669')
EMERALD_L= colors.HexColor('#d1fae5')
EMERALD_D= colors.HexColor('#064e3b')
AMBER    = colors.HexColor('#d97706')
AMBER_L  = colors.HexColor('#fef3c7')
RED      = colors.HexColor('#dc2626')
GRAY_700 = colors.HexColor('#374151')
GRAY_500 = colors.HexColor('#6b7280')
GRAY_200 = colors.HexColor('#e5e7eb')
GRAY_50  = colors.HexColor('#f9fafb')
WHITE    = colors.white
BLACK    = colors.HexColor('#111827')


def build_styles():
    base = getSampleStyleSheet()
    styles = {}
    styles['title'] = ParagraphStyle(
        'title', fontSize=22, fontName='Helvetica-Bold',
        textColor=WHITE, spaceAfter=4, alignment=TA_LEFT)
    styles['subtitle'] = ParagraphStyle(
        'subtitle', fontSize=10, fontName='Helvetica',
        textColor=colors.HexColor('#a7f3d0'), spaceAfter=2)
    styles['h2'] = ParagraphStyle(
        'h2', fontSize=13, fontName='Helvetica-Bold',
        textColor=BLACK, spaceBefore=18, spaceAfter=6,
        borderPadding=(0, 0, 4, 0))
    styles['h3'] = ParagraphStyle(
        'h3', fontSize=10.5, fontName='Helvetica-Bold',
        textColor=GRAY_700, spaceBefore=12, spaceAfter=4)
    styles['body'] = ParagraphStyle(
        'body', fontSize=9.5, fontName='Helvetica',
        textColor=GRAY_700, leading=14, spaceAfter=6)
    styles['small'] = ParagraphStyle(
        'small', fontSize=8, fontName='Helvetica',
        textColor=GRAY_500, leading=12, spaceAfter=4)
    styles['label'] = ParagraphStyle(
        'label', fontSize=9, fontName='Helvetica-Bold',
        textColor=GRAY_500)
    styles['value'] = ParagraphStyle(
        'value', fontSize=9.5, fontName='Helvetica',
        textColor=BLACK)
    styles['center'] = ParagraphStyle(
        'center', fontSize=9, fontName='Helvetica',
        textColor=GRAY_500, alignment=TA_CENTER)
    styles['badge_green'] = ParagraphStyle(
        'badge_green', fontSize=8.5, fontName='Helvetica-Bold',
        textColor=EMERALD_D, backColor=EMERALD_L,
        borderRadius=4, borderPadding=3)
    return styles


def fmt_rm(val):
    try:
        n = float(val or 0)
        return f"RM {abs(n):,.2f}"
    except:
        return "RM 0.00"


def cap(s):
    return s.replace('_', ' ').title() if s else '—'


def kv_table(pairs, styles):
    """Two-column key-value table."""
    data = []
    for k, v in pairs:
        data.append([
            Paragraph(k, styles['label']),
            Paragraph(str(v) if v else '—', styles['value'])
        ])
    t = Table(data, colWidths=[6*cm, 11*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), GRAY_50),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, GRAY_50]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def data_table(headers, rows, styles, col_widths=None):
    """Multi-column data table."""
    header_row = [Paragraph(h, styles['label']) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c or '—'), styles['value']) for c in row])

    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), EMERALD_L),
        ('TEXTCOLOR', (0, 0), (-1, 0), EMERALD_D),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
        ('ROWBACKGROUNDS', (1, 0), (-1, -1), [WHITE, GRAY_50]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def section_header(title, styles):
    """Emerald section divider."""
    items = [
        HRFlowable(width='100%', thickness=1.5, color=EMERALD, spaceAfter=4),
        Paragraph(title, styles['h2']),
    ]
    return items


def generate_pdf(data: dict, output_path: str):
    org      = data.get('org', {})
    members  = data.get('members', [])
    closes   = data.get('closes', [])
    projects = data.get('projects', [])
    reports  = data.get('reports', [])
    policies = data.get('policies', [])
    certs    = data.get('certs', [])
    score    = data.get('score', {})
    events   = data.get('events', [])
    fund_types = org.get('fund_types', [])

    now      = datetime.now()
    date_str = now.strftime('%-d %B %Y')
    year_str = now.strftime('%Y')

    styles   = build_styles()
    doc      = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm,
        title=f"Audit Package — {org.get('name', 'Organisation')}",
        author='Amanah Governance Platform',
        subject='Audit-Ready Package',
    )

    story = []

    # ── Cover page ────────────────────────────────────────────
    # Emerald header block (drawn via a 1-row table for background colour)
    cover_data = [[
        Paragraph(
            f"<font color='#a7f3d0' size='9'>Amanah Governance Platform</font><br/>"
            f"<font color='white' size='18'><b>Audit-Ready Package</b></font><br/>"
            f"<font color='#a7f3d0' size='10'>{org.get('name', '')}</font><br/>"
            f"<font color='#d1fae5' size='9'>Generated: {date_str}</font>",
            styles['body']
        )
    ]]
    cover_tbl = Table(cover_data, colWidths=[17*cm])
    cover_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), EMERALD),
        ('TOPPADDING',    (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING',   (0, 0), (-1, -1), 20),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 20),
        ('ROUNDEDCORNERS', [8]),
    ]))
    story.append(cover_tbl)
    story.append(Spacer(1, 14))

    # Certification badge
    cert = certs[0] if certs else None
    if cert and cert.get('new_status') == 'certified':
        badge_data = [[Paragraph('★  CTCF Certified Organisation', styles['badge_green'])]]
        badge_tbl  = Table(badge_data)
        badge_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), EMERALD_L),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(badge_tbl)
        story.append(Spacer(1, 8))

    # Score
    if score.get('score_value'):
        story.append(Paragraph(
            f"Amanah Trust Score: <b>{float(score['score_value']):.1f}/100</b>  ·  "
            f"Version: {score.get('score_version', '—')}  ·  "
            f"Last updated: {score.get('computed_at', '—')[:10]}",
            styles['small']))
        story.append(Spacer(1, 8))

    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_200, spaceAfter=6))

    # Table of contents
    story.append(Paragraph('Contents', styles['h3']))
    toc_items = [
        '1.  Organisation Profile',
        '2.  Committee Members',
        '3.  Financial Summary',
        '4.  Fund Accounting Records',
        '5.  Programme Activity',
        '6.  Progress Reports',
        '7.  Governance Policies',
        '8.  Trust Events Log',
        '9.  Certification History',
        '10. Declaration',
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles['body']))
    story.append(PageBreak())

    # ── 1. Organisation Profile ───────────────────────────────
    story += section_header('1. Organisation Profile', styles)
    story.append(kv_table([
        ('Organisation name',     org.get('name')),
        ('Legal / registered name', org.get('legal_name') or org.get('name')),
        ('Registration number',   org.get('registration_no')),
        ('Organisation type',     cap(org.get('org_type', ''))),
        ('State',                 org.get('state')),
        ('Oversight authority',   org.get('oversight_authority')),
        ('Fund types',            ', '.join([cap(f) for f in fund_types]) or '—'),
        ('Contact email',         org.get('contact_email')),
        ('Contact phone',         org.get('contact_phone')),
        ('Website',               org.get('website_url')),
        ('Address',               org.get('address_text')),
    ], styles))
    if org.get('summary'):
        story.append(Spacer(1, 6))
        story.append(Paragraph('<b>Mission statement</b>', styles['h3']))
        story.append(Paragraph(org['summary'], styles['body']))
    story.append(Spacer(1, 12))

    # ── 2. Committee Members ──────────────────────────────────
    story += section_header('2. Committee Members', styles)
    if members:
        rows = [(m.get('name', '—'), m.get('email', '—'), cap(m.get('role', ''))) for m in members]
        story.append(data_table(['Name', 'Email', 'Role'], rows, styles,
                                col_widths=[6*cm, 7*cm, 4*cm]))
    else:
        story.append(Paragraph('No active members recorded.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 3. Financial Summary ──────────────────────────────────
    story += section_header('3. Financial Summary', styles)
    if closes:
        total_income  = sum(float(c.get('total_income',  0)) for c in closes)
        total_expense = sum(float(c.get('total_expense', 0)) for c in closes)
        net_total     = total_income - total_expense
        summary_data  = [
            ['Total income',      fmt_rm(total_income)],
            ['Total expenditure', fmt_rm(total_expense)],
            ['Net movement',      fmt_rm(net_total)],
        ]
        sum_tbl = Table(summary_data, colWidths=[9*cm, 8*cm])
        sum_tbl.setStyle(TableStyle([
            ('FONTNAME',  (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME',  (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE',  (0, 0), (-1, -1), 9.5),
            ('TEXTCOLOR', (1, 0), (1, 0), EMERALD),
            ('TEXTCOLOR', (1, 1), (1, 1), RED),
            ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#1d4ed8')),
            ('FONTNAME',  (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE',  (1, 0), (1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, GRAY_50, WHITE]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(sum_tbl)
        story.append(Spacer(1, 10))

        story.append(Paragraph('Monthly close records', styles['h3']))
        rows = []
        for c in closes[:12]:
            n = float(c.get('total_income', 0)) - float(c.get('total_expense', 0))
            rows.append([
                f"M{c.get('period_month')}/{c.get('period_year')}",
                fmt_rm(c.get('total_income', 0)),
                fmt_rm(c.get('total_expense', 0)),
                fmt_rm(n),
                str(c.get('closed_at', '—'))[:10],
            ])
        story.append(data_table(['Period', 'Income', 'Expenditure', 'Net', 'Closed'],
                                rows, styles,
                                col_widths=[3*cm, 4*cm, 4*cm, 3.5*cm, 3*cm]))
    else:
        story.append(Paragraph('No financial periods closed.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 4. Fund Accounting Records ────────────────────────────
    story += section_header('4. Fund Accounting Records', styles)
    story.append(Paragraph(
        'Fund accounting data is maintained in the Amanah fund accounting system with '
        'restricted fund segregation. Each fund type (Zakat, Waqf, Sadaqah, General) '
        'is tracked in a dedicated ledger with separate income, expense, and balance tracking.',
        styles['body']))
    fund_rows = [(cap(f), 'Dedicated ledger', 'Active') for f in fund_types]
    if fund_rows:
        story.append(data_table(['Fund type', 'Accounting method', 'Status'],
                                fund_rows, styles, col_widths=[5*cm, 8*cm, 4*cm]))
    story.append(PageBreak())

    # ── 5. Programme Activity ─────────────────────────────────
    story += section_header('5. Programme Activity', styles)
    if projects:
        rows = [
            (p.get('title', '—'), p.get('objective', '—'), cap(p.get('status', '')),
             fmt_rm(p.get('budget_amount', 0)) if p.get('budget_amount') else '—')
            for p in projects
        ]
        story.append(data_table(['Programme', 'Objective', 'Status', 'Budget'],
                                rows, styles,
                                col_widths=[5*cm, 7*cm, 3*cm, 3.5*cm]))
    else:
        story.append(Paragraph('No programmes recorded.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 6. Progress Reports ───────────────────────────────────
    story += section_header('6. Progress Reports', styles)
    if reports:
        rows = []
        for r in reports:
            rb = r.get('report_body', {})
            rows.append([
                r.get('title', '—'),
                r.get('report_date', '—'),
                cap(r.get('verification_status', '')),
                str(rb.get('beneficiaries_reached', '—')),
                fmt_rm(rb.get('spend_to_date', 0)) if rb.get('spend_to_date') else '—',
            ])
        story.append(data_table(['Report', 'Date', 'Status', 'Beneficiaries', 'Spend'],
                                rows, styles,
                                col_widths=[5*cm, 2.5*cm, 3*cm, 3*cm, 4*cm]))
    else:
        story.append(Paragraph('No progress reports submitted.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 7. Governance Policies ────────────────────────────────
    story += section_header('7. Governance Policies', styles)
    if policies:
        rows = [(p.get('label', '—'), p.get('document_type', '—'),
                 str(p.get('created_at', '—'))[:10]) for p in policies]
        story.append(data_table(['Policy', 'Type', 'Date uploaded'],
                                rows, styles,
                                col_widths=[8*cm, 5*cm, 4.5*cm]))
    else:
        story.append(Paragraph('No governance policies uploaded.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 8. Trust Events Log ───────────────────────────────────
    story += section_header('8. Trust Events Log', styles)
    story.append(Paragraph(
        'The following governance events are recorded on the Amanah platform. '
        'These events are auto-generated from operational activities — not self-reported.',
        styles['body']))
    if events:
        rows = [
            (e.get('event_type', '—'),
             cap(e.get('pillar', '')),
             f"+{e['score_delta']}" if float(e.get('score_delta', 0)) > 0 else str(e.get('score_delta', '')),
             str(e.get('occurred_at', '—'))[:10])
            for e in events
        ]
        story.append(data_table(['Event', 'Pillar', 'Score delta', 'Date'],
                                rows, styles,
                                col_widths=[6*cm, 4*cm, 3*cm, 4.5*cm]))
    else:
        story.append(Paragraph('No trust events recorded.', styles['body']))
    story.append(Spacer(1, 12))

    # ── 9. Certification History ──────────────────────────────
    story += section_header('9. Certification History', styles)
    if certs:
        rows = [(cap(c.get('new_status', '')), c.get('valid_from', '—'),
                 c.get('valid_to', 'Ongoing'), str(c.get('decided_at', '—'))[:10])
                for c in certs]
        story.append(data_table(['Status', 'Valid from', 'Valid to', 'Decided'],
                                rows, styles,
                                col_widths=[4*cm, 4*cm, 4*cm, 4.5*cm]))
    else:
        story.append(Paragraph('No certification history recorded.', styles['body']))
    story.append(PageBreak())

    # ── 10. Declaration ───────────────────────────────────────
    story += section_header('10. Declaration', styles)
    story.append(Paragraph(
        f'I, the undersigned, declare that the information contained in this Audit-Ready Package '
        f'for <b>{org.get("name", "")}</b> is accurate and complete to the best of my knowledge, '
        f'and that the organisation operates in compliance with its governing documents and '
        f'applicable Malaysian regulations.',
        styles['body']))
    story.append(Spacer(1, 24))

    # Signature blocks
    sig_data = [
        [Paragraph('Authorised Signatory', styles['label']),
         Paragraph('Finance Officer / Treasurer', styles['label'])],
        [Paragraph('Chairman / President', styles['small']),
         Paragraph('Finance Manager', styles['small'])],
        [Paragraph('Signature & Date: ___________________', styles['small']),
         Paragraph('Signature & Date: ___________________', styles['small'])],
    ]
    sig_tbl = Table(sig_data, colWidths=[8.5*cm, 8.5*cm])
    sig_tbl.setStyle(TableStyle([
        ('GRID', (0, 2), (-1, 2), 0.5, GRAY_200),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, 2), (-1, 2), 1, GRAY_700),
    ]))
    story.append(sig_tbl)
    story.append(Spacer(1, 24))

    # Official stamp
    stamp_data = [[Paragraph('Official stamp / Chop rasmi', styles['label'])]]
    stamp_tbl  = Table(stamp_data, colWidths=[6*cm])
    stamp_tbl.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, GRAY_200),
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_50),
        ('TOPPADDING', (0, 0), (-1, -1), 50),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 50),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(stamp_tbl)

    # Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_200, spaceAfter=6))
    story.append(Paragraph(
        f'Generated by Amanah Governance Platform · {date_str} · amanahgp.com · '
        f'This document is auto-generated from verified operational data.',
        styles['center']))

    doc.build(story)
    print(f"PDF generated: {output_path}", file=sys.stderr)


if __name__ == '__main__':
    output_path = sys.argv[1] if len(sys.argv) > 1 else 'audit-package.pdf'
    data = json.load(sys.stdin)
    generate_pdf(data, output_path)
    print('OK')
