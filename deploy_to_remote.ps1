<#
.SYNOPSIS
    Automated Deployment Script for Account System & Gallery Server
    
.DESCRIPTION
    This script automates the deployment of the full stack (Nginx, MT Photos, PostgREST, Postgres) 
    to the remote Ubuntu server. It handles:
    1. SSH Connection using private key
    2. Conflict Resolution (Stopping old containers occupying ports 80/443)
    3. File Synchronization (Uploading deploy/ folder)
    4. Environment Configuration (Setting DB passwords)
    5. Docker Service Orchestration (docker compose up)

.NOTES
    Server IP: 119.91.71.30
    User: ubuntu
    Key: D:\OneDrive\Desktop\trae.pem
    Target Dir: /home/ubuntu/stack
    
.AUTHOR
    Trae AI Assistant
    
.DATE
    2026-02-11
#>

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$RemotePath = "/home/ubuntu/stack"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"

Write-Host "----------------------------------------"
Write-Host "Starting Deployment to $ServerIP using Key: $KeyPath"
Write-Host "----------------------------------------"

# 0. Check Key File
if (-not (Test-Path $KeyPath)) {
    Write-Error "Key file not found at $KeyPath"
    exit 1
}

# 1. Password Management
# CRITICAL: We use a fixed password to ensure compatibility with the existing MySQL data volume.
# If you change this, you MUST delete the data/mysql folder on the server, or the DB will fail to start.
$Password = "8plYGAfmtW79aDXL"
# $Password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | % {[char]$_})

# 2. Cleanup Remote Ports & Containers (Force Clean)
Write-Host "[1/5] Resolving port conflicts (Stopping old Nginx Proxy Manager)..."
# We aggressively stop and remove any container that might be holding port 80 or 443.
# Specifically 'nginx-proxy-app-1' was identified as a legacy container causing conflicts.
$CleanupCmd = "
    sudo docker stop nginx-proxy-app-1 nginx-gateway mt-photos postgrest postgres-business 2>/dev/null || true;
    sudo docker rm nginx-proxy-app-1 nginx-gateway mt-photos postgrest postgres-business 2>/dev/null || true;
    # Kill any processes bound to port 80/443 just in case
    sudo fuser -k 80/tcp 2>/dev/null || true;
    sudo fuser -k 443/tcp 2>/dev/null || true;
    mkdir -p ${RemotePath};
"
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $CleanupCmd

# 3. Upload files
Write-Host "[2/5] Uploading configuration files..."
scp -i $KeyPath -o StrictHostKeyChecking=no -r deploy/* "${User}@${ServerIP}:${RemotePath}/"

# 4. Configure .env remotely
Write-Host "[3/5] Configuring environment variables..."
$EnvCmd = "echo 'DB_ROOT_PASSWORD=${Password}' > ${RemotePath}/.env"
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $EnvCmd

# 5. Start services
Write-Host "[4/5] Starting Docker services..."
$StartCmd = "cd ${RemotePath} && sudo docker compose up -d --remove-orphans"
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $StartCmd

Write-Host "----------------------------------------"
Write-Host "Checking Service Status..."
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" "cd ${RemotePath} && sudo docker compose ps"
Write-Host "----------------------------------------"
Write-Host "Deployment Finished!"
