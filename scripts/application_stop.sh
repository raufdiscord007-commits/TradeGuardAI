#!/bin/bash

echo "=== Application Stop ==="

# Kill any node processes running on port 5000
sudo fuser -k 5000/tcp 2>/dev/null || true

# Stop PM2 process as ubuntu user
sudo -u ubuntu pm2 stop tradeguard-api 2>/dev/null || true
sudo -u ubuntu pm2 delete tradeguard-api 2>/dev/null || true

# Clean up any orphaned node processes
sudo pkill -f "node.*server.js" 2>/dev/null || true

sleep 2

echo "=== Application Stop Complete ==="
