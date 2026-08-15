param(
  [Parameter(Mandatory=$true)][string]$Workspace,
  [Parameter(Mandatory=$true)][string]$EnglishSource,
  [Parameter(Mandatory=$true)][string]$MelayuSource
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
$Paper = RgbInt 246 241 231
$Mist = RgbInt 200 213 207
$Dim = RgbInt 131 150 143
$Gold = RgbInt 216 168 78

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
    try {
      if ($shape.PlaceholderFormat.Type -eq 1) {
        $shape.Left = 48
        $shape.Top = 72
        $shape.Width = 760
        $shape.Height = 78
        $shape.TextFrame.TextRange.Font.Name = "Georgia"
        $shape.TextFrame.TextRange.Font.Size = 29
        $shape.TextFrame.TextRange.Font.Color.RGB = $Paper
        $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
      } elseif ($shape.PlaceholderFormat.Type -ne 1) {
        $shape.Left = 50
        $shape.Top = 154
        $shape.Width = 610
        $shape.Height = 66
        $shape.TextFrame.TextRange.Font.Name = "Aptos"
        $shape.TextFrame.TextRange.Font.Size = 11
        $shape.TextFrame.TextRange.Font.Color.RGB = $Mist
        $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
      }
    } catch {}
  }
}

function StylePlaceholders($slide, [string]$title, [string]$body) {
  $titleShape = $slide.Shapes.Title
  $titleShape.Left = 48
  $titleShape.Top = 72
  $titleShape.Width = 760
  $titleShape.Height = 78
  $titleShape.TextFrame.TextRange.Text = $title
  $titleShape.TextFrame.TextRange.Font.Name = "Georgia"
  $titleShape.TextFrame.TextRange.Font.Size = 29
  $titleShape.TextFrame.TextRange.Font.Color.RGB = $Paper
  $titleShape.TextFrame.TextRange.Font.Bold = $msoFalse
  $titleShape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse

  $bodyShape = $null
  foreach ($shape in @($slide.Shapes.Placeholders)) {
    try {
      if ($shape.PlaceholderFormat.Type -ne 1) { $bodyShape = $shape; break }
    } catch {}
  }
  if ($null -ne $bodyShape) {
    $bodyShape.Left = 50
    $bodyShape.Top = 154
    $bodyShape.Width = 610
    $bodyShape.Height = 68
    $bodyShape.TextFrame.TextRange.Text = $body
    $bodyShape.TextFrame.TextRange.Font.Name = "Aptos"
    $bodyShape.TextFrame.TextRange.Font.Size = 10.5
    $bodyShape.TextFrame.TextRange.Font.Color.RGB = $Mist
    $bodyShape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = $msoFalse
    try {
      $bodyShape.TextFrame.MarginLeft = 0
      $bodyShape.TextFrame.MarginRight = 0
      $bodyShape.TextFrame.MarginTop = 0
      $bodyShape.TextFrame.MarginBottom = 0
    } catch {}
  }
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

function AddKicker($slide) {
  Add-Rect $slide.Shapes 48 39 7 16 $Gold | Out-Null
  AddText $slide "AMANAH GOVERNANCE PLATFORM" 64 34 440 20 $Gold 9 $true | Out-Null
}

function AddFooter($slide, [string]$source, [int]$n) {
  AddText $slide $source 48 506 680 14 $Dim 7 | Out-Null
  $num = AddText $slide ($n.ToString("00")) 850 502 60 18 $Gold 9 $true
  $num.TextFrame.TextRange.ParagraphFormat.Alignment = 3
}

function Get-Text($shape) {
  try {
    if ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
      return ($shape.TextFrame.TextRange.Text.Trim() -replace "`r", "`n")
    }
  } catch {}
  return ""
}

function Add-ExcludedId($set, $shape) {
  if ($null -ne $shape) { $set[[string]$shape.Id] = $true }
}

