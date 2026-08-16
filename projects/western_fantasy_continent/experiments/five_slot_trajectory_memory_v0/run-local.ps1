$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorktreeRoot = (Resolve-Path (Join-Path $Here "..\..\..\..")).Path
$SharedModels = Join-Path (Split-Path -Parent $WorktreeRoot) "shared_models"
$Python = "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

$env:PYTHONPATH = (Join-Path $SharedModels ".runtime_deps") + ";" + $Here
$env:HF_HOME = Join-Path $SharedModels ".hf_home"
$env:HF_MODULES_CACHE = Join-Path $SharedModels ".hf_modules"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:GTE_MODEL_PATH = Join-Path $SharedModels "gte-multilingual-base"

& $Python -m unittest -v (Join-Path $Here "test_five_slot_memory.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $Python (Join-Path $Here "run_semantic_demo.py")
exit $LASTEXITCODE
