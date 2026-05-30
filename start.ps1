# start.ps1 - Project initialization and run script for Windows users
# Run this from the repo root in PowerShell: .\start.ps1

$ErrorActionPreference = "Stop"

# Define colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host ""
Write-Host "==================================================" -ForegroundColor $Cyan
Write-Host "      Rental Property Management System (RPMS)    " -ForegroundColor $Cyan
Write-Host "==================================================" -ForegroundColor $Cyan
Write-Host ""

# Copy environment file if not exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✔ Created .env from .env.example" -ForegroundColor $Green
    } else {
        Write-Host "❌ Error: .env.example not found. Please create a .env file in the root." -ForegroundColor $Red
        Exit 1
    }
} else {
    Write-Host "ℹ .env already exists" -ForegroundColor $Yellow
}

# Flutter dependencies
Write-Host ""
Write-Host "Installing Flutter dependencies..." -ForegroundColor White
flutter pub get
Write-Host "✔ Flutter dependencies installed successfully." -ForegroundColor $Green

Write-Host ""
Write-Host "--------------------------------------------------" -ForegroundColor $Cyan
Write-Host "Setup complete! Starting application..." -ForegroundColor $Green
Write-Host "--------------------------------------------------" -ForegroundColor $Cyan
Write-Host ""

Write-Host "🚀 Launching Flutter app..." -ForegroundColor $Cyan
Write-Host "----------------------------------------"
flutter run
