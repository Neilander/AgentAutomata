$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$required = 'README.md','DECISIONS.md','ROUND_SUMMARIES.md','RESULTS.md','TEST_RESULTS.md','machine-records.ndjson','evidence','payloads'
$missing = @($required | Where-Object { -not (Test-Path (Join-Path $root $_)) })
if ($missing.Count) { throw ('missing: ' + ($missing -join ', ')) }
$lines = Get-Content (Join-Path $root 'machine-records.ndjson')
if ($lines.Count -lt 10) { throw 'too few public records' }
if (-not ((Get-Content (Join-Path $root 'DECISIONS.md') -Raw) -match '2026082508')) { throw 'seed missing' }
'PUBLIC_EVIDENCE_OK records=' + $lines.Count
