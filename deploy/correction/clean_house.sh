#!/bin/bash
# clean_house.sh - Thoroughly clean up legacy containers and networks
# Target: nginx-gateway, postgrest, postgres-business
# Target Network: iasbt-net, deploy_iasbt-net

echo ">>> [1/3] Stopping and Removing Legacy Containers..."
CONTAINERS="nginx-gateway postgrest postgres-business nginx-proxy-app-1 mt-photos"
sudo docker rm -f $CONTAINERS 2>/dev/null || true

echo ">>> [2/3] Cleaning up Legacy Networks..."
NETWORKS="iasbt-net deploy_iasbt-net"
sudo docker network rm $NETWORKS 2>/dev/null || true

echo ">>> [3/3] Releasing Ports (80, 443, 8080)..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true
sudo fuser -k 8080/tcp 2>/dev/null || true

echo ">>> Cleanup Complete. Ready for V1.6 Deployment."
