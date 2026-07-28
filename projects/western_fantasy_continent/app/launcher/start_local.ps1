param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$port = 3777
$repo = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
$server = Join-Path $repo "projects\western_fantasy_continent\app\server\server.js"
$healthUrl = "http://127.0.0.1:$port/api/health"
$workbenchUrl = "http://localhost:$port/workbench/"

$nodeCandidates = @(
  "C:\Program Files\nodejs\node.exe",
  "C:\Users\WYZ\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
$node = $nodeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $node) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) { $node = $nodeCommand.Source }
}
if (-not $node) { throw "Node.js was not found. Install Node.js or make node.exe available on PATH." }
if (-not (Test-Path -LiteralPath $server)) { throw "Server entry does not exist: $server" }

function Stop-PortProcess($targetPort) {
  $processIds = Get-NetTCPConnection -LocalPort $targetPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  if (-not $processIds) {
    $processIds = netstat -ano |
      Select-String ":$targetPort\s" |
      ForEach-Object { ($_ -split "\s+")[-1] } |
      Sort-Object -Unique
  }
  foreach ($processId in $processIds) {
    if ([int]$processId -gt 0) { Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue }
  }
}

try {
  Stop-PortProcess $port
  $serverStart = [System.Diagnostics.ProcessStartInfo]::new()
  $serverStart.FileName = $node
  $serverStart.Arguments = '"' + $server + '"'
  $serverStart.WorkingDirectory = $repo
  $serverStart.UseShellExecute = $true
  $serverStart.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
  $serverProcess = [System.Diagnostics.Process]::Start($serverStart)

  $ready = $false
  for ($attempt = 0; $attempt -lt 50; $attempt += 1) {
    Start-Sleep -Milliseconds 200
    if ($serverProcess.HasExited) { break }
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 1
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
  }

  if (-not $ready) {
    $details = if ($serverProcess.HasExited) { "The server process exited with code $($serverProcess.ExitCode)." } else { "The server did not answer $healthUrl within 10 seconds." }
    if (-not $serverProcess.HasExited) { $serverProcess.Kill() }
    throw $details
  }

  Write-Host "Start Local is ready: $workbenchUrl" -ForegroundColor Green
  if (-not $NoBrowser) {
    $browserStart = [System.Diagnostics.ProcessStartInfo]::new()
    $browserStart.FileName = $workbenchUrl
    $browserStart.UseShellExecute = $true
    [System.Diagnostics.Process]::Start($browserStart) | Out-Null
  }
  exit 0
} catch {
  Write-Host "Start Local failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Server: $server" -ForegroundColor DarkGray
  exit 1
}
