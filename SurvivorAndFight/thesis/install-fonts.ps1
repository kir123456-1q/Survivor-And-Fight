# 安装华文中宋（STZhongsong）供 XeLaTeX 使用
# 用法：在 thesis/ 目录执行  .\install-fonts.ps1

$ErrorActionPreference = "Stop"
$fontsDir = Join-Path $PSScriptRoot "fonts"
$dest = Join-Path $fontsDir "STZhongsong.ttf"
New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

function Copy-IfValid([string]$src) {
    if (-not (Test-Path $src)) { return $false }
    $len = (Get-Item $src).Length
    if ($len -lt 500000) { return $false }
    Copy-Item -Path $src -Destination $dest -Force
    Write-Host "已从本机复制: $src ($len bytes)" -ForegroundColor Green
    return $true
}

$localCandidates = @(
    "$env:WINDIR\Fonts\STZHONGS.TTF",
    "$env:WINDIR\Fonts\STZHONGS.ttf",
    "C:\Program Files\Microsoft Office\root\vfs\Fonts\STZHONGS.TTF",
    "C:\Program Files\Microsoft Office\Office16\Fonts\STZHONGS.TTF"
)
foreach ($p in $localCandidates) {
    if (Copy-IfValid $p) { exit 0 }
}

$officeRoots = @(
    "${env:ProgramFiles}\Microsoft Office",
    "${env:ProgramFiles(x86)}\Microsoft Office"
)
foreach ($root in $officeRoots) {
    if (-not (Test-Path $root)) { continue }
    $found = Get-ChildItem -Path $root -Recurse -Filter "STZHONGS.ttf" -ErrorAction SilentlyContinue |
        Where-Object { $_.Length -gt 500000 } | Select-Object -First 1
    if ($found -and (Copy-IfValid $found.FullName)) { exit 0 }
}

$url = "https://raw.githubusercontent.com/dolbydu/font/master/elegant/STZhongsong.ttf"
Write-Host "尝试下载（30s 超时）: $url" -ForegroundColor Cyan
$tmp = "$dest.download"
curl.exe -L --max-time 30 -o $tmp $url 2>$null
if ((Test-Path $tmp) -and (Get-Item $tmp).Length -gt 500000) {
    Move-Item -Force $tmp $dest
    Write-Host "下载完成: $dest" -ForegroundColor Green
    exit 0
}
Remove-Item $tmp -Force -ErrorAction SilentlyContinue

Write-Host "未找到完整 STZhongsong.ttf（需约 7MB+）。" -ForegroundColor Yellow
Write-Host "请从本机 Word 目录复制 STZHONGS.TTF 到: $dest" -ForegroundColor Yellow
Write-Host "未安装时将自动使用宋体，不影响编译。" -ForegroundColor Yellow
exit 1