function Get-SlideParts($sourceSlide) {
  $textShapes = @()
  foreach ($shape in @($sourceSlide.Shapes)) {
    $txt = Get-Text $shape
    if ($txt.Length -gt 0) {
      $textShapes += [pscustomobject]@{
        Shape = $shape
        Text = $txt
        Top = [double]$shape.Top
        Left = [double]$shape.Left
        Width = [double]$shape.Width
        Height = [double]$shape.Height
      }
    }
  }

  $titleShape = $textShapes |
    Where-Object { $_.Top -ge 20 -and $_.Top -le 55 -and $_.Left -ge 40 -and $_.Left -le 100 } |
    Sort-Object Top, Left |
    Select-Object -First 1

  $claimShape = $textShapes |
    Where-Object { $_.Top -ge 60 -and $_.Top -le 115 -and $_.Left -le 70 -and $_.Width -ge 500 } |
    Sort-Object Top, Left |
    Select-Object -First 1

  $supportShapes = $textShapes |
    Where-Object {
      $_.Top -ge 130 -and $_.Top -le 260 -and $_.Left -le 70 -and $_.Width -ge 500 -and
      ($null -eq $claimShape -or $_.Shape.Id -ne $claimShape.Shape.Id)
    } |
    Sort-Object Top, Left

  $footerShape = $textShapes |
    Where-Object { $_.Top -ge 490 -and $_.Left -le 100 -and $_.Width -ge 400 } |
    Sort-Object Top, Left |
    Select-Object -First 1

  $pageMarker = $textShapes |
    Where-Object { $_.Top -ge 490 -and $_.Left -ge 820 } |
    Sort-Object Top, Left |
    Select-Object -First 1

  $exclude = @{}
  Add-ExcludedId $exclude $titleShape.Shape
  Add-ExcludedId $exclude $claimShape.Shape
  Add-ExcludedId $exclude $footerShape.Shape
  Add-ExcludedId $exclude $pageMarker.Shape
  foreach ($shapeInfo in $supportShapes) { Add-ExcludedId $exclude $shapeInfo.Shape }

  $bodyItems = @()
  if ($null -ne $claimShape) { $bodyItems += $claimShape.Text }
  foreach ($shapeInfo in $supportShapes) { $bodyItems += $shapeInfo.Text }

  return [pscustomobject]@{
    Title = if ($null -ne $titleShape) { $titleShape.Text } else { "SLIDE " + $sourceSlide.SlideIndex }
    Body = ($bodyItems -join "`r")
    Footer = if ($null -ne $footerShape) { $footerShape.Text } else { "" }
    Exclude = $exclude
  }
}

function Is-MasterChromeOrBackground($shape) {
  try {
    if ($shape.Type -eq $msoShapeRectangle -and $shape.Left -le 1 -and $shape.Top -le 1 -and $shape.Width -ge 950 -and $shape.Height -ge 530) { return $true }
    if ($shape.Type -eq $msoShapeRectangle -and $shape.Left -le 1 -and $shape.Top -le 6 -and $shape.Width -ge 950 -and $shape.Height -le 12) { return $true }
  } catch {}
  return $false
}

function Copy-RemainingShapes($sourceSlide, $targetSlide, $exclude) {
  foreach ($shape in @($sourceSlide.Shapes)) {
    if ($exclude.ContainsKey([string]$shape.Id)) { continue }
    if (Is-MasterChromeOrBackground $shape) { continue }
    if ($shape.Type -eq 14) { continue }
    $copied = $false
    for ($attempt = 1; $attempt -le 4 -and -not $copied; $attempt++) {
      try {
        $shape.Copy()
        Start-Sleep -Milliseconds 45
        $targetSlide.Shapes.Paste() | Out-Null
        Start-Sleep -Milliseconds 20
        $copied = $true
      } catch {
        Start-Sleep -Milliseconds (80 * $attempt)
      }
    }
  }
}

