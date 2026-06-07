# 编译 thesis/main.tex → main.pdf（XeLaTeX + BibTeX）
# 用法：在 thesis/ 目录执行  .\build.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 写入 Git 版本信息供 chapter07 引用
$gitHash = ""
$gitDate = ""
try {
    Push-Location (Split-Path $PSScriptRoot -Parent)
    $gitHash = (git rev-parse --short HEAD 2>$null)
    $gitDate = (git log -1 --format="%ci" 2>$null)
    Pop-Location
} catch {}
if ($gitHash) {
    @"
% 由 build.ps1 自动生成，请勿手改
\newcommand{\thesisGitCommit}{$gitHash}
\newcommand{\thesisGitCommitDate}{$gitDate}
"@ | Set-Content -Path (Join-Path $PSScriptRoot "build-info.tex") -Encoding UTF8
}

# 将 Png/ 下截图同步到 figures/（LaTeX chapter07 仍用 fig-01-start.png 等短名）
$pngSrc = Join-Path $PSScriptRoot "Png"
$figDst = Join-Path $PSScriptRoot "figures"
$screenshotMap = @{
    "fig-01-start" = "图7-1-fig-01-start.png"
    "fig-02-runmap" = "图7-2-fig-02-runmap.png"
    "fig-03-combat" = "图7-3-fig-03-combat.png"
    "fig-04-skill" = "图7-4-fig-04-skill.png"
    "fig-05-reward" = "图7-5-fig-05-reward.png"
    "fig-06-restart" = "图7-6-fig-06-restart.png"
}
if (Test-Path $pngSrc) {
    foreach ($short in $screenshotMap.Keys) {
        $srcName = $screenshotMap[$short]
        $src = Join-Path $pngSrc $srcName
        $dst = Join-Path $figDst ($short + ".png")
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $dst -Force
        }
    }
    Write-Host "==> 已同步 Png/图7-x-fig-*.png -> figures/fig-*.png" -ForegroundColor DarkGray
}

# Mermaid 图导出（figures/*.mmd -> *.png）
# -s 缩放因子；分层图用较宽画布，时序图用较高画布，避免 LaTeX 按页宽缩放后裁切或模糊
if (Get-Command npx -ErrorAction SilentlyContinue) {
    $mermaidArgs = @{
        "system-layers"         = @("-w", "2000", "-H", "600",  "-s", "2")
        "system-sequence"       = @("-w", "2400", "-H", "2800", "-s", "2")
        "skill-tab-sequence"    = @("-w", "2000", "-H", "1400", "-s", "2")
        "skill-effect-flow"     = @("-w", "2000", "-H", "1800", "-s", "2")
        "pool-lifecycle"        = @("-w", "2200", "-H", "600",  "-s", "2")
        "worker-frame-pipeline" = @("-w", "2200", "-H", "1600", "-s", "2")
        "config-load-sequence"  = @("-w", "2200", "-H", "1200", "-s", "2")
        "fault-degrade-state"   = @("-w", "2800", "-H", "3200", "-s", "3")
        "ecs-gameplay-overview" = @("-w", "2600", "-H", "2000", "-s", "2")
        "mvc-ui-structure"      = @("-w", "2600", "-H", "2000", "-s", "2")
        "ch04-worker-pool-design" = @("-w", "2600", "-H", "1800", "-s", "2")
        "formula-tree-flow"     = @("-w", "2400", "-H", "2200", "-s", "2")
    }
    Get-ChildItem -Path $figDst -Filter "*.mmd" -ErrorAction SilentlyContinue | ForEach-Object {
        $out = Join-Path $figDst ($_.BaseName + ".png")
        $extra = $mermaidArgs[$_.BaseName]
        if (-not $extra) { $extra = @("-w", "2000", "-s", "2") }
        Write-Host "==> mermaid: $($_.Name) -> $($_.BaseName).png ($($extra -join ' '))" -ForegroundColor DarkGray
        npx --yes @mermaid-js/mermaid-cli -i $_.FullName -o $out -b transparent @extra 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warning "Mermaid 导出失败: $($_.Name)" }
    }
}

function Invoke-TeX($cmd) {
    & @cmd
    # MiKTeX 在“未检查更新”等提示下也可能返回非 0，以 PDF 是否更新为准
    if ($LASTEXITCODE -ne 0 -and -not (Test-Path (Join-Path $PSScriptRoot "main.pdf"))) {
        throw "命令失败 (exit $LASTEXITCODE): $cmd"
    }
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
