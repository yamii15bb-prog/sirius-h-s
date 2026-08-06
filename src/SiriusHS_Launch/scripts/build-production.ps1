$ErrorActionPreference='Stop'
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
npm install
npm run build
Write-Host 'Build terminado en dist/' -ForegroundColor Green
