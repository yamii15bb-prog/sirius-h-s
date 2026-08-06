$ErrorActionPreference = 'Stop'
Write-Host '=== Sirius H&S ===' -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host 'Instala Node.js 20 LTS o superior.' -ForegroundColor Red; exit 1 }
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env'; Write-Host 'Se creó .env. Edita JWT_SECRET antes de producción.' -ForegroundColor Yellow }
npm install
npm run dev
