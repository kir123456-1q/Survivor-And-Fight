# 将校外 Word 稿导出为 Markdown，供全文检索与对照
# 用法（在 SurvivorAndFight 目录）：
#   .\tools\export-thesis-docx-to-md.ps1
#   .\tools\export-thesis-docx-to-md.ps1 -Docx "D:\path\论文.docx" -Out "docs\thesis-from-docx.md"

param(
    [string]$Docx = (Join-Path $PSScriptRoot "..\..\基于 ECS 架构的类吸血鬼幸存者游戏开发及优化（校外）.docx"),
    [string]$Out = (Join-Path $PSScriptRoot "..\docs\thesis-from-docx.md")
)

$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) { throw "未找到 py/python，请先安装 Python 3" }

& $py.Source (Join-Path $PSScriptRoot "docx-to-md.py") $Docx $Out
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "导出完成: $Out"
