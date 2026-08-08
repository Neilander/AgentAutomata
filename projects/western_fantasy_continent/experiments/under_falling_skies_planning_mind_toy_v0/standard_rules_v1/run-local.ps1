$ErrorActionPreference = "Stop"

node --check map-contract.js
node --check standard-engine.js
node --check test-standard-engine.js
node --check run-synthetic-smoke.js
node test-standard-engine.js
$env:UFS_STANDARD_SEEDS = if ($env:UFS_STANDARD_SEEDS) { $env:UFS_STANDARD_SEEDS } else { "100" }
node run-synthetic-smoke.js

