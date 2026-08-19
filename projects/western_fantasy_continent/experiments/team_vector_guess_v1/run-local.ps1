$ErrorActionPreference = "Stop"

$ExperimentRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorktreeRoot = (Resolve-Path (Join-Path $ExperimentRoot "..\..\..\..")).Path
$SharedModels = Join-Path (Split-Path -Parent $WorktreeRoot) "shared_models"
$Python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

$env:PYTHONPATH = Join-Path $SharedModels ".runtime_deps"
$env:HF_HOME = Join-Path $SharedModels ".hf_home"
$env:HF_MODULES_CACHE = Join-Path $SharedModels ".hf_modules"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:GTE_MODEL_PATH = Join-Path $SharedModels "gte-multilingual-base"

& node (Join-Path $ExperimentRoot "build-team-knowledge.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& node (Join-Path $ExperimentRoot "test-team-knowledge.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python (Join-Path $ExperimentRoot "run_vector_experiment.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python (Join-Path $ExperimentRoot "test_vector_results.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& node (Join-Path $ExperimentRoot "build-llm-direction-requests.js")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python (Join-Path $ExperimentRoot "evaluate-llm-directions.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python (Join-Path $ExperimentRoot "test-llm-directions.py")
exit $LASTEXITCODE
