param(
  [Parameter(Mandatory=$true)][string]$SourceDeck,
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
$ppSaveAsOpenXMLPresentation = 24

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
$Rule = RgbInt 79 102 94

function Add-Rect($shapes, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [bool]$line = $false) {
  $shape = $shapes.AddShape($msoShapeRectangle, $x, $y, $w, $h)
  $shape.Fill.Visible = $msoTrue
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Line.Visible = if ($line) { $msoTrue } else { $msoFalse }
  if ($line) { $shape.Line.ForeColor.RGB = $Rule }
  return $shape
}

function AddText($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [int]$color, [double]$size, [bool]$bold = $false, [string]$font = "Aptos", [int]$align = 1) {
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
  $shape.TextFrame.TextRange.ParagraphFormat.Alignment = $align
  $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
  return $shape
}

function Clear-NonPlaceholders($slide) {
  for ($i = $slide.Shapes.Count; $i -ge 1; $i--) {
    $shape = $slide.Shapes.Item($i)
    if ($shape.Type -ne 14) {
      try { $shape.Delete() } catch {}
    }
  }
}

function StylePlaceholders($slide) {
  $title = $slide.Shapes.Title
  $title.Left = 48
  $title.Top = 62
  $title.Width = 820
  $title.Height = 52
  $title.TextFrame.TextRange.Text = "PETA PERJALANAN AGP"
  $title.TextFrame.TextRange.Font.Name = "Georgia"
  $title.TextFrame.TextRange.Font.Size = 29
  $title.TextFrame.TextRange.Font.Color.RGB = $Paper
  $title.TextFrame.TextRange.Font.Bold = $msoFalse

  foreach ($shape in @($slide.Shapes.Placeholders)) {
    try {
      if ($shape.PlaceholderFormat.Type -ne 1) {
        $shape.Left = 50
        $shape.Top = 120
        $shape.Width = 760
        $shape.Height = 38
        $shape.TextFrame.TextRange.Text = "Satu platform, empat perjalanan: penderma memberi dengan yakin, organisasi membina tadbir urus, governing body menyemak bukti, dan pasukan platform memantau operasi serta sokongan."
        $shape.TextFrame.TextRange.Font.Name = "Aptos"
        $shape.TextFrame.TextRange.Font.Size = 9.5
        $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
        break
      }
    } catch {}
  }
}

function AddKicker($slide) {
  Add-Rect $slide.Shapes 48 39 7 16 $Gold | Out-Null
  AddText $slide "AMANAH GOVERNANCE PLATFORM" 64 34 440 14 $Gold 8.5 $true | Out-Null
}

function AddFooter($slide) {
  AddText $slide "Sumber: /how-it-works, docs/ARCHITECTURE_MAP.md, amanahOS dan AGP Console modules" 48 506 700 12 $Dim 6.6 | Out-Null
  $num = AddText $slide "05" 850 502 60 14 $Gold 8.5 $true
  $num.TextFrame.TextRange.ParagraphFormat.Alignment = 3
}

function AddChip($slide, [double]$x, [double]$y, [double]$w, [string]$label, [int]$fill, [bool]$light = $false) {
  Add-Rect $slide.Shapes $x $y $w 17 $fill $false | Out-Null
  $color = if ($light) { $Paper } else { $Dark }
  AddText $slide $label ($x + 6) ($y + 4) ($w - 12) 8 $color 5.9 $true | Out-Null
}

function AddStep($slide, [double]$x, [double]$y, [double]$w, [string]$title, [string]$body, [int]$fill, [bool]$light = $false) {
  Add-Rect $slide.Shapes $x $y $w 42 $fill $false | Out-Null
  $head = if ($light) { $Paper } else { $Dark }
  $copy = if ($light) { $Mist } else { RgbInt 36 55 50 }
  AddText $slide $title ($x + 8) ($y + 8) ($w - 16) 9 $head 6.8 $true | Out-Null
  AddText $slide $body ($x + 8) ($y + 22) ($w - 16) 12 $copy 5.8 | Out-Null
}

function AddJourneyLane($slide, [double]$y, [int]$accent, [string]$actor, [string]$goal, [string[]]$apps, [object[]]$steps, [string]$result, [bool]$lightAccent = $false) {
  Add-Rect $slide.Shapes 48 $y 864 70 $Panel $true | Out-Null
  Add-Rect $slide.Shapes 48 $y 7 70 $accent | Out-Null
  AddText $slide $actor 66 ($y + 10) 122 13 $Paper 8.4 $true | Out-Null
  AddText $slide $goal 66 ($y + 27) 140 23 $Mist 6.3 | Out-Null

  $chipX = 210
  foreach ($app in $apps) {
    AddChip $slide $chipX ($y + 11) 78 $app $accent $lightAccent
    $chipX += 84
  }

  $stepX = 210
  foreach ($step in $steps) {
    AddStep $slide $stepX ($y + 33) 128 $step.Title $step.Body $step.Fill $step.Light
    $stepX += 138
  }

  Add-Rect $slide.Shapes 776 ($y + 12) 112 46 $Panel2 $true | Out-Null
  AddText $slide "HASIL" 790 ($y + 20) 78 8 $Gold 5.5 $true | Out-Null
  AddText $slide $result 790 ($y + 33) 88 16 $Paper 6.1 $true | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
try {
  $outDeck = Join-Path $OutputDir "agp-platform-stakeholder-briefing-melayu-journey-map-updated.pptx"
  Copy-Item -LiteralPath $SourceDeck -Destination $outDeck -Force

  $pres = $ppt.Presentations.Open($outDeck, $false, $false, $false)
  $slide = $pres.Slides.Item(5)
  Clear-NonPlaceholders $slide
  StylePlaceholders $slide
  AddKicker $slide

  AddText $slide "Apps terlibat sepanjang perjalanan" 50 164 250 12 $Gold 7.2 $true | Out-Null

  AddJourneyLane $slide 186 $Blue "PERJALANAN PENDERMA" "Cari organisasi, semak bukti, beri sumbangan dan ikuti kesan." @("AmanahHub", "ToyyibPay") @(
    [pscustomobject]@{ Title = "Teroka"; Body = "direktori, negeri, jenis dana"; Fill = $Gold; Light = $false },
    [pscustomobject]@{ Title = "Nilai"; Body = "laporan, skor, profil amanah"; Fill = $Sage; Light = $false },
    [pscustomobject]@{ Title = "Sumbang"; Body = "bayaran terus ke charity"; Fill = $Blue; Light = $true },
    [pscustomobject]@{ Title = "Ikuti"; Body = "resit, sejarah, impak"; Fill = $Lime; Light = $false }
  ) "yakin sebelum dan selepas memberi" $true

  AddJourneyLane $slide 260 $Gold "PERJALANAN ORGANISASI" "Guna tools percuma AGP untuk naik tahap tadbir urus." @("amanahOS") @(
    [pscustomobject]@{ Title = "Onboard"; Body = "profil, ahli, peranan"; Fill = $Gold; Light = $false },
    [pscustomobject]@{ Title = "Bina bukti"; Body = "polisi, laporan, fund records"; Fill = $Sage; Light = $false },
    [pscustomobject]@{ Title = "Mohon semakan"; Body = "CTCF, dokumen, evidence"; Fill = $Blue; Light = $true },
    [pscustomobject]@{ Title = "Tingkat skor"; Body = "Amanah Index dan gap action"; Fill = $Lime; Light = $false }
  ) "capai trust level lebih tinggi" $false

  AddJourneyLane $slide 334 $Sage "PERJALANAN GOVERNING BODY" "Semak organisasi dengan bukti standard dan jejak keputusan." @("AGP Console") @(
    [pscustomobject]@{ Title = "Saring"; Body = "cohort, status, risiko"; Fill = $Gold; Light = $false },
    [pscustomobject]@{ Title = "Review"; Body = "bukti, laporan, CTCF"; Fill = $Sage; Light = $false },
    [pscustomobject]@{ Title = "Putuskan"; Body = "certification, publication"; Fill = $Blue; Light = $true },
    [pscustomobject]@{ Title = "Pantau"; Body = "trend, escalations, history"; Fill = $Lime; Light = $false }
  ) "oversight lebih tersusun" $false

  AddJourneyLane $slide 408 $Clay "PENGURUSAN & PEMANTAU PLATFORM" "Pastikan operasi, sokongan dan integriti platform berjalan." @("AGP Console", "Admin") @(
    [pscustomobject]@{ Title = "Tetapkan akses"; Body = "sponsor, grant, cohort"; Fill = $Gold; Light = $false },
    [pscustomobject]@{ Title = "Sokong"; Body = "training, onboarding, bantuan"; Fill = $Sage; Light = $false },
    [pscustomobject]@{ Title = "Pantau"; Body = "audit log, trust events, SLA"; Fill = $Blue; Light = $true },
    [pscustomobject]@{ Title = "Lapor"; Body = "impact sponsor, readiness"; Fill = $Lime; Light = $false }
  ) "tools kekal percuma dan terkawal" $true

  AddFooter $slide
  $pres.SaveAs($outDeck, $ppSaveAsOpenXMLPresentation)
  $pres.Export($PreviewDir, "PNG", 1440, 810)
  $pres.Close()

  [pscustomobject]@{
    deck = $outDeck
    preview = (Join-Path $PreviewDir "Slide5.PNG")
    bytes = (Get-Item -LiteralPath $outDeck).Length
  } | ConvertTo-Json -Depth 3
} finally {
  try { $ppt.Quit() } catch {}
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
