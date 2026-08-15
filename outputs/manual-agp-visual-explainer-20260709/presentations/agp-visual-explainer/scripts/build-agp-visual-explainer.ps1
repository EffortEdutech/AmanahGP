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
$msoShapeRoundedRectangle = 5
$msoConnectorStraight = 1
$msoSendToBack = 1
$ppLayoutText = 2
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
$Line = RgbInt 92 112 105

function Add-Rect($shapes, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [bool]$line = $false, [int]$shapeType = $msoShapeRectangle) {
  $shape = $shapes.AddShape($shapeType, $x, $y, $w, $h)
  $shape.Fill.Visible = $msoTrue
  $shape.Fill.ForeColor.RGB = $fill
  $shape.Line.Visible = if ($line) { $msoTrue } else { $msoFalse }
  if ($line) { $shape.Line.ForeColor.RGB = $Line }
  return $shape
}

function AddText($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [int]$color, [double]$size, [bool]$bold = $false, [string]$font = "Aptos", [int]$align = 1) {
  $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
  $shape.TextFrame.MarginLeft = 2
  $shape.TextFrame.MarginRight = 2
  $shape.TextFrame.MarginTop = 1
  $shape.TextFrame.MarginBottom = 1
  $shape.TextFrame.TextRange.Text = $text
  $shape.TextFrame.TextRange.Font.Name = $font
  $shape.TextFrame.TextRange.Font.Size = $size
  $shape.TextFrame.TextRange.Font.Color.RGB = $color
  $shape.TextFrame.TextRange.Font.Bold = if ($bold) { $msoTrue } else { $msoFalse }
  $shape.TextFrame.TextRange.ParagraphFormat.Alignment = $align
  return $shape
}

function AddMaster($pres) {
  $master = $pres.SlideMaster
  $master.Name = "AGP Visual Explainer Dark Master"
  $bg = Add-Rect $master.Shapes 0 0 960 540 $Dark
  $bg.Name = "AGP Master Dark Background"
  $bg.ZOrder($msoSendToBack) | Out-Null
  $rule = Add-Rect $master.Shapes 0 0 960 4.5 $Gold
  $rule.Name = "AGP Master Gold Top Rule"
  foreach ($layout in @($master.CustomLayouts)) {
    foreach ($shape in @($layout.Shapes)) {
      try {
        if ($shape.PlaceholderFormat.Type -eq 1) {
          $shape.Left = 44
          $shape.Top = 38
          $shape.Width = 510
          $shape.Height = 54
          $shape.TextFrame.TextRange.Font.Name = "Georgia"
          $shape.TextFrame.TextRange.Font.Size = 24
          $shape.TextFrame.TextRange.Font.Color.RGB = $Paper
        } elseif ($shape.PlaceholderFormat.Type -ne 1) {
          $shape.Left = 46
          $shape.Top = 94
          $shape.Width = 555
          $shape.Height = 42
          $shape.TextFrame.TextRange.Font.Name = "Aptos"
          $shape.TextFrame.TextRange.Font.Size = 9.5
          $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        }
      } catch {}
    }
  }
}

function StylePlaceholders($slide) {
  $title = $slide.Shapes.Title
  $title.Left = 44
  $title.Top = 38
  $title.Width = 520
  $title.Height = 54
  $title.TextFrame.TextRange.Text = "Amanah Governance Platform (AGP)"
  $title.TextFrame.TextRange.Font.Name = "Georgia"
  $title.TextFrame.TextRange.Font.Size = 25
  $title.TextFrame.TextRange.Font.Color.RGB = $Paper
  $title.TextFrame.TextRange.Font.Bold = $msoFalse

  foreach ($shape in @($slide.Shapes.Placeholders)) {
    try {
      if ($shape.PlaceholderFormat.Type -ne 1) {
        $shape.Left = 46
        $shape.Top = 92
        $shape.Width = 575
        $shape.Height = 42
        $shape.TextFrame.TextRange.Text = "A shared trust infrastructure that helps charities govern properly, helps authorities review evidence, and helps donors give with confidence."
        $shape.TextFrame.TextRange.Font.Name = "Aptos"
        $shape.TextFrame.TextRange.Font.Size = 9.8
        $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
        break
      }
    } catch {}
  }
}

function AddArrow($slide, [double]$x1, [double]$y1, [double]$x2, [double]$y2, [int]$color, [double]$weight = 1.6) {
  $line = $slide.Shapes.AddConnector($msoConnectorStraight, $x1, $y1, $x2, $y2)
  $line.Line.ForeColor.RGB = $color
  $line.Line.Weight = $weight
  $line.Line.EndArrowheadStyle = 3
  return $line
}

