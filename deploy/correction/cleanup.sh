#!/bin/bash
# 1. Force stop and remove the wrong containers
echo "Stopping and removing legacy/incorrect containers..."
docker rm -f postgres-business nginx-gateway 2>/dev/null || true

# 2. Remove the specific network if it exists (clean up old bridge)
echo "Cleaning up networks..."
docker network rm deploy_iasbt-net 2>/dev/null || true

# 3. Clean up any other potential conflicts on ports 80/443/8080
echo "Releasing ports 80, 443, 8080..."
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true

echo "Cleanup finished. Ready for correct deployment."
