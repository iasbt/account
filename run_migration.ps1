param(
    [string]$Message = "Run Migration"
)

$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"

$Cmd = "sudo docker exec account-backend node scripts/add_version_column.js"

Write-Host ">>> Executing Migration on Remote Server..." -ForegroundColor Cyan

$Cmd | ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigration Complete!" -ForegroundColor Green
} else {
    Write-Error "`nMigration Failed!"
}
