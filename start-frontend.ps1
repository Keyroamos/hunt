# Start React Frontend Development Server

Write-Host "Starting React Frontend..." -ForegroundColor Green

Set-Location -Path "$PSScriptRoot\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed. Installing now..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

# Start dev server
Write-Host "`n🚀 Starting Vite dev server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Gray

npm run dev