function AddNode($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [string]$label, [string]$body, [bool]$lightText = $false) {
  Add-Rect $slide.Shapes $x $y $w $h $fill $false | Out-Null
  $head = if ($lightText) { $Paper } else { $Dark }
  $copy = if ($lightText) { $Mist } else { RgbInt 38 59 53 }
  AddText $slide $label ($x + 14) ($y + 14) ($w - 28) 18 $head 9.5 $true | Out-Null
  AddText $slide $body ($x + 14) ($y + 38) ($w - 28) ($h - 46) $copy 7.5 | Out-Null
}

function AddMini($slide, [double]$x, [double]$y, [string]$label, [int]$fill, [bool]$lightText = $false) {
  Add-Rect $slide.Shapes $x $y 118 26 $fill $false | Out-Null
  $color = if ($lightText) { $Paper } else { $Dark }
  AddText $slide $label ($x + 8) ($y + 7) 102 12 $color 7.3 $true | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
try {
  $pres = $ppt.Presentations.Add($msoTrue)
  $pres.PageSetup.SlideWidth = 960
  $pres.PageSetup.SlideHeight = 540
  AddMaster $pres

  $slide = $pres.Slides.Add(1, $ppLayoutText)
  StylePlaceholders $slide

  AddText $slide "ONE PLATFORM, FOUR STAKEHOLDER VIEWS" 46 143 330 16 $Gold 8.5 $true | Out-Null

  AddNode $slide 56 194 188 92 $Gold "Charity organizations" "Use amanahOS to manage policies, reports, evidence, fund records, impact updates and certification readiness."
  AddMini $slide 86 300 "amanahOS" $Gold

  AddNode $slide 366 172 228 136 $Panel2 "AGP trust engine" "Evidence vault, audit log, Trust Events, CTCF, Amanah Index and public-readiness rules convert governance work into verifiable trust signals." $true
  AddText $slide "verified evidence  ->  score history  ->  review trail" 393 282 174 12 $Gold 7.2 $true  | Out-Null

  AddNode $slide 698 152 194 82 $Sage "Governing bodies" "State Islamic Affairs, JAKIM, zakat/waqf bodies and reviewers use AGP Console to review, monitor and certify."
  AddMini $slide 736 246 "AGP Console" $Sage

  AddNode $slide 698 318 194 86 $Blue "Donors" "Use AmanahHub to discover verified organizations, read reports and give with confidence." $true
  AddMini $slide 736 416 "AmanahHub" $Blue $true

  AddNode $slide 56 356 188 76 $Clay "Sponsors + grants" "Fund platform access, onboarding and training so charities can use AGP without paying." $true

  AddArrow $slide 244 239 366 239 $Gold 1.7 | Out-Null
  AddArrow $slide 594 220 698 193 $Sage 1.7 | Out-Null
  AddArrow $slide 594 258 698 356 $Blue 1.7 | Out-Null
  AddArrow $slide 150 356 366 289 $Clay 1.7 | Out-Null
  AddArrow $slide 698 379 244 261 $Lime 1.4 | Out-Null
  AddText $slide "donation goes direct to charity (AGP does not hold donor funds)" 372 405 308 16 $Lime 7.4 $true | Out-Null

  Add-Rect $slide.Shapes 295 346 338 1.5 $Line | Out-Null
  AddText $slide "What AGP makes visible" 367 326 180 14 $Gold 8 $true  | Out-Null
  AddMini $slide 306 358 "Amanah - trust" $Gold
  AddMini $slide 422 358 "Shafafiyyah - transparency" $Sage
  AddMini $slide 538 358 "Mas'uliyyah - accountability" $Blue $true

  AddText $slide "Simple explanation: AGP is not a donation app only. It is the governance-and-trust layer behind trusted giving." 46 464 660 16 $Paper 8.5 $true | Out-Null
  AddText $slide "Source: AGP /about, /how-it-works, architecture map and stakeholder decks" 46 506 580 12 $Dim 6.8 | Out-Null
  AddText $slide "01" 872 502 40 14 $Gold 8.5 $true | Out-Null

  $pptx = Join-Path $OutputDir "agp-visual-explainer-one-slide.pptx"
  $pres.SaveAs($pptx, $ppSaveAsOpenXMLPresentation)
  $pres.Export($PreviewDir, "PNG", 1440, 810)
  $pres.Close()

  [pscustomobject]@{
    deck = $pptx
    preview = (Join-Path $PreviewDir "Slide1.PNG")
    bytes = (Get-Item -LiteralPath $pptx).Length
  } | ConvertTo-Json -Depth 3
} finally {
  try { $ppt.Quit() } catch {}
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
