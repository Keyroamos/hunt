# Start Django Backend Server

Write-Host "Starting Django Backend..." -ForegroundColor Green

Set-Location -Path $PSScriptRoot

# Check if virtual environment exists (optional)
# if (Test-Path "venv") {
#     Write-Host "Activating virtual environment..." -ForegroundColor Yellow
#     .\venv\Scripts\Activate.ps1
# }

# Check if migrations are needed
Write-Host "Checking database migrations..." -ForegroundColor Yellow
python manage.py makemigrations
python manage.py migrate

# Start server
Write-Host "`n🚀 Starting Django server..." -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:8000/api/" -ForegroundColor Yellow
Write-Host "Admin panel: http://localhost:8000/admin/" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Gray

python manage.py runserver

