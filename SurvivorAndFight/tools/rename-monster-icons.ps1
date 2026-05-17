# 按 docs/怪物与局内特效_生图提示词.md 图集坐标 → 怪物 ID 重命名 MonsterIcon 切片。
$Here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$Root = (Resolve-Path (Join-Path $Here '..')).Path
$IconDir = Join-Path $Root 'assets\atlas\MonsterIcon'

$map = @{
    'MonsterIconMap_r1_c1_r1_c1.png' = 'monster_m02_rodent_hunter.png'
    'MonsterIconMap_r1_c1_r1_c2.png' = 'monster_m04_rock_shell_beetle.png'
    'MonsterIconMap_r1_c1_r1_c3.png' = 'monster_m06_twin_bats.png'
    'MonsterIconMap_r1_c1_r1_c4.png' = 'monster_m07_spore_bomb_cluster.png'
    'MonsterIconMap_r1_c1_r1_c5.png' = 'monster_m03_spore_spitter.png'
    'MonsterIconMap_r1_c1_r1_c6.png' = 'monster_e03_thunder_golem.png'
    'MonsterIconMap_r1_c1_r1_c7.png' = 'monster_e05_void_anchor.png'
    # c8 校准格，不参与刷怪
    'MonsterIconMap_r2_c1_r1_c1.png' = 'monster_m01_shambling_corpse.png'
    'MonsterIconMap_r2_c1_r1_c2.png' = 'monster_m05_vine_lurker.png'
    'MonsterIconMap_r2_c1_r1_c3.png' = 'monster_m08_rune_apprentice.png'
    'MonsterIconMap_r2_c1_r1_c4.png' = 'monster_m09_phantom_sentinel.png'
    'MonsterIconMap_r2_c1_r1_c5.png' = 'monster_e02_plague_spreader.png'
    'MonsterIconMap_r2_c1_r1_c6.png' = 'monster_e01_iron_warden.png'
    'MonsterIconMap_r2_c1_r1_c7.png' = 'monster_b02_storm_knight.png'
    'MonsterIconMap_r2_c1_r1_c8.png' = 'monster_b03_final_gatekeeper.png'
    'MonsterIconMap_r3_c1_r1_c1.png' = 'monster_b01_putrid_amalgam.png'
    'MonsterIconMap_r3_c1_r1_c2.png' = 'monster_e04_twin_priests.png'
    'MonsterIconMap_r4_c1.png'           = 'monster_m10_rift_tentacle.png'
}

if (-not (Test-Path $IconDir)) {
    Write-Error "MonsterIcon dir not found: $IconDir"
    exit 1
}

foreach ($entry in $map.GetEnumerator()) {
    $old = Join-Path $IconDir $entry.Key
    $new = Join-Path $IconDir $entry.Value
    if (-not (Test-Path $old)) {
        Write-Warning "skip missing: $($entry.Key)"
        continue
    }
    if (Test-Path $new) {
        Remove-Item -Force $new
        $metaNew = "$new.meta"
        if (Test-Path $metaNew) { Remove-Item -Force $metaNew }
    }
    Rename-Item -Path $old -NewName $entry.Value -Force
    $oldMeta = "$old.meta"
    $newMeta = "$new.meta"
    if (Test-Path $oldMeta) {
        Rename-Item -Path $oldMeta -NewName (Split-Path $newMeta -Leaf) -Force
    }
    Write-Host "renamed $($entry.Key) -> $($entry.Value)"
}

$binIcon = Join-Path $Root 'bin\atlas\MonsterIcon'
if (Test-Path (Join-Path $Root 'bin')) {
    New-Item -ItemType Directory -Force -Path $binIcon | Out-Null
    Copy-Item -Path (Join-Path $IconDir '*.png') -Destination $binIcon -Force
    Write-Host "copied icons -> bin/atlas/MonsterIcon"
}

Write-Host 'Monster icon rename done.'
