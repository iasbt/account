#!/bin/bash
set -e

# 1. Fix key
echo "Processing key..."
# Ensure directory exists
mkdir -p ~/.ssh
tr -d '\r' < ./yuanchengmiyao.pem > ~/.ssh/logto_deploy_key
chmod 600 ~/.ssh/logto_deploy_key

# 2. Wait loop
echo "Waiting for server..."
count=0
# Loop until SSH succeeds
while ! ssh -i ~/.ssh/logto_deploy_key -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@119.91.71.30 "echo SERVER_UP" >/dev/null 2>&1; do
  echo "Server not ready... ($count)"
  sleep 5
  count=$((count+1))
  if [ $count -ge 120 ]; then # 10 minutes max
    echo "Timeout."
    exit 1
  fi
done
echo "Server is UP!"

# 3. Upload cleanup
echo "Uploading cleanup..."
scp -i ~/.ssh/logto_deploy_key -o StrictHostKeyChecking=no deploy/correction/logto/force_cleanup.sh ubuntu@119.91.71.30:/home/ubuntu/cleanup.sh

# 4. Run cleanup
echo "Running cleanup..."
ssh -i ~/.ssh/logto_deploy_key -o StrictHostKeyChecking=no ubuntu@119.91.71.30 "tr -d '\r' < /home/ubuntu/cleanup.sh > /home/ubuntu/cleanup_fixed.sh && mv /home/ubuntu/cleanup_fixed.sh /home/ubuntu/cleanup.sh && chmod +x /home/ubuntu/cleanup.sh && sudo ./cleanup.sh"
