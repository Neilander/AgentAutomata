param(
    [Parameter(Mandatory = $true)][ValidateSet('start', 'advance', 'random')][string]$Mode,
    [Parameter(Mandatory = $true)][string]$StateDir,
    [Parameter(Mandatory = $true)][string]$StdoutPath,
    [Parameter(Mandatory = $true)][string]$StderrPath,
    [Parameter(Mandatory = $true)][string]$ExitCodePath,
    [string]$ChoicePath
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$cli = Join-Path $root 'projects\western_fantasy_continent\experiments\ufs_first_action_imagination_v0\attention-player-cli.js'
$node = (Get-Command node -ErrorAction Stop).Source

$stateFull = [IO.Path]::GetFullPath((Join-Path $root $StateDir))
$stdoutFull = [IO.Path]::GetFullPath((Join-Path $root $StdoutPath))
$stderrFull = [IO.Path]::GetFullPath((Join-Path $root $StderrPath))
$exitFull = [IO.Path]::GetFullPath((Join-Path $root $ExitCodePath))

[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($stateFull)) | Out-Null
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($stdoutFull)) | Out-Null
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($stderrFull)) | Out-Null
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($exitFull)) | Out-Null

$psi = [Diagnostics.ProcessStartInfo]::new()
$psi.FileName = $node
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.StandardOutputEncoding = [Text.UTF8Encoding]::new($false)
$psi.StandardErrorEncoding = [Text.UTF8Encoding]::new($false)
$psi.Environment['UFS_ATTENTION_SEED'] = '2026082451'
$psi.Environment['ATTENTION_SEED'] = '2026082451'
$psi.ArgumentList.Add($cli)
$psi.ArgumentList.Add($Mode)
$psi.ArgumentList.Add($stateFull)
if ($ChoicePath) {
    $choiceFull = [IO.Path]::GetFullPath((Join-Path $root $ChoicePath))
    $psi.ArgumentList.Add($choiceFull)
}

$process = [Diagnostics.Process]::new()
$process.StartInfo = $psi
$null = $process.Start()
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

$utf8 = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($stdoutFull, $stdout, $utf8)
[IO.File]::WriteAllText($stderrFull, $stderr, $utf8)
[IO.File]::WriteAllText($exitFull, [string]$process.ExitCode, $utf8)

if ($process.ExitCode -ne 0) {
    throw "CLI exited with code $($process.ExitCode); see $stderrFull"
}

$stdout

