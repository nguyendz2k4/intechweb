param([string]$OutputDir = 'backups')
$ErrorActionPreference = 'Stop'
# Run from the application root. Credentials stay in environment variables.
Push-Location (Join-Path $PSScriptRoot '..')
try {
  & node (Join-Path $PSScriptRoot 'db-backup.mjs') $OutputDir
  if ($LASTEXITCODE -ne 0) { throw 'Database/content backup failed.' }
} finally { Pop-Location }
