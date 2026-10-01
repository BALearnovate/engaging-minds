# AWS Lightsail Production Deployment & Custom Domain Guide

This guide details how to run the **Engaging Minds** containerized application on an AWS Lightsail instance using Docker Compose, Nginx reverse proxy, and automated **Let's Encrypt SSL (HTTPS)** for your custom domain.

---

## 1. Lightsail Firewall & DNS Setup

### A. IPv4 Firewall Rules
In the **AWS Lightsail Console**:
1. Select your instance and go to the **Networking** tab.
2. Under **IPv4 Firewall**, ensure the following rules are added:
   - **SSH**: Port `22` (TCP)
   - **HTTP**: Port `80` (TCP) *(Required for ACME challenges & web access)*
   - **HTTPS**: Port `443` (TCP) *(Required for secure SSL web access)*
   *(Ports 3000, 5173, and 5432 should **NOT** be opened to the public internet — Nginx proxies them internally!)*
3. Attach a **Static IP** to your Lightsail instance so your server IP remains permanent.

### B. Configure Custom Domain DNS
At your domain registrar (Route 53, Namecheap, GoDaddy, Cloudflare, etc.):
1. Create an **A Record** for `@` (or `mywebsite.com`) pointing to your **Lightsail Static IP**.
2. Create an **A Record** (or CNAME) for `www` (or `www.mywebsite.com`) pointing to your **Lightsail Static IP**.

---

## 2. Server Prerequisites (One-Time Setup)

SSH into your Lightsail instance:
```bash
ssh debian@<YOUR_LIGHTSAIL_STATIC_IP>
```

### A. Install Docker and Docker Compose Plugin (Debian)

Run the following commands on your Debian Lightsail instance:

```bash
# 1. Update and install prerequisite packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2. Add Docker's official GPG key for Debian
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Add the Docker repository to Apt sources for Debian
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine, CLI, and Docker Compose Plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Enable and start Docker service
sudo systemctl enable --now docker

# 6. Allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### B. Install and Configure AWS CLI
AWS CLI is required so Docker can authenticate and pull private images from Amazon ECR:
```bash
sudo apt-get install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Configure your AWS credentials (IAM user with ECR pull permissions)
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and default region (e.g. eu-west-1)
```

---

## 3. Deploying the Application

### Step 1: Copy Deployment Files to Lightsail
On your Lightsail instance, create a project folder:
```bash
mkdir -p ~/engaging-minds/nginx
cd ~/engaging-minds
```

Copy the following files into `~/engaging-minds`:
- `docker-compose.prod.yml`
- `.env.production.example`
- `deploy-lightsail.sh`
- `init-ssl.sh`
- `nginx/nginx.conf`

Make the scripts executable:
```bash
chmod +x deploy-lightsail.sh init-ssl.sh
```

### Step 2: Configure Environment Variables
Copy the template and edit your `.env`:
```bash
cp .env.production.example .env
nano .env
```
Fill in your details:
- `DOMAIN_NAME`: e.g. `mywebsite.com`
- `LETSENCRYPT_EMAIL`: e.g. `admin@mywebsite.com`
- `ECR_REGISTRY`: e.g. `123456789012.dkr.ecr.eu-west-1.amazonaws.com`
- `AWS_REGION`: e.g. `eu-west-1`
- `POSTGRES_PASSWORD`: Choose a secure password
- `JWT_SECRET`: Choose a secure 32+ character random secret
- `GEMINI_API_KEY`: Your Google Gemini API key

### Step 3: Run the Base Deployment
```bash
./deploy-lightsail.sh
```

The script will automatically:
1. Detect and stop any existing host OS Nginx service so port 80 is freed for Docker.
2. Authenticate Docker with your AWS ECR registry.
3. Pull the latest `engaging-minds-backend` and `engaging-minds-frontend` images.
4. Launch PostgreSQL, NestJS Backend, React Frontend, Nginx, and Certbot.

---

## 4. Enabling HTTPS / Free Let's Encrypt SSL

Once your domain DNS A Records point to your Lightsail Static IP and `./deploy-lightsail.sh` has executed successfully:

Run the automated SSL initialization script:
```bash
./init-ssl.sh
```

The script will:
1. Obtain an official 4096-bit **Let's Encrypt SSL Certificate** for `mywebsite.com` and `www.mywebsite.com`.
2. Update Nginx to serve HTTPS on Port 443 with TLS 1.2/1.3 security.
3. Redirect all HTTP traffic (Port 80) to HTTPS (Port 443).
4. Auto-renew certificates in the background every 12 hours via the `certbot` container.

---

## 5. Verification

1. Open your browser and navigate to:
   ```
   https://mywebsite.com
   ```
2. You will see a green padlock and your live **Engaging Minds** application!
3. All API routes, WebSocket connections (`wss://`), and static assets are proxied over SSL through Port 443.

---

## 6. Maintenance & Useful Commands

- **View Live Logs**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  # Or specific service:
  docker compose -f docker-compose.prod.yml logs -f backend
  ```

- **Update Application to Latest ECR Images**:
  Whenever GitHub Actions finishes pushing new images to ECR, simply run:
  ```bash
  ./deploy-lightsail.sh
  ```

- **Check SSL Renewal Status**:
  ```bash
  docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run
  ```
