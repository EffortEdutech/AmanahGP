param(
  [Parameter(Mandatory=$true)][string]$Workspace
)

$ErrorActionPreference = "Stop"

$OutputDir = Join-Path $Workspace "output"
$PreviewDir = Join-Path $Workspace "preview"
New-Item -ItemType Directory -Force -Path $OutputDir, $PreviewDir | Out-Null

$msoTrue = -1
$msoFalse = 0
$msoShapeRectangle = 1
$msoSendToBack = 1
$ppLayoutText = 2
$ppSaveAsOpenXMLPresentation = 24
$ppSaveAsOpenXMLTemplate = 26

function RgbInt([int]$r, [int]$g, [int]$b) {
  return $r + ($g * 256) + ($b * 65536)
}

$Dark = RgbInt 14 27 24
$Panel = RgbInt 24 43 38
$Panel2 = RgbInt 32 52 47
$Paper = RgbInt 246 241 231
$Mist = RgbInt 200 213 207
$Dim = RgbInt 131 150 143
$Gold = RgbInt 216 168 78
$Sage = RgbInt 123 170 152
$Blue = RgbInt 70 106 122
$Clay = RgbInt 180 106 76
$Lime = RgbInt 166 185 109
$Accents = @($Gold, $Sage, $Blue, $Clay, $Lime)

function Add-Rect($shapes, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [bool]$line = $false) {
  $shape = $shapes.AddShape($msoShapeRectangle, $x, $y, $w, $h)
  $shape.Fill.Visible = $msoTrue
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Line.Visible = if ($line) { $msoTrue } else { $msoFalse }
  return $shape
}

function Add-ThemeShapes($container) {
  $bg = Add-Rect $container.Shapes 0 0 960 540 $Dark
  $bg.Name = "AGP Master Dark Background"
  $bg.ZOrder($msoSendToBack) | Out-Null
  $rule = Add-Rect $container.Shapes 0 0 960 4.5 $Gold
  $rule.Name = "AGP Master Gold Top Rule"
}

function Configure-Layout($layout) {
  Add-ThemeShapes $layout
  foreach ($shape in @($layout.Shapes)) {
    if ($shape.Type -eq 14 -or $shape.HasTextFrame) {
      try {
        if ($shape.PlaceholderFormat.Type -eq 1) {
          $shape.Left = 48
          $shape.Top = 72
          $shape.Width = 720
          $shape.Height = 96
          $shape.TextFrame.TextRange.Font.Name = "Georgia"
          $shape.TextFrame.TextRange.Font.Size = 30
          $shape.TextFrame.TextRange.Font.Color.RGB = $Paper
        } elseif ($shape.PlaceholderFormat.Type -eq 2) {
          $shape.Left = 50
          $shape.Top = 178
          $shape.Width = 690
          $shape.Height = 58
          $shape.TextFrame.TextRange.Font.Name = "Aptos"
          $shape.TextFrame.TextRange.Font.Size = 13
          $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        }
      } catch {}
    }
  }
}

function StyleTitle($slide, [int]$size = 30) {
  $t = $slide.Shapes.Title
  $t.Left = 48
  $t.Top = 72
  $t.Width = 760
  $t.Height = 112
  $t.TextFrame.TextRange.Font.Name = "Georgia"
  $t.TextFrame.TextRange.Font.Size = $size
  $t.TextFrame.TextRange.Font.Color.RGB = $Paper
  $t.TextFrame.TextRange.Font.Bold = $msoFalse
}

function BodyPlaceholder($slide, [string]$body) {
  $bodyShape = $null
  foreach ($shape in @($slide.Shapes.Placeholders)) {
    try {
      if ($shape.PlaceholderFormat.Type -ne 1) { $bodyShape = $shape; break }
    } catch {}
  }
  if ($null -eq $bodyShape) { return }
  $bodyShape.Left = 50
  $bodyShape.Top = 180
  $bodyShape.Width = 600
  $bodyShape.Height = 74
  $bodyShape.TextFrame.TextRange.Text = $body
  $bodyShape.TextFrame.TextRange.Font.Name = "Aptos"
  $bodyShape.TextFrame.TextRange.Font.Size = 12
  $bodyShape.TextFrame.TextRange.Font.Color.RGB = $Mist
}

