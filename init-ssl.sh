#!/usr/bin/env bash
# ==============================================================================
# Engaging Minds - Automated Let's Encrypt SSL Initialization Script
# ==============================================================================
set -euo pipefail

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Engaging Minds - Let's Encrypt SSL Setup          ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Verify .env file presence
if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] .env file not found!${NC}"
    echo -e "${YELLOW}Please create your .env file from .env.production.example:${NC}"
    echo -e "  cp .env.production.example .env"
    echo -e "Fill in DOMAIN_NAME (e.g. engagingminds.learnovatecentre.org) and LETSENCRYPT_EMAIL before running."
    exit 1
fi

# 2. Source environment variables
set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "${DOMAIN_NAME:-}" ] || [ "${DOMAIN_NAME}" = "mywebsite.com" ]; then
    echo -e "${RED}[ERROR] Please set a valid DOMAIN_NAME in .env before running this script!${NC}"
    exit 1
fi

if [ -z "${LETSENCRYPT_EMAIL:-}" ] || [ "${LETSENCRYPT_EMAIL}" = "admin@mywebsite.com" ]; then
    echo -e "${RED}[ERROR] Please set a valid LETSENCRYPT_EMAIL in .env before running this script!${NC}"
    exit 1
fi

# Determine if www subdomain should be included (default to false for subdomains)
INCLUDE_WWW="${INCLUDE_WWW:-false}"
DOMAIN_ARGS="-d ${DOMAIN_NAME}"
if [ "${INCLUDE_WWW}" = "true" ]; then
    DOMAIN_ARGS="-d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
fi

# 3. Create required certbot & nginx directory structures
mkdir -p ./certbot/conf/live/"${DOMAIN_NAME}"
mkdir -p ./certbot/www
mkdir -p ./nginx

# 4. Replace DOMAIN_NAME_PLACEHOLDER in nginx.conf if present
if grep -q "DOMAIN_NAME_PLACEHOLDER" ./nginx/nginx.conf; then
    echo -e "${BLUE}[1/4] Updating nginx.conf with domain '${DOMAIN_NAME}'...${NC}"
    sed -i "s/DOMAIN_NAME_PLACEHOLDER/${DOMAIN_NAME}/g" ./nginx/nginx.conf
fi

# 5. Ensure OpenSSL is available on the host to generate initial dummy cert
if ! command -v openssl >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing OpenSSL on host...${NC}"
    sudo apt-get update && sudo apt-get install -y openssl
fi

# 6. Create temporary dummy certificate so Nginx starts cleanly on Port 443
echo -e "${BLUE}[2/4] Generating temporary dummy SSL certificate for initial Nginx startup...${NC}"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout "./certbot/conf/live/${DOMAIN_NAME}/privkey.pem" -out "./certbot/conf/live/${DOMAIN_NAME}/fullchain.pem" -subj "/CN=${DOMAIN_NAME}" >/dev/null 2>&1 || true

# Fix permissions on SSL keys so Nginx worker process can read them
chmod -R 755 ./certbot/conf
chmod 644 ./certbot/conf/live/"${DOMAIN_NAME}"/*.pem || true

# 7. Start/Reload Nginx container with dummy certificate so Port 80 serves ACME challenge
echo -e "${BLUE}[3/4] Starting Nginx to serve ACME webroot challenge on Port 80...${NC}"
docker compose -f docker-compose.prod.yml up -d nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload || true

# 8. Request official Let's Encrypt SSL certificate via Certbot
echo -e "${BLUE}[4/4] Requesting official Let's Encrypt SSL certificate for '${DOMAIN_NAME}'...${NC}"
docker compose -f docker-compose.prod.yml run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot ${DOMAIN_ARGS} --email "${LETSENCRYPT_EMAIL}" --rsa-key-size 4096 --agree-tos --non-interactive --force-renewal

# Fix permissions on newly issued Let's Encrypt keys
chmod -R 755 ./certbot/conf
chmod 644 ./certbot/conf/live/"${DOMAIN_NAME}"/*.pem || true

# 9. Reload Nginx to load official Let's Encrypt SSL certificates
echo -e "${BLUE}[✓] Reloading Nginx with official Let's Encrypt SSL certificates...${NC}"
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}   HTTPS / SSL Setup Successful!                   ${NC}"
echo -e "${GREEN}   Your site is now securely available at:          ${NC}"
echo -e "${GREEN}     https://${DOMAIN_NAME}                         ${NC}"
echo -e "${GREEN}=====================================================${NC}"
