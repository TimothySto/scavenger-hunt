# AWS Deployment Guide

This guide covers deploying the scavenger hunt app to an AWS EC2 instance running Ubuntu, with a local PostgreSQL database, PM2 process management, and optional Nginx + Cloudflare for HTTPS.

---

## Prerequisites

- An AWS EC2 instance (Ubuntu, t2.small or larger recommended)
- A static/Elastic IP assigned to the instance
- Node.js 20+ installed on the server
- A domain name pointed at the instance (optional, required for HTTPS)
- The project repository cloned locally with WSL available on your build machine

---

## 1. Server — Initial Setup

### Install Node.js 20+ via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Close and reopen terminal, then:
nvm install 20
nvm use 20
nvm alias default 20
node -v   # confirm v20.x.x
```

### Install pnpm and PM2

```bash
npm install -g pnpm pm2
```

### Add swap space (required for small instances)

Prevents the server from running out of memory during dependency installation:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

To make swap persistent across reboots:
```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 2. Server — PostgreSQL Setup

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create the database and user:

```bash
sudo -u postgres psql
```

Inside the Postgres prompt:

```sql
CREATE USER scavenger WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE scavenger_hunt OWNER scavenger;
GRANT ALL PRIVILEGES ON DATABASE scavenger_hunt TO scavenger;
\q
```

---

## 3. Build Machine (WSL) — One-time Setup

The app must be built on Linux to ensure Prisma client compatibility. WSL provides a Linux environment on Windows without needing a separate machine.

### Install Node.js in WSL (separate from Windows)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Close and reopen WSL terminal, then:
nvm install 20
nvm use 20
npm install -g pnpm
```

### Copy your EC2 key into WSL home directory

```bash
cp "/mnt/c/Users/YourName/path-to-key.pem" ~/.ssh/your-key.pem
chmod 600 ~/.ssh/your-key.pem
```

---

## 4. First Deploy

### Configure environment on the server

SSH into the server and set up the project directory:

```bash
git clone https://github.com/TimothySto/scavenger-hunt.git
cd scavenger-hunt
cp .env.example .env
```

Run the interactive setup scripts:

```bash
pnpm db-setup          # set DATABASE_URL
pnpm smtp-setup        # configure email for 2FA
pnpm generate-secret   # generate ADMIN_SECRET
pnpm whitelist-add you@yourdomain.com
```

### Build and deploy from WSL

```bash
cd /path/to/scavenger-hunt
pnpm install
pnpm build

rsync -avz --exclude node_modules --exclude .next/cache \
  -e "ssh -i ~/.ssh/your-key.pem" \
  .next package.json pnpm-lock.yaml prisma public src \
  admin@your-ec2-ip:~/scavenger-hunt/
```

### Finalise on the server

```bash
cd ~/scavenger-hunt
pnpm install --prod
pnpm exec prisma migrate deploy
pm2 start "pnpm start" --name scavenger-hunt
pm2 save
pm2 startup   # run the printed command to enable auto-start on reboot
```

---

## 5. Admin Enrolment

Navigate to `http://your-ec2-ip:3000/admin/setup` and create the first admin account. The setup page locks itself out after the first account is created. Additional admin accounts can be added from the admin settings page.

---

## 6. Nginx Reverse Proxy (required for Cloudflare / HTTPS)

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Create site config

```bash
sudo nano /etc/nginx/sites-available/scavenger-hunt
```

Paste the following, replacing `yourdomain.com` with your actual domain:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
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
```

### Enable and start

```bash
sudo ln -s /etc/nginx/sites-available/scavenger-hunt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### AWS security group

Open ports 80 and 443 in your EC2 security group inbound rules (TCP, source 0.0.0.0/0).

---

## 7. Cloudflare SSL

If using Cloudflare as your DNS proxy:

1. In Cloudflare DNS, ensure your domain has an **A record** pointing to your EC2 IP with the **orange cloud (proxied)** enabled
2. Go to **SSL/TLS → Overview** and set the mode to **Full** (not Flexible, not Full Strict)

Your app will then be accessible at `https://yourdomain.com`.

For full end-to-end SSL without Cloudflare:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 8. Subsequent Deploys

```bash
# WSL — build and ship
cd /path/to/scavenger-hunt
pnpm build

rsync -avz --exclude node_modules --exclude .next/cache \
  -e "ssh -i ~/.ssh/your-key.pem" \
  .next package.json pnpm-lock.yaml prisma public src \
  admin@your-ec2-ip:~/scavenger-hunt/

# Server — install, migrate, restart
pnpm install --prod && pnpm exec prisma migrate deploy && pm2 restart scavenger-hunt
```

---

## 9. Useful Server Commands

| Task | Command |
|------|---------|
| View live app logs | `pm2 logs scavenger-hunt` |
| View error logs | `pm2 logs scavenger-hunt --err` |
| Restart app | `pm2 restart scavenger-hunt` |
| Stop app | `pm2 stop scavenger-hunt` |
| Check app status | `pm2 status` |
| Reset admin accounts | `pnpm reset-admin` |
| Add admin email to whitelist | `pnpm whitelist-add email@example.com` |
| Remove admin email from whitelist | `pnpm whitelist-remove email@example.com` |
| Rotate admin secret | `pnpm generate-secret` |
| Test DB connection | `psql "$DATABASE_URL" -c "SELECT 1;"` |

---

## Troubleshooting

**Port already in use on 80**
```bash
sudo fuser -k 80/tcp
sudo systemctl start nginx
```

**`Cannot find module @prisma/client-{hash}`**
The build was not compiled with webpack. Ensure `package.json` has `"build": "next build --webpack"` and rebuild.

**`ERR_REQUIRE_ESM` from Prisma**
Node.js version is too old. Upgrade to Node 20+ using nvm (see step 1).

**App crashes on startup, blank page**
Check PM2 logs: `pm2 logs scavenger-hunt --lines 50`. Usually a missing `.env` value or database connection issue.

**`pnpm install` killed by OS**
The instance is out of memory. Add or increase swap space (see step 1).

**Nginx fails to start — address already in use**
Another process is on port 80. Run `sudo fuser -k 80/tcp` then retry.
