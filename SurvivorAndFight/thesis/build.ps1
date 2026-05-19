# 编译 thesis/main.tex → main.pdf（XeLaTeX + BibTeX）
# 用法：在 thesis/ 目录执行  .\build.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 将 Png/ 下截图同步到 figures/（与 chapter07 中 \thesisfig 文件名一致）
$pngSrc = Join-Path $PSScriptRoot "Png"
$figDst = Join-Path $PSScriptRoot "figures"
if (Test-Path $pngSrc) {
    Get-ChildItem -Path $pngSrc -Filter "fig-*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination (Join-Path $figDst $_.Name) -Force
    }
    Write-Host "==> 已同步 Png/fig-*.png -> figures/" -ForegroundColor DarkGray
}

function Invoke-TeX($cmd) {
    & $cmd
    if ($LASTEXITCODE -ne 0) { throw "命令失败 (exit $LASTEXITCODE): $cmd" }
}

if (-not (Get-Command xelatex -ErrorAction SilentlyContinue)) {
    $miktexBin = Join-Path $env:LOCALAPPDATA "Programs\MiKTeX\miktex\bin\x64"
    if (Test-Path $miktexBin) { $env:Path = "$miktexBin;$env:Path" }
    if (-not (Get-Command xelatex -ErrorAction SilentlyContinue)) {
        throw "未找到 xelatex。请安装 MiKTeX：winget install MiKTeX.MiKTeX"
    }
}

Write-Host "==> xelatex (1/3)" -ForegroundColor Cyan
Invoke-TeX { xelatex -interaction=nonstopmode main.tex }

Write-Host "==> bibtex" -ForegroundColor Cyan
Invoke-TeX { bibtex main }

Write-Host "==> xelatex (2/3)" -ForegroundColor Cyan
Invoke-TeX { xelatex -interaction=nonstopmode main.tex }

Write-Host "==> xelatex (3/3)" -ForegroundColor Cyan
Invoke-TeX { xelatex -interaction=nonstopmode main.tex }

Write-Host "完成: $(Join-Path $PSScriptRoot 'main.pdf')" -ForegroundColor Green
