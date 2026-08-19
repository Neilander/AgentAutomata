$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$MemoryRoot = (Resolve-Path (Join-Path $Here "..")).Path
$WorktreeRoot = (Resolve-Path (Join-Path $Here "..\..\..\..\..")).Path
$SharedModels = Join-Path (Split-Path -Parent $WorktreeRoot) "shared_models"
$Python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

$env:PYTHONPATH = (Join-Path $SharedModels ".runtime_deps") + ";" + $MemoryRoot + ";" + $Here
$env:HF_HOME = Join-Path $SharedModels ".hf_home"
$env:HF_MODULES_CACHE = Join-Path $SharedModels ".hf_modules"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:GTE_MODEL_PATH = Join-Path $SharedModels "gte-multilingual-base"

& $Python (Join-Path $Here "run_experiment.py")
exit $LASTEXITCODE
