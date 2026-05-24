param(
    [string]$DraftWord,
    [string]$TmplWord
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (-not $DraftWord) { $DraftWord = Join-Path $root 'docs\docx-format-compare\draft\word' }
if (-not $TmplWord) { $TmplWord = Join-Path $root 'docs\docx-format-compare\template\word' }
$DraftWord = (Resolve-Path -LiteralPath $DraftWord).Path
$TmplWord = (Resolve-Path -LiteralPath $TmplWord).Path

function TwipsToCm($t) { if ($t) { [math]::Round([int]$t / 567.0, 3) } }
function HalfPt($h) { if ($h) { [int]$h / 2.0 } }

function Get-LastPgMar($xml) {
    $all = [regex]::Matches($xml, '<w:pgMar[^/]*/>')
    if ($all.Count -eq 0) { return $null }
    $last = $all[$all.Count - 1].Value
    $m = [regex]::Match($last, 'w:top="(\d+)"[^>]*w:left="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:right="(\d+)"')
    if (-not $m.Success) {
        $m = [regex]::Match($last, 'w:top="(\d+)"[^>]*w:right="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:left="(\d+)"')
    }
    if ($m.Success) {
        return [ordered]@{
            top_cm    = TwipsToCm $m.Groups[1].Value
            left_cm   = TwipsToCm $m.Groups[2].Value
            bottom_cm = TwipsToCm $m.Groups[3].Value
            right_cm  = TwipsToCm $m.Groups[4].Value
        }
    }
    return $null
}

function Get-LastPgSz($xml) {
    $all = [regex]::Matches($xml, '<w:pgSz[^/]*/>')
    if ($all.Count -eq 0) { return $null }
    $last = $all[$all.Count - 1].Value
    $m = [regex]::Match($last, 'w:w="(\d+)"[^>]*w:h="(\d+)"')
    if ($m.Success) {
        return [ordered]@{
            width_cm  = TwipsToCm $m.Groups[1].Value
            height_cm = TwipsToCm $m.Groups[2].Value
        }
    }
    return $null
}

function Get-StyleInfo($styles, $id) {
    $pat = '<w:style[^>]*w:styleId="' + [regex]::Escape($id) + '"[^>]*>.*?<w:name w:val="([^"]+)"'
    $m = [regex]::Match($styles, $pat, 'Singleline')
    if (-not $m.Success) { return $null }
    $b = $m.Value
    $pt = $null; $font = $null; $align = $null; $line = $null; $rule = $null; $fl = $null; $bold = $false
    if ($b -match 'w:sz w:val="(\d+)"') { $pt = HalfPt $Matches[1] }
    if ($b -match 'w:eastAsia="([^"]+)"') { $font = $Matches[1] }
    if ($b -match 'w:jc w:val="([^"]+)"') { $align = $Matches[1] }
    if ($b -match 'w:line="(\d+)"') { $line = $Matches[1] }
    if ($b -match 'w:lineRule="([^"]+)"') { $rule = $Matches[1] }
    if ($b -match 'w:firstLineChars="(\d+)"') { $fl = $Matches[1] }
    if ($b -match '<w:b\b') { $bold = $true }
    return [pscustomobject]@{
        id = $id; name = $m.Groups[1].Value; size_pt = $pt; font_eastAsia = $font
        align = $align; line = $line; lineRule = $rule; firstLineChars = $fl; bold = $bold
    }
}

function Get-HfTexts($wordDir) {
    $out = @()
    Get-ChildItem $wordDir -Filter 'header*.xml' | ForEach-Object {
        $tx = [regex]::Matches((Get-Content $_.FullName -Raw), '(?<=<w:t[^>]*>)[^<]+') |
            ForEach-Object { $_.Value } | Where-Object { $_ -match '\S' }
        if ($tx) { $out += [pscustomobject]@{ file = $_.Name; type = 'header'; text = ($tx -join '') } }
    }
    Get-ChildItem $wordDir -Filter 'footer*.xml' | ForEach-Object {
        $tx = [regex]::Matches((Get-Content $_.FullName -Raw), '(?<=<w:t[^>]*>)[^<]+') |
            ForEach-Object { $_.Value } | Where-Object { $_ -match '\S' }
        if ($tx) { $out += [pscustomobject]@{ file = $_.Name; type = 'footer'; text = ($tx -join '') } }
    }
    return $out
}

$docD = Get-Content (Join-Path $DraftWord 'document.xml') -Raw -Encoding UTF8
$docT = Get-Content (Join-Path $TmplWord 'document.xml') -Raw -Encoding UTF8
$styD = Get-Content (Join-Path $DraftWord 'styles.xml') -Raw -Encoding UTF8
$styT = Get-Content (Join-Path $TmplWord 'styles.xml') -Raw -Encoding UTF8

$report = [ordered]@{}
$report.margins_draft = Get-LastPgMar $docD
$report.margins_template = Get-LastPgMar $docT
$report.page_draft = Get-LastPgSz $docD
$report.page_template = Get-LastPgSz $docT
$report.sect_count_draft = ([regex]::Matches($docD, '<w:sectPr')).Count
$report.sect_count_template = ([regex]::Matches($docT, '<w:sectPr')).Count
$report.hf_files = [ordered]@{
    draft_headers    = @(Get-ChildItem $DraftWord -Filter 'header*.xml').Count
    draft_footers    = @(Get-ChildItem $DraftWord -Filter 'footer*.xml').Count
    template_headers = @(Get-ChildItem $TmplWord -Filter 'header*.xml').Count
    template_footers = @(Get-ChildItem $TmplWord -Filter 'footer*.xml').Count
}

$styleCmp = @()
foreach ($id in @('1', '2', '3', '4', '12')) {
    $d = Get-StyleInfo $styD $id
    $t = Get-StyleInfo $styT $id
    $match = $false
    if ($d -and $t) {
        $match = ($d.size_pt -eq $t.size_pt) -and ($d.font_eastAsia -eq $t.font_eastAsia) -and ($d.align -eq $t.align) -and ($d.bold -eq $t.bold)
    }
    $styleCmp += [pscustomobject]@{ styleId = $id; draft = $d; template = $t; match = $match }
}
$report.style_compare = $styleCmp

$report.draft_hf_texts = Get-HfTexts $DraftWord
$report.template_hf_texts = Get-HfTexts $TmplWord

$stats = @{}
[regex]::Matches($docD, '<w:pStyle w:val="([^"]+)"') | ForEach-Object {
    $id = $_.Groups[1].Value
    if (-not $stats.ContainsKey($id)) { $stats[$id] = 0 }
    $stats[$id]++
}
$report.draft_para_style_top = $stats.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15 |
    ForEach-Object {
        $si = Get-StyleInfo $styD $_.Name
        [pscustomobject]@{ styleId = $_.Name; styleName = $(if ($si) { $si.name } else { '(direct)' }); count = $_.Value }
    }

$outPath = Join-Path (Split-Path $DraftWord -Parent | Split-Path -Parent) 'report.json'
$report | ConvertTo-Json -Depth 8 | Set-Content $outPath -Encoding UTF8
Write-Output $outPath
$report | Format-List margins_draft, margins_template, page_draft, page_template, sect_count_draft, sect_count_template, hf_files
$styleCmp | Format-Table styleId, match, @{n='d_pt';e={$_.draft.size_pt}}, @{n='t_pt';e={$_.template.size_pt}}, @{n='d_font';e={$_.draft.font_eastAsia}}, @{n='t_font';e={$_.template.font_eastAsia}}
Write-Output '--- draft header/footer unique texts ---'
$report.draft_hf_texts | Group-Object text | ForEach-Object { "$($_.Count) files: $($_.Name.Substring(0,[Math]::Min(60,$_.Name.Length)))" }
