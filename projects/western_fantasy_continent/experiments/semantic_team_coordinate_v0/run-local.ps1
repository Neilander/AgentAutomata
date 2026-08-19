$ErrorActionPreference = "Stop"

$ExperimentRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorktreeRoot = (Resolve-Path (Join-Path $ExperimentRoot "..\..\..\..")).Path
$SharedModels = Join-Path (Split-Path -Parent $WorktreeRoot) "shared_models"
$python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$env:PYTHONPATH = Join-Path $SharedModels ".runtime_deps"
$env:HF_HOME = Join-Path $SharedModels ".hf_home"
$env:HF_MODULES_CACHE = Join-Path $SharedModels ".hf_modules"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:GTE_MODEL_PATH = Join-Path $SharedModels "gte-multilingual-base"

& $python "$ExperimentRoot\run_experiment.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $python "$ExperimentRoot\test_results.py"
exit $LASTEXITCODE
