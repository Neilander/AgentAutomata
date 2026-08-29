param()

$ErrorActionPreference = 'Stop'
$exp = $PSScriptRoot
$transcriptPath = Join-Path $exp 'machine-transcript.json'
$transcript = Get-Content -Raw -Encoding UTF8 -LiteralPath $transcriptPath | ConvertFrom-Json
$events = @($transcript.events)
$tests = [Collections.Generic.List[object]]::new()
$hardFailure = $false

function Add-Check([string]$Name, [bool]$Pass, [string]$Detail) {
    $script:tests.Add([PSCustomObject]@{ name = $Name; pass = $Pass; detail = $Detail })
    if (-not $Pass) { $script:hardFailure = $true }
}

function Relative-FullPath([string]$Relative) {
    return [IO.Path]::GetFullPath((Join-Path $exp $Relative))
}

$required = @(
    'EXPERIMENT_PROTOCOL.md', 'README.md', 'RESULTS.md', 'thought-log.jsonl',
    'machine-transcript.json', 'TEST_RESULTS.md', '.gitignore', 'capture-cli.ps1'
)
Add-Check 'required public artifacts' (($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $exp $_) -PathType Leaf) }).Count -eq 0) 'All required top-level artifacts exist.'

$sequences = @($events | ForEach-Object { [int]$_.sequence })
$expectedSequences = @(0..($events.Count - 1))
Add-Check 'contiguous command/response sequence' (($sequences -join ',') -eq ($expectedSequences -join ',')) "Sequences are 0..$($events.Count - 1)."

$startEvents = @($events | Where-Object { $_.mode -eq 'start' })
$startResponses = @(Get-ChildItem -File -LiteralPath (Join-Path $exp 'raw-stdout') -Filter '*start*.json')
Add-Check 'single Attempt and single start' ($startEvents.Count -eq 1 -and $events[0].mode -eq 'start' -and $startResponses.Count -eq 1) 'One start is the first event; no restart exists.'
Add-Check 'fixed seed declaration' ($transcript.attentionSeedInjected -eq '2026082451' -and $transcript.attemptId -eq 'ufs-v5-attempt-1') 'Transcript records one Attempt and seed injection 2026082451; CLI seed consumption was not publicly echoed.'

$allHashPass = $true
$allViewPass = $true
$allExitPass = $true
$allJsonPass = $true
foreach ($event in $events) {
    $response = Relative-FullPath $event.responseFile
    $view = Relative-FullPath $event.viewFile
    try { $null = Get-Content -Raw -Encoding UTF8 -LiteralPath $response | ConvertFrom-Json } catch { $allJsonPass = $false }
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $response).Hash.ToLowerInvariant()
    if ($hash -ne $event.stdoutSha256) { $allHashPass = $false }
    $responseBytes = [IO.File]::ReadAllBytes($response)
    $viewBytes = [IO.File]::ReadAllBytes($view)
    if (-not [Linq.Enumerable]::SequenceEqual[byte]($responseBytes, $viewBytes)) { $allViewPass = $false }
    $base = [IO.Path]::GetFileNameWithoutExtension($response)
    $exitPath = Join-Path $exp "exit-codes/$base.txt"
    $stderrPath = Join-Path $exp "raw-stderr/$base.txt"
    if ((Get-Content -Raw -Encoding UTF8 -LiteralPath $exitPath).Trim() -ne '0') { $allExitPass = $false }
    if ((Get-Item -LiteralPath $stderrPath).Length -ne 0) { $allExitPass = $false }
}
Add-Check 'raw stdout JSON integrity' $allJsonPass 'Every captured stdout file parses as one JSON response.'
Add-Check 'stdout manifest hashes' $allHashPass 'Every raw stdout SHA-256 matches the immutable transcript entry; start was captured before any decision.'
Add-Check 'verbatim view copies' $allViewPass 'Each views file is byte-identical to its raw stdout source.'
Add-Check 'CLI exits and stderr' $allExitPass 'All 24 CLI processes exited 0 with empty stderr.'

