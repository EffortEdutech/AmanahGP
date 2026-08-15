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

function RgbInt([int]$r, [int]$g, [int]$b) {
  return $r + ($g * 256) + ($b * 65536)
}

$Dark = RgbInt 14 27 24
$Panel = RgbInt 23 42 37
$Panel2 = RgbInt 31 53 47
$Paper = RgbInt 246 241 231
$Mist = RgbInt 202 214 208
$Dim = RgbInt 129 151 142
$Gold = RgbInt 216 168 78
$Sage = RgbInt 123 170 152
$Blue = RgbInt 70 106 122
$Clay = RgbInt 180 106 76
$Lime = RgbInt 166 185 109
$Rule = RgbInt 82 104 96

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

function ConfigureMaster($pres) {
  $master = $pres.SlideMaster
  $master.Name = "AGP Category Block Dark Master"
  $bg = Add-Rect $master.Shapes 0 0 960 540 $Dark
  $bg.Name = "AGP Master Dark Background"
  $bg.ZOrder($msoSendToBack) | Out-Null
  Add-Rect $master.Shapes 0 0 960 4.5 $Gold | Out-Null
  foreach ($layout in @($master.CustomLayouts)) {
    foreach ($shape in @($layout.Shapes)) {
      try {
        if ($shape.PlaceholderFormat.Type -eq 1) {
          $shape.Left = 44
          $shape.Top = 32
          $shape.Width = 690
          $shape.Height = 48
          $shape.TextFrame.TextRange.Font.Name = "Georgia"
          $shape.TextFrame.TextRange.Font.Size = 24
          $shape.TextFrame.TextRange.Font.Color.RGB = $Paper
        } elseif ($shape.PlaceholderFormat.Type -ne 1) {
          $shape.Left = 46
          $shape.Top = 82
          $shape.Width = 650
          $shape.Height = 36
          $shape.TextFrame.TextRange.Font.Name = "Aptos"
          $shape.TextFrame.TextRange.Font.Size = 9.5
          $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
          $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
        }
      } catch {}
    }
  }
}

function SetPlaceholders($slide) {
  $title = $slide.Shapes.Title
  $title.Left = 44
  $title.Top = 32
  $title.Width = 720
  $title.Height = 48
  $title.TextFrame.TextRange.Text = "AGP = governance infrastructure for trusted giving"
  $title.TextFrame.TextRange.Font.Name = "Georgia"
  $title.TextFrame.TextRange.Font.Size = 25
  $title.TextFrame.TextRange.Font.Color.RGB = $Paper
  $title.TextFrame.TextRange.Font.Bold = $msoFalse

  foreach ($shape in @($slide.Shapes.Placeholders)) {
    try {
      if ($shape.PlaceholderFormat.Type -ne 1) {
        $shape.Left = 46
        $shape.Top = 82
        $shape.Width = 685
        $shape.Height = 36
        $shape.TextFrame.TextRange.Text = "Not just a donation app: AGP connects charity governance work, oversight review, donor confidence and sponsored support for charities."
        $shape.TextFrame.TextRange.Font.Name = "Aptos"
        $shape.TextFrame.TextRange.Font.Size = 10.5
        $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
        break
      }
    } catch {}
  }
}

function AddBlock($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [string]$eyebrow, [string]$title, [string]$body, [bool]$light = $false) {
  Add-Rect $slide.Shapes $x $y $w $h $fill $false | Out-Null
  $head = if ($light) { $Paper } else { $Dark }
  $copy = if ($light) { $Mist } else { RgbInt 39 58 53 }
  AddText $slide $eyebrow ($x + 14) ($y + 12) ($w - 28) 12 $head 6.5 $true | Out-Null
  AddText $slide $title ($x + 14) ($y + 28) ($w - 28) 20 $head 10.5 $true | Out-Null
  AddText $slide $body ($x + 14) ($y + 56) ($w - 28) ($h - 64) $copy 7.1 | Out-Null
}

function AddSmallBlock($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$fill, [string]$title, [string]$body, [bool]$light = $false) {
  Add-Rect $slide.Shapes $x $y $w $h $fill $false | Out-Null
  $head = if ($light) { $Paper } else { $Dark }
  $copy = if ($light) { $Mist } else { RgbInt 39 58 53 }
  AddText $slide $title ($x + 12) ($y + 12) ($w - 24) 16 $head 8.5 $true | Out-Null
  AddText $slide $body ($x + 12) ($y + 34) ($w - 24) ($h - 42) $copy 6.7 | Out-Null
}

function AddLabel($slide, [string]$text, [double]$x, [double]$y, [double]$w) {
  AddText $slide $text $x $y $w 14 $Gold 7.4 $true | Out-Null
}

