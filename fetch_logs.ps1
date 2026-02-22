$ServerIP = "119.91.71.30"
$User = "ubuntu"
$KeyPath = "D:\OneDrive\Desktop\trae.pem"
$Cmd = "sudo docker logs account-backend --tail 100"
ssh -i $KeyPath -o StrictHostKeyChecking=no "${User}@${ServerIP}" $Cmd