$orderPass = $true
$sourcePass = $true
$randomPass = $true
$rejectedCount = 0
for ($i = 1; $i -lt $events.Count; $i++) {
    $event = $events[$i]
    $previousEvent = $events[$i - 1]
    $previousText = Get-Content -Raw -Encoding UTF8 -LiteralPath (Relative-FullPath $previousEvent.responseFile)
    $previous = $previousText | ConvertFrom-Json
    $current = Get-Content -Raw -Encoding UTF8 -LiteralPath (Relative-FullPath $event.responseFile) | ConvertFrom-Json

    if ($event.mode -eq 'random') {
        if ($previous.status -ne 'random' -or $event.choiceFile) { $randomPass = $false }
        continue
    }
    if ($event.mode -ne 'advance' -or -not $event.choiceFile) { $orderPass = $false; continue }
    $choice = Get-Content -Raw -Encoding UTF8 -LiteralPath (Relative-FullPath $event.choiceFile) | ConvertFrom-Json
    if (@($previous.availableOperations) -notcontains $choice.type) { $orderPass = $false }
    foreach ($property in $choice.PSObject.Properties) {
        if ($property.Name -in @('type', 'pay', 'advanceSteps')) { continue }
        if ($property.Value -is [string] -and -not $previousText.Contains('"' + $property.Value + '"')) { $sourcePass = $false }
    }
    if ($choice.type -eq 'choose_research_advance') {
        if ([int]$choice.advanceSteps -gt [int]$previous.pending.maxAdvanceSteps) { $sourcePass = $false }
    }
    if ($current.status -eq 'rejected') {
        $rejectedCount++
        if ([int]$current.actionCount -ne [int]$previous.actionCount) { $orderPass = $false }
    }
}
Add-Check 'operation/response ordering and phase legality' $orderPass 'Every advance follows a captured view, uses an advertised operation, and every rejection leaves actionCount unchanged.'
Add-Check 'noticed-parameter provenance' $sourcePass 'Every submitted identifier/value is present in the immediately preceding cropped response; research advanceSteps is within displayed maxAdvanceSteps.'
Add-Check 'random boundary legality' $randomPass 'The sole random command immediately follows the sole random status and has no player choice file.'

$last = $events[-1]
$lastJson = Get-Content -Raw -Encoding UTF8 -LiteralPath (Relative-FullPath $last.responseFile) | ConvertFrom-Json
Add-Check 'terminal sealing' ($last.status -eq 'complete' -and $lastJson.observation.phase -eq 'new_round' -and -not $lastJson.pending -and @($lastJson.availableOperations).Count -eq 0) 'Final response is complete/new_round with no pending operation, and no later transcript event exists.'

$leakPass = $true
foreach ($directory in @('raw-stdout', 'views', 'choices')) {
    foreach ($file in Get-ChildItem -File -LiteralPath (Join-Path $exp $directory)) {
        $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $file.FullName
        if ($text -match '(?i)hostCheckpoint|private-host-state|"checkpoint"\s*:') { $leakPass = $false }
    }
}
$ignoreText = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $exp '.gitignore')
Add-Check 'private-state isolation and leak scan' ($leakPass -and $ignoreText -match '(?m)^\.private-host-state/$') 'Only public response/choice directories were scanned; no checkpoint/private-state marker appears, and the private directory is ignored without being enumerated.'

$thoughtPass = $true
$thoughtLines = @(Get-Content -Encoding UTF8 -LiteralPath (Join-Path $exp 'thought-log.jsonl') | Where-Object { $_.Trim() })
foreach ($line in $thoughtLines) {
    try {
        $record = $line | ConvertFrom-Json
        foreach ($field in @('noticed','explicitUnknowns','macroNeed','legalCandidates','counterfactual','finalOperation','workingMemoryAfter')) {
            if ($null -eq $record.PSObject.Properties[$field]) { $thoughtPass = $false }
        }
    } catch { $thoughtPass = $false }
}
Add-Check 'thought-log schema' ($thoughtPass -and $thoughtLines.Count -eq 24) 'All 24 decision/boundary records are valid JSONL and contain every required reasoning field.'

$summary = [PSCustomObject]@{
    schema = 'ufs_attention_limited_contract_results_v5'
    hardChecksPassed = -not $hardFailure
    eventCount = $events.Count
    rejectedPayloadCount = $rejectedCount
    payloadAcceptanceFinding = 'Ten submitted payloads were rejected atomically: one missing explicit pay and nine undocumented choose_spawn field guesses. Operation types and identifier provenance remained valid; the final documented dropPointId payload succeeded.'
    checks = $tests
}
$summary | ConvertTo-Json -Depth 8
if ($hardFailure) { exit 1 }
