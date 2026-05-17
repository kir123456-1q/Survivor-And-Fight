# Generates config/skill_table.json and config/skill_effect_table.json for combat skill loadout UI.
$Here = $PSScriptRoot
if (-not $Here) { $Here = Split-Path -Parent $MyInvocation.MyCommand.Path }
$root = (Resolve-Path (Join-Path $Here '..')).Path
$weaponIconDir = Join-Path $root 'assets\atlas\WeaponIcon'
$effectIconDir = Join-Path $root 'assets\atlas\EffectIcon'

$skillIds = Get-ChildItem $weaponIconDir -Filter '*.png' | ForEach-Object { $_.BaseName } | Sort-Object
$effectIds = Get-ChildItem $effectIconDir -Filter '*.png' | ForEach-Object { $_.BaseName } | Sort-Object

$defaultEquipped = @(
    'wand_ranged_prism_cannon_icon',
    'wand_ranged_frost_lancer_icon',
    'wand_melee_void_reaper_icon'
)
$bulletEnabledPatterns = @('^fx_shot_', '^fx_chain_', '^fx_tile_', '^fx_melee_.*_icon$', '^fx_rand_.*_icon$')

function Test-EffectEnabled([string]$id) {
    foreach ($pat in $bulletEnabledPatterns) {
        if ($id -match $pat) { return $true }
    }
    return $false
}

function Get-DisplayName([string]$id) {
    $s = $id -replace '^wand_', '' -replace '_icon$', '' -replace '_', ' '
    return (Get-Culture).TextInfo.ToTitleCase($s)
}

$skillRows = [System.Collections.ArrayList]@()
$sort = 0
foreach ($sid in $skillIds) {
    $sort++
    $defaultFx = @(
        ($effectIds | Where-Object { $_ -match '^fx_shot_' } | Select-Object -First 1),
        ($effectIds | Where-Object { $_ -match '^fx_chain_' } | Select-Object -First 1)
    ) | Where-Object { $_ }
    if ($defaultFx.Count -eq 0) { $defaultFx = @($effectIds[0]) }
    $skillRows.Add([ordered]@{
        id = $sid
        name = Get-DisplayName $sid
        iconPath = "atlas/WeaponIcon/$sid.png"
        effectIds = @($defaultFx)
        cooldownSec = 0.35
        effectSlotCount = 8
        defaultEquipped = ($defaultEquipped -contains $sid)
        sortOrder = $sort
    }) | Out-Null
}

$fallbackIcon = if ($skillIds.Count -gt 0) { $skillIds[0] } else { 'wand_ranged_prism_cannon_icon' }
$skillRows.Add([ordered]@{
    id = 'player_auto_shot'
    name = 'Player Auto Shot'
    iconPath = "atlas/WeaponIcon/$fallbackIcon.png"
    effectIds = 'player_auto_shot_effect_1'
    cooldownSec = 0.25
    effectSlotCount = 8
    defaultEquipped = $false
    sortOrder = 999
}) | Out-Null

$effectRows = [System.Collections.ArrayList]@()
foreach ($eid in $effectIds) {
    $enabled = Test-EffectEnabled $eid
    $effectType = 'direct_damage'
    if ($enabled) {
        if ($eid -match 'split' -and $eid -notmatch '^fx_shot_') {
            $effectType = 'modifier_split'
        } elseif ($eid -match 'chain') {
            $effectType = 'bullet'
        } else {
            $effectType = 'bullet'
        }
    }
    $row = [ordered]@{
        id = $eid
        name = Get-DisplayName $eid
        iconPath = "atlas/EffectIcon/$eid.png"
        effect = $effectType
        target = 'auto'
        damage = if ($enabled) { 12 } else { 8 }
        enabled = $enabled
    }
    if ($enabled -and $effectType -eq 'bullet') {
        $row.bulletSlot = 'player_bullet_fast_1'
        $row.cooldownSec = 0.35
    }
    if ($eid -match 'pierce|penetration') { $row.penetration = 2 }
    if ($eid -match 'chain') { $row.chainCount = 2 }
    if ($eid -match 'split') { $row.splitCount = 1 }
    $effectRows.Add($row) | Out-Null
}

$effectRows.Add([ordered]@{
    id = 'player_auto_shot_effect_1'
    name = 'Auto Shot'
    iconPath = 'atlas/EffectIcon/fx_shot_split_two_icon.png'
    effect = 'bullet'
    target = 'auto'
    bulletSlot = 'player_bullet_fast_1'
    damage = 10
    enabled = $true
}) | Out-Null

$skillOut = @{ list = $skillRows }
$effectOut = @{ list = $effectRows }

$skillPath = Join-Path $root 'config\skill_table.json'
$effectPath = Join-Path $root 'config\skill_effect_table.json'
$skillOut | ConvertTo-Json -Depth 6 | Set-Content -Path $skillPath -Encoding UTF8
$effectOut | ConvertTo-Json -Depth 6 | Set-Content -Path $effectPath -Encoding UTF8
Write-Host "Wrote $($skillRows.Count) skills -> $skillPath"
Write-Host "Wrote $($effectRows.Count) effects -> $effectPath"
