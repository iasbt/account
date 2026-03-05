#!/bin/bash
set -e

# Target directory
TARGET_DIR="/home/ubuntu/account/deploy/correction/logto"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Directory $TARGET_DIR does not exist. Creating..."
    mkdir -p "$TARGET_DIR"
fi

cd "$TARGET_DIR"

echo "==> 1. Stopping Logto containers..."
# Use sudo for docker just in case user isn't in group
if sudo docker compose ps -q >/dev/null 2>&1; then
    sudo docker compose down -v || true
else
    echo "Containers not running."
fi

echo "==> 2. Force cleaning data directory..."
if [ -d "logto-data" ]; then
    sudo rm -rf logto-data
    echo "Removed logto-data."
fi

mkdir -p logto-data/postgres
# Set permissions so docker (often root) can write, but also accessible
sudo chmod 777 logto-data/postgres

echo "==> 3. Cleanup complete. Ready for fresh deploy."
ls -ld logto-data