function AddText($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [int]$color, [double]$size, [bool]$bold = $false, [string]$font = "Aptos") {
  $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
  $shape.TextFrame.MarginLeft = 1
  $shape.TextFrame.MarginRight = 1
  $shape.TextFrame.MarginTop = 1
  $shape.TextFrame.MarginBottom = 1
  $shape.TextFrame.TextRange.Text = $text
  $shape.TextFrame.TextRange.Font.Name = $font
  $shape.TextFrame.TextRange.Font.Size = $size
  $shape.TextFrame.TextRange.Font.Color.RGB = $color
  $shape.TextFrame.TextRange.Font.Bold = if ($bold) { $msoTrue } else { $msoFalse }
  return $shape
}

function AddKicker($slide, [string]$text) {
  Add-Rect $slide.Shapes 48 39 7 16 $Gold | Out-Null
  AddText $slide $text 64 34 440 20 $Gold 9 $true | Out-Null
}

function AddFooter($slide, [string]$source, [int]$n) {
  AddText $slide $source 48 506 680 14 $Dim 7 | Out-Null
  $num = AddText $slide ($n.ToString("00")) 850 502 60 18 $Gold 9 $true
  $num.TextFrame.TextRange.ParagraphFormat.Alignment = 3
}

function AddCard($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [string]$heading, [string]$body, [bool]$lightText = $false) {
  Add-Rect $slide.Shapes $x $y $w $h $fill | Out-Null
  $headColor = if ($lightText) { $Paper } else { $Dark }
  $bodyColor = if ($lightText) { $Mist } else { RgbInt 38 59 53 }
  $bodyHeight = [Math]::Max(12, $h - 60)
  AddText $slide $heading ($x + 16) ($y + 18) ($w - 34) 20 $headColor 11 $true | Out-Null
  AddText $slide $body ($x + 16) ($y + 48) ($w - 36) $bodyHeight $bodyColor 8 | Out-Null
}

function AddRows($slide, $rows, [double]$yStart = 262) {
  for ($i = 0; $i -lt $rows.Count; $i++) {
    $y = $yStart + ($i * 43)
    Add-Rect $slide.Shapes 64 $y 180 28 $Panel2 $true | Out-Null
    Add-Rect $slide.Shapes 64 $y 7 28 $Accents[$i % $Accents.Count] | Out-Null
    AddText $slide $rows[$i][0] 82 ($y + 8) 132 12 $Paper 8 $true | Out-Null
    AddText $slide $rows[$i][1] 282 ($y + 6) 530 14 $Mist 9 | Out-Null
  }
}

function AddSlideBase($pres, [int]$index, [string]$kicker, [string]$title, [string]$body, [string]$source, [int]$titleSize = 30) {
  $slide = $pres.Slides.Add($index, $ppLayoutText)
  AddKicker $slide "AMANAH GOVERNANCE PLATFORM"
  $slide.Shapes.Title.TextFrame.TextRange.Text = $kicker
  StyleTitle $slide $titleSize
  $bodyText = $title
  if ($body.Trim().Length -gt 0) { $bodyText = $title + "`r" + $body }
  BodyPlaceholder $slide $bodyText
  AddFooter $slide $source $index
  return $slide
}

