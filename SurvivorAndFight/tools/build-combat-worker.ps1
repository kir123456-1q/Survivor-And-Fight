# 将战斗 Worker 打包到 bin/js/combat.worker.js（修改 combat.worker.ts / combatWorkerLogic.ts 后执行）
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
& (Join-Path $PSScriptRoot 'sync-config-to-bin.ps1')
npx --yes esbuild src/game/combat/combat.worker.ts `
    --bundle `
    --outfile=bin/js/combat.worker.js `
    --format=iife `
    --platform=browser `
    --target=es2020
