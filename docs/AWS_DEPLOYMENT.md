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

> **Note:** `node_modules` must be installed in WSL (Linux) even if you have them on Windows — native binaries (e.g. `lightningcss`) are platform-specific. Run `pnpm install` from WSL on first use or after a Windows-only install.

```bash
cd /path/to/scavenger-hunt
pnpm install
pnpm exec prisma generate
pnpm build

rsync -avz --exclude node_modules --exclude .next/cache \
  -e "ssh -i ~/.ssh/your-key.pem" \
  .next package.json pnpm-lock.yaml prisma public src \
  admin@your-ec2-ip:~/scavenger-hunt/
```

### Finalise on the server

Order matters — generate the client before running migrations, migrate before starting the app.

```bash
cd ~/scavenger-hunt
pnpm install --prod --ignore-scripts
pnpm exec prisma generate
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

### Install the Cloudflare Origin Certificate

Before writing the Nginx config you need the SSL certificate files. Get them from Cloudflare (see step 7) and save them on the server:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo nano /etc/nginx/ssl/cloudflare.pem   # paste the certificate
sudo nano /etc/nginx/ssl/cloudflare.key   # paste the private key
sudo chmod 600 /etc/nginx/ssl/cloudflare.key
```

### Create site config

```bash
sudo nano /etc/nginx/sites-available/scavenger-hunt
```

Paste the following, replacing `yourdomain.com` with your actual domain:

```nginx
# Redirect plain HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/cloudflare.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare.key;

    # Required for image uploads (default Nginx limit is 1MB)
    client_max_body_size 10M;

    # Serve uploaded files directly from disk (live, no app restart needed)
    location /uploads/ {
        alias /home/admin/scavenger-hunt/public/uploads/;
    }

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
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/scavenger-hunt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
```

### Grant Nginx read access to the uploads directory

Nginx runs as `www-data`. Home directories are `chmod 700` by default, so you must grant traversal permission on each directory in the path:

```bash
sudo chmod o+x /home/admin
sudo chmod o+x /home/admin/scavenger-hunt
sudo chmod o+x /home/admin/scavenger-hunt/public
sudo chmod o+rx /home/admin/scavenger-hunt/public/uploads
```

> If a new event's images fail to load, run `sudo chmod o+rx /home/admin/scavenger-hunt/public/uploads/<eventId>` for that subdirectory.

### AWS security group

Open ports 80 and 443 in your EC2 security group inbound rules (TCP, source 0.0.0.0/0).

---

## 7. Cloudflare DNS + SSL

### Add your domain to Cloudflare

If your domain was not registered through Cloudflare Registrar:
1. Log in to Cloudflare → **Add a site** → enter domain → select Free plan
2. Cloudflare shows two nameserver hostnames (e.g. `art.ns.cloudflare.com`)
3. At your registrar, replace the existing nameservers with those two
4. Wait for DNS propagation (typically ~15 min, up to 24h)

### DNS records

In Cloudflare → **DNS → Records → Add record**:
- Type: `A` | Name: `@` (or a subdomain like `hunt`) | IPv4: `<server public IP>` | Proxy: **Proxied** (orange cloud ✓)
- Optional `www`: Type: `CNAME` | Name: `www` | Target: `yourdomain.com` | Proxied

### Create a Cloudflare Origin Certificate

A Cloudflare Origin Certificate is a free TLS certificate (valid up to 15 years) issued by Cloudflare and trusted by their edge. It enables **Full** SSL mode without needing Let's Encrypt.

1. Cloudflare dashboard → your domain → **SSL/TLS → Origin Server**
2. Click **Create Certificate**
3. Leave defaults (RSA, covers `yourdomain.com` and `*.yourdomain.com`, 15-year validity)
4. Click **Create**
5. Copy the **Origin Certificate** → paste into `/etc/nginx/ssl/cloudflare.pem` on the server
6. Copy the **Private Key** → paste into `/etc/nginx/ssl/cloudflare.key` on the server

> The private key is shown only once. Save it immediately.

### SSL/TLS mode

In Cloudflare → **SSL/TLS → Overview** → set mode to **Full**:
- **Full** — Cloudflare connects to your origin on port 443 using the Origin Certificate. Required when Nginx listens on 443.
- **Not Flexible** — Cloudflare would connect to origin on port 80; does not work with the HTTPS Nginx config above.
- **Not Full Strict** — requires a publicly trusted CA cert (e.g. Let's Encrypt) on the origin; not needed here.

### Always Use HTTPS

In Cloudflare → **SSL/TLS → Edge Certificates** → enable **Always Use HTTPS**.

Cloudflare redirects all `http://` requests to `https://` at the edge before they reach your server.

### AWS security group

Open ports **80** and **443** in your EC2 security group inbound rules (TCP, source 0.0.0.0/0). Cloudflare connects to origin on port 443 when using Full mode.

---

## 8. Subsequent Deploys

```bash
# WSL — install (for Linux native binaries), generate client, build, ship
cd /path/to/scavenger-hunt
pnpm install
pnpm exec prisma generate
pnpm build

rsync -avz --exclude node_modules --exclude .next/cache \
  -e "ssh -i ~/.ssh/your-key.pem" \
  .next package.json pnpm-lock.yaml prisma public src \
  admin@your-ec2-ip:~/scavenger-hunt/

# Server — install, generate client, migrate, restart (order matters)
pnpm install --prod --ignore-scripts && pnpm exec prisma generate && pnpm exec prisma migrate deploy && pm2 restart scavenger-hunt
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

**`Cannot find module '../lightningcss.linux-x64-gnu.node'` during WSL build**
The `node_modules` were installed on Windows and lack the Linux native binaries. Run `pnpm install` from within WSL to fetch the correct platform binaries, then rebuild.

**`Unknown argument 'order'` (or similar) — Prisma runtime validation error**
The Prisma client on the server is out of sync with the schema. After deploying new code that changes the schema, always run `pnpm exec prisma generate` on the server before restarting the app. Running `migrate deploy` alone is not enough — the client must also be regenerated.

**Cloudflare 521 — Web server is down**
Cloudflare cannot reach the origin on port 443. Check: (1) Nginx is running (`sudo systemctl status nginx`), (2) port 443 is open in the EC2 security group, (3) the SSL certificate and key files exist and are readable, (4) `sudo nginx -t` passes with no errors, (5) SSL/TLS mode in Cloudflare is set to **Full** (not Flexible).
