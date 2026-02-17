# House Hunt Frontend Installation Script
# This script installs frontend dependencies with proper timeout settings

Write-Host "Installing frontend dependencies..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Configure npm for better timeout handling
npm config set fetch-timeout 120000
npm config set fetch-retries 5

# Install with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Installation successful!" -ForegroundColor Green
    Write-Host "`nTo start the dev server, run:" -ForegroundColor Cyan
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
} else {
    Write-Host "`n❌ Installation failed. Try running manually:" -ForegroundColor Red
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm install --legacy-peer-deps" -ForegroundColor White
}

