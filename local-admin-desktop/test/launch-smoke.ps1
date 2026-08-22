$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root 'release\win-unpacked\Pizjo Admin.exe'

if (-not (Test-Path $exe)) {
  throw "Packaged executable not found: $exe"
}

$process = Start-Process -FilePath $exe -PassThru
Start-Sleep -Seconds 8

if ($process.HasExited) {
  throw "Pizjo Admin exited early with code $($process.ExitCode)."
}

Write-Output "Pizjo Admin is running (PID $($process.Id))."
Stop-Process -Id $process.Id -Force
