$ErrorActionPreference = "Stop"

$root = $PSScriptRoot

function Invoke-NodeChecked {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$NodeArgs)
  & node @NodeArgs
  if ($LASTEXITCODE -ne 0) {
    throw "node exited with code ${LASTEXITCODE}: $($NodeArgs -join ' ')"
  }
}

Invoke-NodeChecked --check (Join-Path $root "five-slot-activation.js")
Invoke-NodeChecked --check (Join-Path $root "trajectory-fixtures.js")
Invoke-NodeChecked --check (Join-Path $root "imagination-pipeline.js")
Invoke-NodeChecked --check (Join-Path $root "test-imagination-pipeline.js")
Invoke-NodeChecked --check (Join-Path $root "run-validation.js")
Invoke-NodeChecked --test (Join-Path $root "test-imagination-pipeline.js")
Invoke-NodeChecked (Join-Path $root "run-validation.js")
Invoke-NodeChecked (Join-Path $root "run-demo.js")
