#!/bin/bash
set -e

KEY_FILE="$HOME/.ssh/logto_deploy_key"
REMOTE_HOST="ubuntu@119.91.71.30"
REMOTE_DIR="/home/ubuntu/account/deploy/correction/logto"

echo "Using key: $KEY_FILE"
ls -l "$KEY_FILE"

echo "Creating remote directory..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_HOST" "mkdir -p $REMOTE_DIR"

echo "Uploading files..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
  deploy/correction/logto/deploy-logto.sh \
  deploy/correction/logto/check-logto.sh \
  deploy/correction/logto/docker-compose.yml \
  deploy/correction/logto/.env \
  "$REMOTE_HOST:$REMOTE_DIR/"

echo "Fixing line endings and permissions..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_HOST" "
  cd $REMOTE_DIR && \
  sed -i 's/\r$//' deploy-logto.sh && \
  sed -i 's/\r$//' check-logto.sh && \
  sed -i 's/\r$//' .env && \
  chmod +x deploy-logto.sh check-logto.sh
"

echo "Executing deployment..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_HOST" "
  cd $REMOTE_DIR && \
  sudo ./deploy-logto.sh remote
"

echo "Verifying deployment..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_HOST" "
  cd $REMOTE_DIR && \
  sudo ./check-logto.sh
"
