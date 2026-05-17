# Enumerate EffectIcon PNG filenames for skill_effect_table validation.
$dir = Join-Path $PSScriptRoot '..\assets\atlas\EffectIcon'
Get-ChildItem -Path $dir -Filter '*.png' |
    ForEach-Object { $_.BaseName } |
    Sort-Object
