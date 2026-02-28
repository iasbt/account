# Full Deploy Script

Write-Host "Starting Full Deployment..." -ForegroundColor Cyan

# 1. Build Project
Write-Host "1. Building Frontend (npm run build)..."
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# 2. Copy to Deploy Folder
$DeployDir = ".\deploy\data\nginx\html"
Write-Host "2. Copying build artifacts to $DeployDir..."

if (-not (Test-Path $DeployDir)) {
    New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
}

# Clean old files
Get-ChildItem -Path $DeployDir -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Copy new files
Copy-Item -Path ".\dist\*" -Destination $DeployDir -Recurse -Force

# 3. Deploy to Remote Server
Write-Host "3. Executing Remote Deployment..."
.\deploy_to_remote.ps1

Write-Host "Deployment Complete!" -ForegroundColor Green
