param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $OutputDir "intechna-content-$timestamp"
New-Item -ItemType Directory -Force $backupRoot | Out-Null

$items = @("data", "public/uploads")
foreach ($item in $items) {
  if (Test-Path $item) {
    $target = Join-Path $backupRoot $item
    New-Item -ItemType Directory -Force (Split-Path $target -Parent) | Out-Null
    Copy-Item $item $target -Recurse -Force
  }
}

$zipPath = "$backupRoot.zip"
Compress-Archive -Path $backupRoot -DestinationPath $zipPath -Force
Remove-Item $backupRoot -Recurse -Force
Write-Host "Backup created: $zipPath"
