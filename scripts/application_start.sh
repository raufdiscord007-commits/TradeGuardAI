#!/bin/bash
set -e

echo "=== Application Start ==="

# Kill any processes on port 5000 and clean up root's PM2
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo rm -f /root/.pm2/dump.pm2 2>/dev/null || true
sleep 2

# Start Backend with PM2 as ubuntu user
cd /var/www/tradeguard/Backend

# Delete any existing PM2 process
sudo -u ubuntu pm2 delete tradeguard-api 2>/dev/null || true

# Start with PM2 as ubuntu user
sudo -u ubuntu pm2 start src/server.js --name tradeguard-api
sudo -u ubuntu pm2 save

# Setup PM2 to start on boot (idempotent)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

# Configure Nginx ONLY if HTTPS is not already configured
if ! sudo grep -q "listen 443 ssl" /etc/nginx/conf.d/tradeguard.conf 2>/dev/null; then
    echo "Configuring Nginx for HTTP only (HTTPS will be added manually)..."
    sudo tee /etc/nginx/conf.d/tradeguard.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name tradeguardai.app www.tradeguardai.app;

    # Frontend - Static files
    location / {
        root /var/www/tradeguard/Frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache busting for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
        }
        
        # Don't cache HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        }
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
else
    echo "HTTPS already configured, skipping Nginx config overwrite..."
fi

# Remove conflicting config if exists
sudo rm -f /etc/nginx/sites-enabled/tradeguard 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "=== Application Start Complete ==="
