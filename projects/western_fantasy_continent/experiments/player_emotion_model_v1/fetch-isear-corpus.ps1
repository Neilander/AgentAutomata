param(
    [string]$OutputPath = (Join-Path $PSScriptRoot 'data\raw\isear\filtered-api.jsonl')
)

$ErrorActionPreference = 'Stop'
$dataset = 'savalera%2Fisear-from-original'
$config = 'filtered'
$sourceSplits = @('train', 'validation', 'test')
$pageSize = 100
$outputDirectory = Split-Path -Parent $OutputPath
$pageDirectory = Join-Path $outputDirectory 'pages'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $pageDirectory | Out-Null

function Get-JsonWithRetry {
    param([string]$Uri)
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            return Invoke-RestMethod -UseBasicParsing -Uri $Uri -TimeoutSec 30
        }
        catch {
            if ($attempt -eq 5) { throw }
            Start-Sleep -Milliseconds (750 * $attempt)
        }
    }
}

$encoding = New-Object System.Text.UTF8Encoding($false)
$writer = New-Object System.IO.StreamWriter($OutputPath, $false, $encoding)
$counts = [ordered]@{}
$totalWritten = 0
try {
    foreach ($split in $sourceSplits) {
        $firstUri = "https://datasets-server.huggingface.co/rows?dataset=$dataset&config=$config&split=$split&offset=0&length=1"
        $first = Get-JsonWithRetry -Uri $firstUri
        $total = [int]$first.num_rows_total
        $written = 0
        for ($offset = 0; $offset -lt $total; $offset += $pageSize) {
            $pagePath = Join-Path $pageDirectory "$split-$offset.json"
            if (Test-Path -LiteralPath $pagePath) {
                $page = Get-Content -LiteralPath $pagePath -Raw | ConvertFrom-Json
            }
            else {
                $uri = "https://datasets-server.huggingface.co/rows?dataset=$dataset&config=$config&split=$split&offset=$offset&length=$pageSize"
                $page = Get-JsonWithRetry -Uri $uri
                [System.IO.File]::WriteAllText(
                    $pagePath,
                    ($page | ConvertTo-Json -Compress -Depth 10),
                    $encoding
                )
            }
            foreach ($entry in $page.rows) {
                $row = [ordered]@{ sourceDatasetSplit = $split }
                foreach ($property in $entry.row.PSObject.Properties) {
                    $row[$property.Name] = $property.Value
                }
                $writer.WriteLine(($row | ConvertTo-Json -Compress -Depth 8))
                $written++
                $totalWritten++
            }
            Write-Output "progress split=$split rows=$written/$total"
        }
        if ($written -ne $total) {
            throw "$split expected $total rows, wrote $written"
        }
        $counts[$split] = $written
    }
}
finally {
    $writer.Dispose()
}

[ordered]@{
    dataset = 'savalera/isear-from-original'
    config = $config
    rows = $totalWritten
    sourceSplitCounts = $counts
    output = $OutputPath
} | ConvertTo-Json -Depth 4
