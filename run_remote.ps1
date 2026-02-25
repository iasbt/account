param(
    [string]$Command
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"

Write-Host ">>> Executing Remote Command: $Command" -ForegroundColor Cyan

$Command | ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" "bash -s"
