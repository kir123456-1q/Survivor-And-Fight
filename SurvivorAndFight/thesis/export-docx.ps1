# 从 LaTeX 源导出 Word（Pandoc）
# 用法：在 thesis/ 目录执行  .\export-docx.ps1
#       .\export-docx.ps1 -BodyOnly

param(
    [switch]$BodyOnly,
    [string]$Output = "main-from-tex.docx"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) { throw "未找到 Python。请安装 Python 3 并加入 PATH。" }

$argsList = @("$root\tools\tex-to-docx.py", "-o", (Join-Path $PSScriptRoot $Output))
if ($BodyOnly) { $argsList += "--body-only" }

# 刷新 PATH；WinGet 安装的 Pandoc 可能在 Packages 子目录
$wingetPandoc = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "pandoc.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($wingetPandoc) { $env:Path = "$($wingetPandoc.DirectoryName);$env:Path" }
$env:Path = "$env:LOCALAPPDATA\Pandoc;$env:ProgramFiles\Pandoc;$env:Path"

Write-Host "==> LaTeX -> Word (Pandoc)" -ForegroundColor Cyan
& $py.Source @argsList
if ($LASTEXITCODE -ne 0) { throw "export-docx 失败" }
Write-Host "==> 完成: $Output" -ForegroundColor Green
