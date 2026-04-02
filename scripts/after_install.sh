#!/bin/bash
set -e

echo "=== After Install ==="

cd /var/www/tradeguard

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/tradeguard

# Install Backend production dependencies
cd /var/www/tradeguard/Backend
echo "Installing Backend dependencies..."
npm ci --omit=dev

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Copy environment file if exists in secure location
if [ -f /home/ubuntu/.env.backend ]; then
    cp /home/ubuntu/.env.backend /var/www/tradeguard/Backend/.env
    chown ubuntu:ubuntu /var/www/tradeguard/Backend/.env
    chmod 600 /var/www/tradeguard/Backend/.env
    echo "Environment file copied."
else
    echo "WARNING: No .env.backend file found at /home/ubuntu/.env.backend"
fi

echo "=== After Install Complete ==="
