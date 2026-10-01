#!/usr/bin/env bash
# ==============================================================================
# Engaging Minds - Automated AWS Lightsail Production Deployment Script
# ==============================================================================
set -euo pipefail

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   Engaging Minds - AWS Lightsail Deployment        ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# 1. Verify .env file presence
if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] .env file not found!${NC}"
    echo -e "${YELLOW}Please create your .env file from .env.production.example:${NC}"
    echo -e "  cp .env.production.example .env"
    echo -e "Then fill in your ECR_REGISTRY, AWS_REGION, and secrets before deploying."
    exit 1
fi

# 2. Source environment variables
set -a
# shellcheck disable=SC1091
source .env
set +a

# 3. Check for host Nginx conflict and stop host Nginx service if active
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        echo -e "${YELLOW}[!] Host Nginx service is currently active and occupying port 80.${NC}"
        echo -e "${YELLOW}[!] Stopping and disabling host Nginx to allow Docker Nginx container on port 80...${NC}"
        sudo systemctl stop nginx || true
        sudo systemctl disable nginx || true
        echo -e "${GREEN}[✓] Host Nginx stopped.${NC}"
    fi
fi

# 4. Verify Docker and AWS CLI prerequisites
command -v docker >/dev/null 2>&1 || { echo -e "${RED}[ERROR] Docker is not installed. Please install Docker first.${NC}"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}[ERROR] AWS CLI is not installed. Please install AWS CLI first.${NC}"; exit 1; }

# 5. Authenticate Docker with Amazon ECR
echo -e "${BLUE}[1/4] Authenticating with AWS ECR in region '${AWS_REGION:-eu-west-1}'...${NC}"
aws ecr get-login-password --region "${AWS_REGION:-eu-west-1}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
echo -e "${GREEN}[✓] Successfully logged in to Amazon ECR.${NC}"

# 6. Pull latest production images from ECR
echo -e "${BLUE}[2/4] Pulling latest production images from ECR...${NC}"
docker compose -f docker-compose.prod.yml pull
echo -e "${GREEN}[✓] Latest images pulled.${NC}"

# 7. Start containers in detached mode
echo -e "${BLUE}[3/4] Launching Docker Compose production stack...${NC}"
docker compose -f docker-compose.prod.yml up -d --remove-orphans
echo -e "${GREEN}[✓] Containers launched.${NC}"

# 8. Check Container Status
echo -e "${BLUE}[4/4] Verifying container health...${NC}"
sleep 3
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}   Deployment Complete!                             ${NC}"
echo -e "${GREEN}   Access your application at: http://<LIGHTSAIL_IP>${NC}"
echo -e "${GREEN}=====================================================${NC}"