function Build-Deck($ppt, [string]$templatePath, [string]$deckPath) {
  $pres = $ppt.Presentations.Add($msoTrue)
  $pres.PageSetup.SlideWidth = 960
  $pres.PageSetup.SlideHeight = 540
  $master = $pres.SlideMaster
  $master.Name = "AGP Dark Placeholder Master"
  Add-ThemeShapes $master
  foreach ($layout in @($master.CustomLayouts)) { Configure-Layout $layout }

  $s = AddSlideBase $pres 1 "AGP STAKEHOLDER BENEFITS BRIEF" "A shared governance platform that helps charities earn trust without carrying the technology cost." "AGP gives charity organizations free sponsored access to governance tools, gives governing bodies structured oversight, and gives donors confidence that funds are handled with Amanah." "Prepared for State Islamic Affairs, JAKIM, zakat bodies, charity leaders, donors and sponsors" 28
  AddCard $s 664 132 204 58 $Gold "Charities" "free governance workspace"
  AddCard $s 664 222 204 58 $Sage "Governing bodies" "visibility without manual chaos"
  AddCard $s 664 312 204 58 $Blue "Donors" "confidence before giving" $true

  $s = AddSlideBase $pres 2 "WHY THIS MATTERS" "The charity sector is generous, but governance capacity has not kept pace with donor expectations." "Small and medium charities often depend on volunteers, scattered documents and inconsistent reporting. The issue is not sincerity; it is the need for affordable infrastructure." "Source: docs/pitch and AGP architecture map" 27
  AddRows $s @(
    @("Charities", "limited admin staff, document burden, audit readiness pressure"),
    @("Authorities", "growing number of organizations, heavy manual monitoring"),
    @("Donors", "need clear proof before giving, not only campaign claims"),
    @("Beneficiaries", "depend on organizations that can sustain good governance")
  ) 286

  $s = AddSlideBase $pres 3 "BENEFIT TO CHARITY ORGANIZATIONS" "AGP helps charities become more trusted without asking them to buy expensive governance software." "" "Source: apps/org modules, docs/ARCHITECTURE_MAP.md" 27
  AddCard $s 78 260 168 142 $Gold "Free sponsored access" "Core platform access is funded through grants, infaq/sadaqah and sponsors."
  AddCard $s 282 260 168 142 $Sage "Governance workflow" "amanahOS guides reports, policies, evidence uploads and certification readiness."
  AddCard $s 486 260 168 142 $Blue "Audit readiness" "Documents and evidence are kept in one private-by-default workspace." $true
  AddCard $s 690 260 168 142 $Clay "Trust profile" "Verified reports, Amanah Index and certification status become public signals." $true
  AddText $s "Core promise" 78 440 85 14 $Gold 8 $true | Out-Null
  AddText $s "Proper governance becomes easier to do, easier to evidence and easier to explain to donors." 174 440 610 14 $Paper 9 $true | Out-Null

  $s = AddSlideBase $pres 4 "BENEFIT TO GOVERNING BODIES" "State Islamic Affairs, JAKIM and related bodies gain oversight capacity without building a new system from zero." "" "Source: docs/pitch Zakat narrative, AGP Console review modules" 26
  AddRows $s @(
    @("Ecosystem visibility", "structured view of participating charities, governance maturity and trust status"),
    @("Standard reporting", "common templates reduce inconsistent submissions and manual document chasing"),
    @("Due diligence support", "review queues, evidence records and certification history improve partner screening"),
    @("Policy alignment", "CTCF can be aligned with state/JAKIM expectations before wider rollout"),
    @("Public trust", "visible governance infrastructure strengthens confidence in Islamic social finance")
  ) 244

  $s = AddSlideBase $pres 5 "BENEFIT TO DONORS" "Donors get clearer confidence signals before giving, while funds still flow directly to the charity." "" "Source: /how-it-works, ADR-003, ADR-004" 27
  $flow = @(@("Discover","find verified organizations"), @("Evaluate","read reports, scores and notes"), @("Donate","ToyyibPay direct to charity"), @("Track","receipt, history and impact"))
  for ($i=0; $i -lt $flow.Count; $i++) {
    $x = 96 + ($i * 204)
    AddCard $s $x 294 146 82 $Accents[$i] $flow[$i][0] $flow[$i][1] ($i -ge 2)
    if ($i -lt $flow.Count - 1) { Add-Rect $s.Shapes ($x + 156) 330 34 2 $Clay | Out-Null }
  }
  AddText $s "Non-custodial principle" 98 426 140 14 $Gold 8 $true | Out-Null
  AddText $s "AGP does not hold donor funds. The platform records, verifies and reports; payment goes to the organization account." 250 426 570 14 $Paper 8 $true | Out-Null

  $s = AddSlideBase $pres 6 "WHY CHARITIES NEED GOVERNANCE" "Proper governance protects the donor, the organization, the regulator and the beneficiary." "" "Source: /about theological foundation and CTCF criteria" 28
  AddCard $s 92 264 330 62 $Gold "Spiritual trust" "Charity managers are trustees of donor funds; amanah has consequences."
  AddCard $s 536 264 330 62 $Sage "Operational continuity" "Clear policies, roles and records reduce dependence on one person."
  AddCard $s 92 362 330 62 $Blue "Financial discipline" "Fund separation and reporting reduce misuse, confusion and audit risk." $true
  AddCard $s 536 362 330 62 $Clay "Public confidence" "Good governance turns sincerity into evidence that the public can understand." $true

  $s = AddSlideBase $pres 7 "THREE PILLARS OF AMANAH" "AGP is designed around Amanah, Shafafiyyah and Mas'uliyyah." "" "Source: /about - Our principles" 29
  AddCard $s 86 266 188 142 $Gold "Amanah - Trust" "Trusteeship of donor funds is made visible, reviewable and verifiable."
  AddCard $s 386 266 188 142 $Sage "Shafafiyyah - Transparency" "Financial, project, impact and Shariah compliance evidence becomes accessible."
  AddCard $s 686 266 188 142 $Blue "Mas'uliyyah - Accountability" "Actions, reports, decisions and scores are logged and preserved." $true
  $s = AddSlideBase $pres 8 "PLATFORM MODEL" "One sponsored infrastructure layer serves charities, governing bodies and donors through different surfaces." "" "Source: docs/ARCHITECTURE_MAP.md" 27
  AddCard $s 110 286 190 88 $Gold "amanahOS" "free sponsored governance workspace for charities"
  AddCard $s 386 286 190 88 $Sage "AGP Console" "review, certification and public-readiness layer"
  AddCard $s 662 286 190 88 $Blue "AmanahHub" "public trust profile and donor journey" $true
  $core = Add-Rect $s.Shapes 156 432 650 44 $Panel2 $true
  AddText $s "@agp/scoring + Supabase evidence layer" 178 446 330 12 $Paper 9 $true | Out-Null
  AddText $s "CTCF, Amanah Index, RLS-protected evidence storage, audit logs, trust events and score history." 178 464 560 10 $Mist 7 | Out-Null

  $s = AddSlideBase $pres 9 "COST AND FUNDING MODEL" "The platform is free for charities because the cost is carried by grants, sponsors and institutional partners." "" "Source: docs/pitch/AGP_full.md and sustainability model" 27
  AddRows $s @(
    @("Grants", "government innovation, Islamic social finance and digital infrastructure grants"),
    @("Corporate sponsors", "CSR partners sponsor onboarding, training and platform access"),
    @("Infaq / sadaqah sponsors", "community sponsorship supports public-good access for smaller organizations"),
    @("Institutional partnerships", "zakat bodies, councils and foundations fund ecosystem rollout")
  ) 270
  AddText $s "Guardrail" 82 460 70 12 $Gold 8 $true | Out-Null
  AddText $s "Donor funds are not held by AGP; platform sustainability is funded as infrastructure." 166 460 620 12 $Paper 8 $true | Out-Null

  $s = AddSlideBase $pres 10 "WHY GOVERNING BODIES SHOULD SUPPORT" "Supporting AGP is a preventive governance investment, not simply a software purchase." "" "Source: docs/pitch Zakat and grant narratives" 28
  AddRows $s @(
    @("Reduce future risk", "better records reduce mismanagement, complaints and emergency interventions"),
    @("Uplift smaller charities", "support reaches organizations that cannot afford consultants or custom systems"),
    @("Standardize evidence", "common governance evidence makes review and comparison more consistent"),
    @("Strengthen Islamic social finance", "visible Amanah, transparency and accountability protect public trust"),
    @("Scale without duplication", "one shared platform avoids every state or charity rebuilding similar tools")
  ) 250

  $s = AddSlideBase $pres 11 "PILOT COLLABORATION" "A low-risk pilot can prove governance adoption before wider rollout." "" "Source: docs/pitch pilot programme and architecture map" 30
  AddCard $s 82 300 168 132 $Gold "1  Select cohort" "charities, mosques, waqf bodies or NGOs across representative categories"
  AddCard $s 296 300 168 132 $Sage "2  Sponsor access" "grant or CSR sponsors cover platform, onboarding and training costs"
  AddCard $s 510 300 168 132 $Blue "3  Align framework" "governing bodies validate CTCF evidence and publication rules" $true
  AddCard $s 724 300 168 132 $Clay "4  Measure outcomes" "reports completed, evidence uploaded, scores improved and donor readability" $true

  $s = AddSlideBase $pres 12 "OUTCOMES TO MEASURE" "Success should be measured by governance improvement, not vanity usage." "" "Source: docs/pitch monitoring and evaluation framework" 30
  AddRows $s @(
    @("Charity capability", "reports submitted, policies adopted, evidence completeness, audit readiness"),
    @("Oversight efficiency", "less manual chasing, clearer queues, faster review cycles"),
    @("Donor confidence", "profile readability, receipt trust, repeat giving intent"),
    @("Sponsor impact", "organizations subsidized, training completed, public-good value created")
  ) 292

  $s = AddSlideBase $pres 13 "THE ASK" "Help AGP become shared, sponsored governance infrastructure for trusted giving." "" "Prepared for discussion" 31
  AddCard $s 82 302 330 58 $Gold "Governing bodies" "endorse pilot guardrails, align evidence standards and nominate reviewers"
  AddCard $s 506 302 330 58 $Sage "Charity organizations" "join pilot cohort and use AGP for real governance workflows"
  AddCard $s 82 392 330 58 $Blue "Corporate sponsors" "fund access, onboarding, training and support for selected organizations" $true
  AddCard $s 506 392 330 58 $Clay "Donors / community" "support the infaq/sadaqah sponsorship pool and give through verified profiles" $true

  $pres.SaveAs($deckPath, $ppSaveAsOpenXMLPresentation)
  $pres.SaveAs($templatePath, $ppSaveAsOpenXMLTemplate)
  return $pres
}

$templatePath = Join-Path $OutputDir "AGP-Dark-Placeholder-Master-Template.potx"
$deckPath = Join-Path $OutputDir "agp-benefits-stakeholder-brief-placeholder-master.pptx"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
try {
  $pres = Build-Deck $ppt $templatePath $deckPath
  $pres.Export($PreviewDir, "PNG", 960, 540)
  $slideCount = $pres.Slides.Count
  $titleChecks = @()
  foreach ($slide in @($pres.Slides)) {
    $titleChecks += [pscustomobject]@{
      slide = $slide.SlideIndex
      title = $slide.Shapes.Title.TextFrame.TextRange.Text
    }
  }
  $pres.Close()
  [pscustomobject]@{
    deck = $deckPath
    template = $templatePath
    slides = $slideCount
    titlePlaceholders = $titleChecks.Count
    deckBytes = (Get-Item -LiteralPath $deckPath).Length
    templateBytes = (Get-Item -LiteralPath $templatePath).Length
  } | ConvertTo-Json -Depth 4
} finally {
  $ppt.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
