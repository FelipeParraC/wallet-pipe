$ErrorActionPreference = 'Stop'

$envFile = Join-Path (Get-Location) '.env'
if (-not (Test-Path $envFile)) {
  throw '.env no encontrado'
}

$databaseLine = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseLine) {
  throw 'DATABASE_URL no existe en .env'
}

$databaseUrl = $databaseLine.Substring($databaseLine.IndexOf('=') + 1).Trim().Trim('"')
$uri = [Uri]$databaseUrl
$builder = [System.UriBuilder]::new($uri)
$builder.Port = 5432

$env:DATABASE_URL = $builder.Uri.AbsoluteUri
npx prisma migrate deploy
npx prisma generate
