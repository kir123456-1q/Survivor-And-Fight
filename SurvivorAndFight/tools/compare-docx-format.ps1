# Compare thesis draft docx format against college template
param(
    [string]$Draft = (Join-Path $PSScriptRoot '..\论文初稿已排版.docx'),
    [string]$Template = (Join-Path $PSScriptRoot '..\本科毕业设计(论文)参考模板-计算机学院.docx'),
    [string]$OutJson = (Join-Path $PSScriptRoot '..\docs\docx-format-compare\report.json')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Expand-Docx($docxPath, $destDir) {
    if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    $copy = $null
    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($docxPath, $destDir)
    } catch {
        $copy = Join-Path $env:TEMP ("docx-copy-" + [guid]::NewGuid().ToString() + ".docx")
        Copy-Item -LiteralPath $docxPath -Destination $copy -Force
        [System.IO.Compression.ZipFile]::ExtractToDirectory($copy, $destDir)
    } finally {
        if ($copy -and (Test-Path $copy)) { Remove-Item $copy -Force }
    }
}

function TwipsToCm([string]$twips) {
    if (-not $twips) { return $null }
    return [math]::Round([int]$twips / 567.0, 3)
}

function HalfPtToPt([string]$half) {
    if (-not $half) { return $null }
    return [int]$half / 2.0
}

function Get-PgMar($xmlText) {
    $m = [regex]::Match($xmlText, '<w:pgMar[^>]*w:top="(\d+)"[^>]*w:right="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:left="(\d+)"')
    if (-not $m.Success) {
        $m = [regex]::Match($xmlText, 'w:top="(\d+)"[^>]*w:left="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:right="(\d+)"')
    }
    if ($m.Success) {
        return @{
            top_cm    = TwipsToCm $m.Groups[1].Value
            right_cm  = TwipsToCm $m.Groups[2].Value
            bottom_cm = TwipsToCm $m.Groups[3].Value
            left_cm   = TwipsToCm $m.Groups[4].Value
        }
    }
    return $null
}

function Get-PgSz($xmlText) {
    $m = [regex]::Match($xmlText, '<w:pgSz[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"')
    if ($m.Success) {
        return @{ width_cm = TwipsToCm $m.Groups[1].Value; height_cm = TwipsToCm $m.Groups[2].Value }
    }
    return $null
}

function Get-SectCount($xmlText) {
    return ([regex]::Matches($xmlText, '<w:sectPr')).Count
}

function Get-StyleMap($stylesXml) {
    $map = @{}
    foreach ($m in [regex]::Matches($stylesXml, '<w:style w:type="paragraph" w:styleId="([^"]+)"[^>]*>.*?<w:name w:val="([^"]+)"', 'Singleline')) {
        $id = $m.Groups[1].Value
        $name = $m.Groups[2].Value
        $block = $m.Value
        $info = @{ id = $id; name = $name }
        if ($block -match 'w:sz w:val="(\d+)"') { $info.size_pt = HalfPtToPt $Matches[1] }
        if ($block -match 'w:eastAsia="([^"]+)"') { $info.font_eastAsia = $Matches[1] }
        if ($block -match 'w:ascii="([^"]+)"') { $info.font_ascii = $Matches[1] }
        if ($block -match '<w:jc w:val="([^"]+)"') { $info.align = $Matches[1] }
        if ($block -match 'w:line="(\d+)"') { $info.line = $Matches[1] }
        if ($block -match 'w:lineRule="([^"]+)"') { $info.lineRule = $Matches[1] }
        if ($block -match 'w:firstLineChars="(\d+)"') { $info.firstLineChars = $Matches[1] }
        if ($block -match '<w:b\b') { $info.bold = $true }
        $map[$id] = $info
        $map[$name] = $info
    }
    return $map
}

function Get-HeaderFooterTexts($wordDir) {
    $result = @{}
    Get-ChildItem $wordDir -Filter 'header*.xml' | ForEach-Object {
        $t = [regex]::Matches((Get-Content $_.FullName -Raw), '<w:t[^>]*>([^<]*)</w:t>') |
            ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match '\S' }
        $result[$_.Name] = @($t)
    }
    Get-ChildItem $wordDir -Filter 'footer*.xml' | ForEach-Object {
        $t = [regex]::Matches((Get-Content $_.FullName -Raw), '<w:t[^>]*>([^<]*)</w:t>') |
            ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match '\S' }
        $result[$_.Name] = @($t)
    }
    return $result
}

function Get-ParagraphStyleStats($docXml) {
    $stats = @{}
    foreach ($m in [regex]::Matches($docXml, '<w:pStyle w:val="([^"]+)"')) {
        $id = $m.Groups[1].Value
        if (-not $stats.ContainsKey($id)) { $stats[$id] = 0 }
        $stats[$id]++
    }
    return $stats
}

