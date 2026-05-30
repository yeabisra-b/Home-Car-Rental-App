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

# Client .env
if (-not (Test-Path "client/.env")) {
    Copy-Item "client/.env.example" "client/.env"
    Write-Host "✔ Created client/.env from .env.example" -ForegroundColor $Green
} else {
    Write-Host "ℹ client/.env already exists" -ForegroundColor $Yellow
}

# Server .env
if (-not (Test-Path "server/.env")) {
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "✔ Created server/.env from .env.example" -ForegroundColor $Green
    
    # Auto-generate unique JWT secrets
    Write-Host "⚙ Generating unique JWT secrets..." -ForegroundColor $Yellow
    $AccessSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>$null
    $RefreshSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 2>$null
    
    if ($AccessSecret -and $RefreshSecret) {
        # Modify the newly created .env file
        node -e "const fs = require('fs'); let env = fs.readFileSync('server/.env', 'utf8'); env = env.replace(/JWT_ACCESS_SECRET=.*/, 'JWT_ACCESS_SECRET=$AccessSecret').replace(/JWT_REFRESH_SECRET=.*/, 'JWT_REFRESH_SECRET=$RefreshSecret'); fs.writeFileSync('server/.env', env);"
        Write-Host "✔ Generated unique JWT secrets and saved to server/.env" -ForegroundColor $Green
    }
} else {
    Write-Host "ℹ server/.env already exists" -ForegroundColor $Yellow
}

# Flutter dependencies
Write-Host ""
Write-Host "Installing Flutter dependencies..." -ForegroundColor White
Push-Location client
try {
    flutter pub get
} finally {
    Pop-Location
}
Write-Host "✔ Flutter dependencies installed successfully." -ForegroundColor $Green

Write-Host ""
Write-Host "--------------------------------------------------" -ForegroundColor $Cyan
Write-Host "Setup complete! Starting applications..." -ForegroundColor $Green
Write-Host "--------------------------------------------------" -ForegroundColor $Cyan
Write-Host ""

# Disable stop on error for the runtime execution phase
$ErrorActionPreference = "Continue"

# Start Server in Background
Write-Host "🚀 Starting backend server in the background..." -ForegroundColor $Yellow
$ServerProcess = Start-Process node -ArgumentList "index.js" -WorkingDirectory "server" -RedirectStandardOutput "../server.log" -RedirectStandardError "../server.log" -NoNewWindow -PassThru

# Monitor process state and handle cleanup
$ServerPid = $ServerProcess.Id

# Health check polling
Write-Host -NoNewline "⏳ Waiting for backend server to become healthy..."
$ServerUp = $false

for ($i = 1; $i -le 30; $i++) {
    # Check if process is still running
    $proc = Get-Process -Id $ServerPid -ErrorAction SilentlyContinue
    if (-not $proc -or $proc.HasExited) {
        break
    }
    
    # Check health using Invoke-RestMethod
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 1 -ErrorAction Stop
        if ($response.status -eq "OK") {
            $ServerUp = $true
            break
        }
    } catch {
        # Ignore errors while waiting
    }
    
    Write-Host -NoNewline "."
    Start-Sleep -Seconds 1
}

# Cleanup function to kill the backend server
function Stop-Server {
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        Write-Host ""
        Write-Host "🛑 Stopping backend server (PID $ServerPid)..." -ForegroundColor $Yellow
        Stop-Process -Id $ServerPid -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Backend server stopped." -ForegroundColor $Green
    }
    Write-Host "👋 Exiting setup and run script." -ForegroundColor $Green
}

try {
    if ($ServerUp) {
        Write-Host " Online!" -ForegroundColor $Green
        Write-Host "✔ Server is responding on http://localhost:3000/health" -ForegroundColor $Green
        Write-Host ""
        Write-Host "💡 Note: Backend output is being saved to server.log" -ForegroundColor $Yellow
        Write-Host "💡 Note: If you need to edit database credentials, modify server/.env" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "🚀 Launching Flutter app..." -ForegroundColor $Cyan
        Write-Host "----------------------------------------"
        
        Push-Location client
        flutter run
        Pop-Location
    } else {
        Write-Host " Failed!" -ForegroundColor $Red
        Write-Host "❌ Error: Server failed to start or didn't become healthy in time." -ForegroundColor $Red
        Write-Host "Check server.log for detailed error logs:" -ForegroundColor $Red
        Write-Host "----------------------------------------"
        if (Test-Path "server.log") {
            Get-Content "server.log" -Tail 25
        } else {
            Write-Host "No server.log file found."
        }
        Write-Host "----------------------------------------"
        exit 1
    }
} finally {
    Stop-Server
}
