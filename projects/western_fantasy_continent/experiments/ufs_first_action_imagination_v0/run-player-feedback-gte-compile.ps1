param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$MemoryRoot = (Resolve-Path (Join-Path $Here "..\five_slot_trajectory_memory_v0")).Path
$WorktreeRoot = (Resolve-Path (Join-Path $Here "..\..\..\..")).Path
$GitCommon = (& git -C $WorktreeRoot rev-parse --git-common-dir).Trim()
$RepoRoot = Split-Path -Parent (Resolve-Path $GitCommon).Path
$SharedModels = Join-Path $RepoRoot "logs\shared_models"
$Python = if ($env:UFS_GTE_PYTHON) {
  $env:UFS_GTE_PYTHON
} else {
  "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
}

$env:PYTHONPATH = (Join-Path $SharedModels ".runtime_deps") + ";" + $MemoryRoot
$env:HF_HOME = Join-Path $SharedModels ".hf_home"
$env:HF_MODULES_CACHE = Join-Path $SharedModels ".hf_modules"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:GTE_MODEL_PATH = Join-Path $SharedModels "gte-multilingual-base"

& $Python (Join-Path $Here "compile-player-feedback-gte.py") $InputPath $OutputPath
exit $LASTEXITCODE
