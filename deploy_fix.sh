#!/bin/bash
set -e

echo "=== Step 1: Update Groq API key in backend .env ==="
sed -i 's/^GROQ_API_KEY=.*/GROQ_API_KEY=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/' /var/www/TempyMail/backend/.env
echo "Groq API key updated"

echo "=== Step 2: Fix nginx caching for index.html ==="
NGINX_CONF="/etc/nginx/sites-available/tempymail"
if grep -q "no-cache" "$NGINX_CONF" 2>/dev/null; then
    echo "Cache headers already present"
else
    # Add a location block for index.html with no-cache before the closing brace
    cat > /tmp/nginx_tempymail.conf << 'NGINXEOF'
server {
    listen 80;
    server_name tempymail.site www.tempymail.site;
    root /var/www/html;
    index index.html;

    # Prevent caching of index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    # Cache static assets with hashed filenames
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF
    cp /tmp/nginx_tempymail.conf "$NGINX_CONF"
    echo "Nginx config updated with no-cache headers"
fi

echo "=== Step 3: Test and reload nginx ==="
nginx -t && systemctl reload nginx
echo "Nginx reloaded"

echo "=== Step 4: Restart backend API ==="
systemctl restart tempymail-api
echo "Backend restarted"

echo "=== Step 5: Verify ==="
cat /var/www/TempyMail/backend/.env
echo ""
echo "=== DONE ==="
