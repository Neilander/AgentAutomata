$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

node (Join-Path $root "run_validation.js") --round 0 --submission "submission_history/round_0.js" --output (Join-Path $root "artifacts/round_0_validation.json")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node (Join-Path $root "run_validation.js") --round 1 --submission "submission_history/round_1.js" --output (Join-Path $root "artifacts/round_1_validation.json")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node (Join-Path $root "run_validation.js") --round 2 --output (Join-Path $root "artifacts/validation.json")
exit $LASTEXITCODE
