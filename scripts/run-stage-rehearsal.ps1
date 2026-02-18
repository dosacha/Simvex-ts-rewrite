param(
  [string]$EnvFile = "env/stage.env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  Write-Error "환경변수 파일을 찾을 수 없음: $EnvFile"
}

Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line.Length -eq 0) { return }
  if ($line.StartsWith("#")) { return }

  $parts = $line -split "=", 2
  if ($parts.Length -ne 2) { return }

  $name = $parts[0].Trim()
  $value = $parts[1].Trim()
  if ($name.Length -eq 0) { return }

  Set-Item -Path "Env:$name" -Value $value
}

Write-Host "stage 환경변수 로드 완료: $EnvFile"
npm run rehearsal:stage