function AddChip($slide, [double]$x, [double]$y, [double]$w, [string]$label, [int]$fill, [bool]$light = $false) {
  Add-Rect $slide.Shapes $x $y $w 28 $fill $false | Out-Null
  $color = if ($light) { $Paper } else { $Dark }
  AddText $slide $label ($x + 10) ($y + 8) ($w - 20) 11 $color 7.5 $true | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
try {
  $pres = $ppt.Presentations.Add($msoTrue)
  $pres.PageSetup.SlideWidth = 960
  $pres.PageSetup.SlideHeight = 540
  ConfigureMaster $pres

  $slide = $pres.Slides.Add(1, $ppLayoutText)
  SetPlaceholders $slide

  Add-Rect $slide.Shapes 48 130 836 56 $Panel2 $true | Out-Null
  AddText $slide "Plain explanation" 66 145 118 14 $Gold 8 $true | Out-Null
  AddText $slide "AGP turns charity governance evidence into trust signals that authorities can review and donors can understand." 202 143 610 18 $Paper 11.5 $true | Out-Null
  AddText $slide "The tools, onboarding, support and training are funded separately from donor money so charities can use AGP for free." 202 164 620 12 $Mist 8 | Out-Null

  Add-Rect $slide.Shapes 48 214 402 108 $Gold $false | Out-Null
  AddText $slide "01  WHO IT SERVES" 68 232 190 12 $Dark 7.2 $true | Out-Null
  AddText $slide "One shared trust record, four stakeholder views." 68 252 320 15 $Dark 11 $true | Out-Null
  AddChip $slide 68 282 82 "Charities" $Dark $true
  AddChip $slide 160 282 88 "Authorities" $Sage
  AddChip $slide 258 282 72 "Donors" $Blue $true
  AddChip $slide 340 282 82 "Sponsors" $Clay $true

  Add-Rect $slide.Shapes 482 214 402 108 $Sage $false | Out-Null
  AddText $slide "02  PRODUCT SURFACES" 502 232 190 12 $Dark 7.2 $true | Out-Null
  AddText $slide "Each audience gets the right workspace." 502 252 300 15 $Dark 11 $true | Out-Null
  AddChip $slide 502 282 104 "amanahOS" $Gold
  AddChip $slide 618 282 118 "AGP Console" $Panel2 $true
  AddChip $slide 748 282 104 "AmanahHub" $Blue $true

  Add-Rect $slide.Shapes 48 350 402 112 $Panel2 $false | Out-Null
  AddText $slide "03  TRUST ENGINE" 68 368 190 12 $Gold 7.2 $true | Out-Null
  AddText $slide "Evidence becomes accountable trust." 68 388 300 15 $Paper 11 $true | Out-Null
  AddChip $slide 68 420 86 "Evidence" $Gold
  AddChip $slide 162 420 82 "Audit logs" $Sage
  AddChip $slide 252 420 74 "CTCF" $Blue $true
  AddChip $slide 334 420 88 "Amanah Index" $Lime

  Add-Rect $slide.Shapes 482 350 402 124 $Blue $false | Out-Null
  AddText $slide "04  MONEY PRINCIPLE" 502 368 190 12 $Paper 7.2 $true | Out-Null
  AddText $slide "Two money flows, kept separate." 502 388 316 15 $Paper 11 $true | Out-Null
  Add-Rect $slide.Shapes 502 414 164 48 $Lime $false | Out-Null
  AddText $slide "Donor -> Charity org" 514 424 134 12 $Dark 7.7 $true | Out-Null
  AddText $slide "direct giving; AGP never holds donor funds" 514 444 126 12 $Dark 6.5 | Out-Null
  Add-Rect $slide.Shapes 680 414 184 48 $Clay $false | Out-Null
  AddText $slide "Sponsors -> AGP support" 692 424 154 12 $Paper 7.7 $true | Out-Null
  AddText $slide "fund operations, tools, support and training for highest trust level" 692 444 154 13 $Paper 6.4 | Out-Null

  AddText $slide "Amanah = trust  |  Shafafiyyah = transparency  |  Mas'uliyyah = accountability" 48 496 760 13 $Paper 8.2 $true | Out-Null
  AddText $slide "Source: AGP /about, /how-it-works, architecture map and stakeholder briefing decks" 48 518 650 10 $Dim 6.5 | Out-Null
  AddText $slide "01" 872 516 40 12 $Gold 8.5 $true | Out-Null

  $pptx = Join-Path $OutputDir "agp-category-block-visual-explainer.pptx"
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
