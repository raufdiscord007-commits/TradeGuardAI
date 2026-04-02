#!/bin/bash
set -e

echo "=== Before Install ==="

# Clean up old deployment
if [ -d /var/www/tradeguard ]; then
    sudo rm -rf /var/www/tradeguard/*
fi

# Create directories
sudo mkdir -p /var/www/tradeguard
sudo chown -R ubuntu:ubuntu /var/www/tradeguard

echo "=== Before Install Complete ==="
