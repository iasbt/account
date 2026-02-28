
# Load configuration
. "$PSScriptRoot\scripts\load_env.ps1"

$ServerIP = $global:DEPLOY_SERVER_IP
$User = $global:DEPLOY_USER
$KeyPath = $global:DEPLOY_KEY_PATH
$Cmd = "sudo docker logs account-backend --tail 100"

if (-not (Test-Path $KeyPath)) {
    Write-Error "SSH Key not found at: $KeyPath. Please configure .env.ps1"
    exit 1
}

ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $Cmd

