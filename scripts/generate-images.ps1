# ==========================================================================
# generate-images.ps1 — 拾页导航的图标与分享图
#
#   powershell -ExecutionPolicy Bypass -File scripts/generate-images.ps1
#
# 生成（都在 assets/ 下）：
#   og-image.png         1200 x 630  社交分享图
#   favicon.png            64 x 64   浏览器标签兜底
#   apple-touch-icon.png  180 x 180  iOS 主屏
#   icon-192.png / icon-512.png      manifest 图标（可 maskable）
# 以及根目录的 favicon.ico（16 / 32 / 48）。
#
# 依赖 Windows PowerShell 的 System.Drawing，无第三方工具。
# ==========================================================================

param(
  [string]$SiteName = "拾页导航",
  [string]$Tagline  = "把每天要用的网站，收进一页里。",
  [string]$Kicker   = "SHIYE NAV  /  2026",
  [string]$Cats     = "搜索引擎  ·  影视视频  ·  AI 工具",
  [string]$SiteUrl  = "swdlawa.github.io/nav"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

# --- 配色（与 css/styles.css 一致） ---------------------------------------
$bg        = [System.Drawing.ColorTranslator]::FromHtml("#f2f5ef")
$surface   = [System.Drawing.ColorTranslator]::FromHtml("#fffef9")
$green     = [System.Drawing.ColorTranslator]::FromHtml("#1e6b4f")
$greenSoft = [System.Drawing.ColorTranslator]::FromHtml("#bcd9c8")
$ink       = [System.Drawing.ColorTranslator]::FromHtml("#15211b")
$muted     = [System.Drawing.ColorTranslator]::FromHtml("#5f6f64")
$line      = [System.Drawing.ColorTranslator]::FromHtml("#dde5d8")
$rust      = [System.Drawing.ColorTranslator]::FromHtml("#b96a37")

$root   = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-RoundedRect {
  param([float]$x, [float]$y, [float]$w, [float]$h, [float]$r)
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
  $p.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
  $p.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-Canvas {
  param([int]$w, [int]$h)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @($bmp, $g)
}

# 图形主体：两张叠放的“页面” + 三条线 + 一个锈色圆点
function Draw-Pages {
  param($g, [float]$cx, [float]$cy, [float]$size)

  $x = $cx - $size / 2
  $y = $cy - $size / 2
  $u = $size / 64.0

  # 后面那张纸，稍微旋转
  $state = $g.Save()
  $g.TranslateTransform($cx, ($y + 26 * $u))
  $g.RotateTransform(-9)
  $back = New-RoundedRect ((-11 * $u)) ((-20 * $u)) (26 * $u) (36 * $u) (4 * $u)
  $backBrush = New-Object System.Drawing.SolidBrush($greenSoft)
  $g.FillPath($backBrush, $back)
  $g.Restore($state)
  $backBrush.Dispose(); $back.Dispose()

  # 前面那张纸
  $front = New-RoundedRect (($x + 16 * $u)) (($y + 18 * $u)) (27 * $u) (36 * $u) (4 * $u)
  $frontBrush = New-Object System.Drawing.SolidBrush($surface)
  $g.FillPath($frontBrush, $front)
  $front.Dispose(); $frontBrush.Dispose()

  # 纸上的三条线
  $pen = New-Object System.Drawing.Pen($green, [float](2.4 * $u))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($pen, ($x + 23 * $u), ($y + 28 * $u), ($x + 36 * $u), ($y + 28 * $u))
  $g.DrawLine($pen, ($x + 23 * $u), ($y + 35 * $u), ($x + 36 * $u), ($y + 35 * $u))
  $g.DrawLine($pen, ($x + 23 * $u), ($y + 42 * $u), ($x + 31 * $u), ($y + 42 * $u))
  $pen.Dispose()

  # 锈色圆点
  $dot = New-Object System.Drawing.SolidBrush($rust)
  $r = 5 * $u
  $g.FillEllipse($dot, ($x + 48 * $u - $r), ($y + 47 * $u - $r), ($r * 2), ($r * 2))
  $dot.Dispose()
}

# 带绿色圆角底的标志
function Draw-Mark {
  param($g, [float]$cx, [float]$cy, [float]$size)

  $plate = New-RoundedRect ($cx - $size / 2) ($cy - $size / 2) $size $size ($size * 0.26)
  $plateBrush = New-Object System.Drawing.SolidBrush($green)
  $g.FillPath($plateBrush, $plate)
  $plate.Dispose(); $plateBrush.Dispose()

  Draw-Pages $g $cx $cy ($size * 0.86)
}

function Draw-Text {
  param($g, [string]$text, $font, $brush, [float]$x, [float]$y)
  $g.DrawString($text, $font, $brush, $x, $y)
}

# --- 1. 应用图标 + favicon PNG --------------------------------------------
foreach ($size in @(64, 180, 192, 512)) {
  $pair = New-Canvas $size $size
  $bmp = $pair[0]; $g = $pair[1]
  $g.Clear($green)

  # maskable 安全区：图形保持在中间 80% 以内
  Draw-Pages $g ($size / 2) ($size / 2) ($size * 0.58)

  $fileName = switch ($size) {
    64  { "favicon.png" }
    180 { "apple-touch-icon.png" }
    192 { "icon-192.png" }
    512 { "icon-512.png" }
  }
  $bmp.Save((Join-Path $outDir $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

# --- 2. favicon.ico（16 / 32 / 48，经典 32 位 DIB） -----------------------
function Get-IconDib {
  param([int]$size)

  $pair = New-Canvas $size $size
  $bmp = $pair[0]; $g = $pair[1]
  $g.Clear([System.Drawing.Color]::Transparent)
  Draw-Mark $g ($size / 2) ($size / 2) ($size * 0.94)

  $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $locked = $bmp.LockBits($rect,
    [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = [Math]::Abs($locked.Stride)
  $pixels = New-Object byte[] ($stride * $size)
  [System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $pixels, 0, $pixels.Length)
  $bmp.UnlockBits($locked)
  $g.Dispose(); $bmp.Dispose()

  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ms)
  $bw.Write([UInt32]40)
  $bw.Write([Int32]$size)
  $bw.Write([Int32]($size * 2))
  $bw.Write([UInt16]1)
  $bw.Write([UInt16]32)
  $bw.Write([UInt32]0)
  $bw.Write([UInt32]($size * $size * 4))
  $bw.Write([Int32]0); $bw.Write([Int32]0)
  $bw.Write([UInt32]0); $bw.Write([UInt32]0)

  for ($y = $size - 1; $y -ge 0; $y--) {
    $bw.Write($pixels, ($y * $stride), ($size * 4))
  }

  $maskStride = [int]([Math]::Ceiling($size / 32.0) * 4)
  $bw.Write((New-Object byte[] ($maskStride * $size)))

  $bw.Flush()
  $bytes = $ms.ToArray()
  $bw.Dispose(); $ms.Dispose()
  return ,$bytes
}

$icoSizes = @(16, 32, 48)
$icoDibs = @()
foreach ($s in $icoSizes) { $icoDibs += ,(Get-IconDib $s) }

$icoStream = New-Object System.IO.MemoryStream
$icoWriter = New-Object System.IO.BinaryWriter($icoStream)
$icoWriter.Write([UInt16]0)
$icoWriter.Write([UInt16]1)
$icoWriter.Write([UInt16]$icoSizes.Count)

$icoOffset = 6 + 16 * $icoSizes.Count
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
  $s = $icoSizes[$i]
  $data = $icoDibs[$i]
  $dim = if ($s -ge 256) { 0 } else { $s }
  $icoWriter.Write([Byte]$dim)
  $icoWriter.Write([Byte]$dim)
  $icoWriter.Write([Byte]0)
  $icoWriter.Write([Byte]0)
  $icoWriter.Write([UInt16]1)
  $icoWriter.Write([UInt16]32)
  $icoWriter.Write([UInt32]$data.Length)
  $icoWriter.Write([UInt32]$icoOffset)
  $icoOffset += $data.Length
}
foreach ($data in $icoDibs) { $icoWriter.Write($data) }
$icoWriter.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $root "favicon.ico"), $icoStream.ToArray())
$icoWriter.Dispose(); $icoStream.Dispose()

# --- 3. Open Graph 分享图 --------------------------------------------------
$pair = New-Canvas 1200 630
$bmp = $pair[0]; $g = $pair[1]
$g.Clear($bg)

$frame = New-Object System.Drawing.Pen($line, 2)
$g.DrawRectangle($frame, 40, 40, 1120, 550)

# 左侧文字
$kickerFont = New-Object System.Drawing.Font("Consolas", 20, [System.Drawing.FontStyle]::Regular)
$nameFont   = New-Object System.Drawing.Font("Microsoft YaHei", 84, [System.Drawing.FontStyle]::Bold)
$tagFont    = New-Object System.Drawing.Font("Microsoft YaHei", 32, [System.Drawing.FontStyle]::Regular)
$catsFont   = New-Object System.Drawing.Font("Microsoft YaHei", 16, [System.Drawing.FontStyle]::Regular)
$urlFont    = New-Object System.Drawing.Font("Consolas", 20, [System.Drawing.FontStyle]::Regular)

$inkBrush    = New-Object System.Drawing.SolidBrush($ink)
$greenBrush  = New-Object System.Drawing.SolidBrush($green)
$mutedBrush  = New-Object System.Drawing.SolidBrush($muted)
$rustBrush   = New-Object System.Drawing.SolidBrush($rust)

Draw-Text $g $Kicker $kickerFont $greenBrush 96 108
Draw-Text $g $SiteName $nameFont $inkBrush 88 148
Draw-Text $g $Tagline $tagFont $inkBrush 96 300
Draw-Text $g $Cats $catsFont $mutedBrush 98 372

# 粗体统计
$statFont = New-Object System.Drawing.Font("Consolas", 26, [System.Drawing.FontStyle]::Bold)
Draw-Text $g "26 SITES · 3 CATEGORIES" $statFont $rustBrush 96 470
Draw-Text $g $SiteUrl $urlFont $mutedBrush 96 520

# 右侧标志
$g.TranslateTransform(940, 300)
$g.RotateTransform(-5)
Draw-Mark $g 0 0 300
$g.ResetTransform()

$bmp.Save((Join-Path $outDir "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)

foreach ($obj in @($frame, $kickerFont, $nameFont, $tagFont, $catsFont, $urlFont,
                   $inkBrush, $greenBrush, $mutedBrush, $rustBrush, $statFont)) {
  $obj.Dispose()
}
$g.Dispose(); $bmp.Dispose()

Write-Output "Generated images in $outDir"
Get-ChildItem $outDir -Filter *.png | Select-Object Name, Length
