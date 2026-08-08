$ErrorActionPreference = "Stop"

node test-engine.js
node test-planning.js
$env:UFS_SEEDS = if ($env:UFS_SEEDS) { $env:UFS_SEEDS } else { "80" }
node run-experiment.js
node test-results.js

