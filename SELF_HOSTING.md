# ChatroomLM Self-Hosting Guide

This guide explains how to download, configure, and deploy ChatroomLM on your own server without relying on any external managed platform.

## What You Get

ChatroomLM is a **fully self-contained, production-ready web application** that includes:

- Complete source code (React frontend + Express backend)
- Database schema and migrations (Drizzle ORM)
- All dependencies defined in `package.json`
- Docker configuration for containerized deployment
- Comprehensive deployment guides for various platforms
- No external dependencies beyond your own database and OAuth provider

## System Requirements

### Minimum
- **CPU**: 1 core
- **RAM**: 512 MB
- **Storage**: 1 GB
- **Node.js**: 22.x or later
- **Database**: MySQL 8.0+ or TiDB

### Recommended for Production
- **CPU**: 2+ cores
- **RAM**: 2 GB+
- **Storage**: 10 GB+
- **Node.js**: 22.x LTS
- **Database**: MySQL 8.0+ with replication (for HA)

## Quick Start (5 Minutes)

### 1. Download the Project

```bash
# Clone from GitHub (or extract ZIP)
git clone <your-repository-url>
cd chatroomlm
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (recommended)
npm install -g pnpm
pnpm install
```

### 3. Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit with your settings
nano .env
```

Required variables:
```env
DATABASE_URL=mysql://user:password@localhost:3306/chatroomlm
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-app-id
JWT_SECRET=your-secret-key-min-32-chars
```

### 4. Set Up Database

```bash
# Generate migrations
npm run db:generate

# Apply migrations to your database
npm run db:migrate
```

### 5. Build and Start

```bash
# Build for production
npm run build

# Start the server
npm start
```

The application is now running at `http://localhost:3000`

---

## Detailed Setup Instructions

### Option A: Docker (Easiest)

Docker packages your entire application with all dependencies, making it portable across any system.

```bash
# Build Docker image
docker build -t chatroomlm:latest .

# Run with Docker Compose (includes MySQL)
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:migrate

# Check logs
docker-compose logs -f app
```

Access at `http://localhost:3000`

**Advantages:**
- No dependency conflicts
- Identical behavior across environments
- Easy scaling and orchestration

### Option B: Linux Server (Ubuntu/Debian)

For traditional server deployment:

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install MySQL
sudo apt-get install -y mysql-server

# 3. Create database
sudo mysql -e "CREATE DATABASE chatroomlm CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'chatroomlm'@'localhost' IDENTIFIED BY 'strong_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. Clone and setup
git clone <repository-url>
cd chatroomlm
npm install
npm run build
npm run db:migrate

# 5. Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "chatroomlm" -- start
pm2 save
pm2 startup
```

### Option C: Windows Server

```powershell
# 1. Install Node.js from https://nodejs.org/

# 2. Install MySQL from https://dev.mysql.com/downloads/mysql/

# 3. Create database (in MySQL Command Line)
CREATE DATABASE chatroomlm CHARACTER SET utf8mb4;
CREATE USER 'chatroomlm'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'localhost';
FLUSH PRIVILEGES;

# 4. Clone and setup
git clone <repository-url>
cd chatroomlm
npm install
npm run build
npm run db:migrate

# 5. Start the server
npm start
```

### Option D: macOS (Development/Small Deployment)

```bash
# 1. Install Node.js
brew install node

# 2. Install MySQL
brew install mysql
brew services start mysql

# 3. Create database
mysql -u root -e "CREATE DATABASE chatroomlm CHARACTER SET utf8mb4;"
mysql -u root -e "CREATE USER 'chatroomlm'@'localhost' IDENTIFIED BY 'strong_password';"
mysql -u root -e "GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# 4. Clone and setup
git clone <repository-url>
cd chatroomlm
npm install
npm run build
npm run db:migrate

# 5. Start the server
npm start
```

---

## Configuration

### Environment Variables

Create a `.env` file with these variables:

```env
# ===== REQUIRED =====

# Database connection string
DATABASE_URL=mysql://username:password@host:port/database

# OAuth provider (Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-oauth-app-id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Session encryption (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-minimum-32-characters-long

# ===== OPTIONAL =====

# AI Translation (LLM integration)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Frontend LLM access
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key

# Server settings
NODE_ENV=production
PORT=3000

# Owner information
OWNER_NAME=Administrator
OWNER_OPEN_ID=your-open-id
```

### Database Connection Strings

**Local MySQL:**
```
mysql://root:password@localhost:3306/chatroomlm
```

**Remote MySQL (AWS RDS, DigitalOcean, etc.):**
```
mysql://user:password@host.region.rds.amazonaws.com:3306/chatroomlm
```

**TiDB Cloud:**
```
mysql://user:password@host.tidbcloud.com:4000/chatroomlm?ssl=true
```

---

## Reverse Proxy Setup

For production, use a reverse proxy (Nginx/Apache) to handle SSL and routing:

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

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

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

---

## Database Backup & Restore

### Automated Daily Backups

```bash
#!/bin/bash
# save as backup.sh

BACKUP_DIR="/backups/chatroomlm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="chatroomlm"
DB_USER="chatroomlm"

mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Restore from backup file
gunzip < backup_20260422_020000.sql.gz | mysql -u chatroomlm -p chatroomlm
```

---

## Monitoring & Maintenance

### Health Check

```bash
# Check if application is running
curl http://localhost:3000

# Check database connection
npm run check
```

### View Logs

```bash
# Using PM2
pm2 logs chatroomlm

# Using Docker
docker-compose logs -f app

# Using systemd
journalctl -u chatroomlm -f
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Run migrations if schema changed
npm run db:migrate

# Rebuild
npm run build

# Restart
pm2 restart chatroomlm
# or
docker-compose restart app
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check Node.js version
node --version  # Should be 22.x or later

# Check port availability
lsof -i :3000

# Check environment variables
cat .env

# Run with verbose logging
DEBUG=* npm start
```

### Database Connection Failed

```bash
# Test MySQL connection
mysql -u chatroomlm -p -h localhost chatroomlm

# Verify DATABASE_URL format
echo $DATABASE_URL

# Check MySQL is running
sudo systemctl status mysql
```

### Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Or in PM2
pm2 start npm --name "chatroomlm" -- start --node-args="--max-old-space-size=2048"
```

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

---

## Performance Tuning

### Database Optimization

```sql
-- Check slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Analyze tables
ANALYZE TABLE messages;
ANALYZE TABLE activity_logs;

-- Optimize tables
OPTIMIZE TABLE messages;
OPTIMIZE TABLE activity_logs;
```

### Application Optimization

```bash
# Enable compression in Node.js
npm install compression

# Use clustering for multi-core systems
npm install cluster

# Enable caching
npm install redis
```

### Nginx Caching

```nginx
# Add to Nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=chatroomlm:10m;

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_cache chatroomlm;
    proxy_cache_valid 200 7d;
    expires 7d;
}
```

---

## Security Hardening

### Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL Certificate

```bash
# Using Let's Encrypt (free)
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Database Security

```sql
-- Restrict database access
REVOKE ALL PRIVILEGES ON *.* FROM 'chatroomlm'@'%';
GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'localhost';
FLUSH PRIVILEGES;

-- Enable password expiration
ALTER USER 'chatroomlm'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;
```

---

## Support & Resources

- **Documentation**: See `README.md` and `DEPLOYMENT.md`
- **Issues**: Check GitHub issues or create a new one
- **Community**: Join our Discord/Slack for support
- **Updates**: Watch the repository for new releases

---

## License

ChatroomLM is released under the MIT License. See `LICENSE` file for details.

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Self-Hosting Ready**: ✅ Yes
