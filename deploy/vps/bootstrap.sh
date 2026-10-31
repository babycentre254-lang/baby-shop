#!/usr/bin/env bash
set -euo pipefail

cd /opt/baby-shop

if ! getent passwd babyshop-api >/dev/null; then
  sudo useradd --system --uid 10001 --user-group --no-create-home --home-dir /nonexistent --shell /sbin/nologin babyshop-api
fi

if [[ ! -f .env.api ]]; then
  umask 077
  mongo_password="$(openssl rand -hex 32)"
  access_secret="$(openssl rand -hex 32)"
  refresh_secret="$(openssl rand -hex 32)"
  cat > .env.api <<EOF
NODE_ENV=production
PORT=4000
API_PREFIX=api/v1
CORS_ORIGINS=https://www.babycenter.co.ke,https://babycenter.co.ke,https://admin.babycenter.co.ke
MONGO_ROOT_USERNAME=babyshoproot
MONGO_ROOT_PASSWORD=${mongo_password}
MONGODB_URI=mongodb://babyshoproot:${mongo_password}@mongo:27017/baby-shop?authSource=admin
JWT_ACCESS_SECRET=${access_secret}
JWT_REFRESH_SECRET=${refresh_secret}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_DOMAIN=.babycenter.co.ke
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM_EMAIL=
MAIL_FROM_NAME=BabyCentre Baby Shop
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF
  chmod 600 .env.api
fi

docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml up -d --build
git rev-parse HEAD > .deployed-revision

sudo install -o root -g root -m 0644 deploy/vps/baby-shop-api-deploy.service /etc/systemd/system/baby-shop-api-deploy.service
sudo install -o root -g root -m 0644 deploy/vps/baby-shop-api-deploy.timer /etc/systemd/system/baby-shop-api-deploy.timer
sudo systemctl daemon-reload
sudo systemctl enable --now baby-shop-api-deploy.timer