function Remove-StrayCopyArtifacts($slide) {
  foreach ($shape in @($slide.Shapes)) {
    $txt = Get-Text $shape
    if ($txt -match "https?://|github\.com|EffortEdutech") {
      try { $shape.Delete() } catch {}
    }
  }
}

function Build-Deck($ppt, [string]$sourcePath, [string]$deckPath, [string]$previewSubdir, [bool]$saveTemplate, [string]$templatePath) {
  $source = $ppt.Presentations.Open($sourcePath, $false, $false, $false)
  $pres = $ppt.Presentations.Add($msoTrue)
  $pres.PageSetup.SlideWidth = 960
  $pres.PageSetup.SlideHeight = 540

  $master = $pres.SlideMaster
  $master.Name = "AGP Dark Placeholder Master"
  Add-ThemeShapes $master
  foreach ($layout in @($master.CustomLayouts)) { Configure-Layout $layout }

  for ($i = 1; $i -le $source.Slides.Count; $i++) {
    $sourceSlide = $source.Slides.Item($i)
    $parts = Get-SlideParts $sourceSlide
    $slide = $pres.Slides.Add($i, $ppLayoutText)
    AddKicker $slide
    StylePlaceholders $slide $parts.Title $parts.Body
    Copy-RemainingShapes $sourceSlide $slide $parts.Exclude
    Remove-StrayCopyArtifacts $slide
    AddFooter $slide $parts.Footer $i
  }

  $pres.SaveAs($deckPath, $ppSaveAsOpenXMLPresentation)
  if ($saveTemplate) { $pres.SaveAs($templatePath, $ppSaveAsOpenXMLTemplate) }

  $deckPreview = Join-Path $PreviewDir $previewSubdir
  New-Item -ItemType Directory -Force -Path $deckPreview | Out-Null
  $pres.Export($deckPreview, "PNG", 960, 540)

  $slideCount = $pres.Slides.Count
  $bad = @()
  foreach ($slide in @($pres.Slides)) {
    $titleOk = $false
    $bodyOk = $false
    try { $titleOk = ($slide.Shapes.Title.PlaceholderFormat.Type -eq 1 -and $slide.Shapes.Title.TextFrame.TextRange.Text.Trim().Length -gt 0) } catch {}
    foreach ($ph in @($slide.Shapes.Placeholders)) {
      try {
        if ($ph.PlaceholderFormat.Type -ne 1 -and $ph.HasTextFrame -and $ph.TextFrame.TextRange.Text.Trim().Length -gt 0) {
          $bodyOk = $true
          break
        }
      } catch {}
    }
    if (-not ($titleOk -and $bodyOk)) { $bad += $slide.SlideIndex }
  }

  $pres.Close()
  $source.Close()

  return [pscustomobject]@{
    deck = $deckPath
    slides = $slideCount
    problemSlides = ($bad -join ",")
    bytes = (Get-Item -LiteralPath $deckPath).Length
  }
}

$englishOut = Join-Path $OutputDir "agp-platform-stakeholder-briefing-english-placeholder-master.pptx"
$melayuOut = Join-Path $OutputDir "agp-platform-stakeholder-briefing-melayu-placeholder-master.pptx"
$templateOut = Join-Path $OutputDir "AGP-Dark-Placeholder-Master-Template.potx"

$ppt = New-Object -ComObject PowerPoint.Application
$ppt.Visible = $msoTrue
try { $ppt.DisplayAlerts = 1 } catch {}
try {
  $results = @()
  $results += Build-Deck $ppt $EnglishSource $englishOut "english" $true $templateOut
  $results += Build-Deck $ppt $MelayuSource $melayuOut "melayu" $false $templateOut
  [pscustomobject]@{
    template = $templateOut
    templateBytes = (Get-Item -LiteralPath $templateOut).Length
    decks = $results
  } | ConvertTo-Json -Depth 5
} finally {
  try { $ppt.Quit() } catch {}
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
