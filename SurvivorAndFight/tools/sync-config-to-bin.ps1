# 将配表复制到 bin/，供 Laya 预览（以 bin 为站点根）通过 fetch 加载。
$Here = $PSScriptRoot
if (-not $Here) {
    $Here = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$Root = (Resolve-Path (Join-Path $Here '..')).Path
$Bin = Join-Path $Root 'bin'

function Sync-Dir($Source, $Dest) {
    if (-not (Test-Path $Source)) {
        Write-Warning "skip missing: $Source"
        return
    }
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    Copy-Item -Path (Join-Path $Source '*') -Destination $Dest -Recurse -Force
    Write-Host "synced $Source -> $Dest"
}

Sync-Dir (Join-Path $Root 'config') (Join-Path $Bin 'config')
Sync-Dir (Join-Path $Root 'docs\config') (Join-Path $Bin 'docs\config')
Write-Host "Config sync to bin/ done. Root=$Root"
