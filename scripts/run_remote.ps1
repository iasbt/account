param(
    [string]$Command
)


# Load configuration
. "$PSScriptRoot\scripts\load_env.ps1"

$ServerIP = $global:DEPLOY_SERVER_IP
$User = $global:DEPLOY_USER
$KeyPath = $global:DEPLOY_KEY_PATH

if (-not (Test-Path $KeyPath)) {
    Write-Error "SSH Key not found at: $KeyPath. Please configure .env.ps1"
    exit 1
}

Write-Host ">>> Executing Remote Command: $Command" -ForegroundColor Cyan

$Command | ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" "bash -s"