function Get-RunFormatSamples($docXml, $max = 500) {
    $samples = @()
    $count = 0
    foreach ($m in [regex]::Matches($docXml, '<w:r\b[^>]*>.*?</w:r>', 'Singleline')) {
        if ($count -ge $max) { break }
        $block = $m.Value
        $textM = [regex]::Match($block, '<w:t[^>]*>([^<]{2,})</w:t>')
        if (-not $textM.Success) { continue }
        $text = $textM.Groups[1].Value
        if ($text -match '^(http|www\.|w:)' ) { continue }
        $fmt = @{ text = $text.Substring(0, [Math]::Min(30, $text.Length)) }
        if ($block -match 'w:sz w:val="(\d+)"') { $fmt.size_pt = HalfPtToPt $Matches[1] }
        if ($block -match 'w:eastAsia="([^"]+)"') { $fmt.font = $Matches[1] }
        if ($block -match '<w:b\b') { $fmt.bold = $true }
        $samples += $fmt
        $count++
    }
    return $samples
}

function Analyze-Docx($label, $docxPath, $unpackRoot) {
    $dir = Join-Path $unpackRoot $label
    Expand-Docx $docxPath $dir
    $word = Join-Path $dir 'word'
    $docXml = Get-Content (Join-Path $word 'document.xml') -Raw -Encoding UTF8
    $stylesXml = Get-Content (Join-Path $word 'styles.xml') -Raw -Encoding UTF8
    return @{
        label = $label
        path = $docxPath
        margins_last_sect = Get-PgMar $docXml
        page_size_last_sect = Get-PgSz $docXml
        sect_count = Get-SectCount $docXml
        styles = Get-StyleMap $stylesXml
        para_style_stats = Get-ParagraphStyleStats $docXml
        headers_footers = Get-HeaderFooterTexts $word
        header_footer_files = @{
            headers = @(Get-ChildItem $word -Filter 'header*.xml' | Select-Object -ExpandProperty Name)
            footers = @(Get-ChildItem $word -Filter 'footer*.xml' | Select-Object -ExpandProperty Name)
        }
        run_samples_count = (Get-RunFormatSamples $docXml).Count
    }
}

$base = Join-Path $PSScriptRoot '..\docs\docx-format-compare'
$draftInfo = Analyze-Docx 'draft' (Resolve-Path $Draft) $base
$tmplInfo = Analyze-Docx 'template' (Resolve-Path $Template) $base

# Key style ids from template (numeric ids common in college template)
$keyStyleIds = @('1','2','3','4','12')
$keyStyleNames = @('Normal','heading 1','heading 2','heading 3','header')

$styleCompare = @()
foreach ($kid in $keyStyleIds) {
    $d = $draftInfo.styles[$kid]
    $t = $tmplInfo.styles[$kid]
    $styleCompare += @{
        styleId = $kid
        template = $t
        draft = $d
        match = ($null -eq $t -and $null -eq $d) -or (
            $t -and $d -and
            $t.size_pt -eq $d.size_pt -and
            $t.font_eastAsia -eq $d.font_eastAsia -and
            $t.align -eq $d.align -and
            $t.bold -eq $d.bold
        )
    }
}

$marginMatch = $false
if ($draftInfo.margins_last_sect -and $tmplInfo.margins_last_sect) {
    $marginMatch = (
        $draftInfo.margins_last_sect.top_cm -eq $tmplInfo.margins_last_sect.top_cm -and
        $draftInfo.margins_last_sect.bottom_cm -eq $tmplInfo.margins_last_sect.bottom_cm -and
        $draftInfo.margins_last_sect.left_cm -eq $tmplInfo.margins_last_sect.left_cm -and
        $draftInfo.margins_last_sect.right_cm -eq $tmplInfo.margins_last_sect.right_cm
    )
}

$expectedHeader = '中国石油大学（华东）本科毕业设计(论文)'
$draftHeaderTexts = @()
foreach ($k in $draftInfo.headers_footers.Keys) {
    if ($k -like 'header*') {
        $draftHeaderTexts += $draftInfo.headers_footers[$k]
    }
}
$hasSchoolHeader = ($draftHeaderTexts | Where-Object { $_ -like "*$expectedHeader*" }).Count -gt 0

$report = @{
    generated = (Get-Date).ToString('o')
    draft = $draftInfo
    template = $tmplInfo
    comparison = @{
        margins_match = $marginMatch
        page_size_match = ($draftInfo.page_size_last_sect.width_cm -eq $tmplInfo.page_size_last_sect.width_cm)
        style_key_compare = $styleCompare
        draft_sect_count = $draftInfo.sect_count
        template_sect_count = $tmplInfo.sect_count
        draft_has_school_header = $hasSchoolHeader
        draft_header_footer_file_count = @{
            headers = $draftInfo.header_footer_files.headers.Count
            footers = $draftInfo.header_footer_files.footers.Count
        }
        template_header_footer_file_count = @{
            headers = $tmplInfo.header_footer_files.headers.Count
            footers = $tmplInfo.header_footer_files.footers.Count
        }
    }
}

$outDir = Split-Path $OutJson -Parent
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $OutJson -Encoding UTF8
Write-Output "Report: $OutJson"
Write-Output "Margins match: $marginMatch"
Write-Output "Draft sections: $($draftInfo.sect_count), headers: $($draftInfo.header_footer_files.headers.Count), footers: $($draftInfo.header_footer_files.footers.Count)"
