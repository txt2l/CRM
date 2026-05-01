# ChatroomLM Deployment Guide

This guide covers deploying ChatroomLM on various hosting platforms and environments.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate and apply database migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

### Production Build

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

---

## Deployment Platforms

### Docker (Recommended for Portability)

#### Using Docker Compose

```bash
# Create .env file with your configuration
cp .env.example .env
# Edit .env with your values

# Start the application with MySQL
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:migrate

# View logs
docker-compose logs -f app
```

#### Using Docker Only

```bash
# Build the image
docker build -t chatroomlm:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/chatroomlm \
  -e OAUTH_SERVER_URL=https://api.manus.im \
  -e VITE_APP_ID=your-app-id \
  -e JWT_SECRET=your-secret-key \
  chatroomlm:latest
```

### Railway

1. **Connect Repository**
   - Push code to GitHub
   - Connect your GitHub account to Railway
   - Select the repository

2. **Configure Environment**
   - Go to Variables tab
   - Add all required environment variables from `.env.example`
   - Set `NODE_ENV=production`

3. **Database Setup**
   - Add MySQL plugin from Railway marketplace
   - Copy the generated `DATABASE_URL` to your variables
   - Run migrations after first deploy

4. **Deploy**
   - Railway auto-deploys on push to main branch
   - Monitor logs in the Dashboard

### Heroku

```bash
# Install Heroku CLI
curl https://cli.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create chatroomlm

# Add MySQL add-on
heroku addons:create cleardb:ignite

# Set environment variables
heroku config:set OAUTH_SERVER_URL=https://api.manus.im
heroku config:set VITE_APP_ID=your-app-id
heroku config:set JWT_SECRET=your-secret-key
# ... set other variables

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate
```

### AWS (EC2)

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.micro or larger
   - Allow inbound traffic on ports 80, 443, 3000

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm mysql-server

   # Install Node.js 22
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd chatroomlm
   npm install
   npm run build
   ```

4. **Configure MySQL**
   ```bash
   sudo mysql
   CREATE DATABASE chatroomlm;
   CREATE USER 'chatroomlm'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **Set Environment Variables**
   ```bash
   nano .env
   # Add your configuration
   ```

6. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

7. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start npm --name "chatroomlm" -- start
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt install -y nginx

   sudo nano /etc/nginx/sites-available/chatroomlm
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/chatroomlm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### DigitalOcean App Platform

1. **Connect Repository**
   - Link GitHub account
   - Select repository

2. **Configure App**
   - Set build command: `npm run build`
   - Set run command: `npm start`
   - Set HTTP port: 3000

3. **Add Database**
   - Add MySQL database from DigitalOcean
   - Copy connection string to `DATABASE_URL`

4. **Set Environment Variables**
   - Add all required variables from `.env.example`

5. **Deploy**
   - Click Deploy
   - Monitor build and runtime logs

### Render

1. **Create New Web Service**
   - Connect GitHub repository
   - Select repository and branch

2. **Configure**
   - Environment: Node
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Port: 3000

3. **Add Database**
   - Create MySQL database
   - Copy connection string to `DATABASE_URL`

4. **Environment Variables**
   - Add all required variables

5. **Deploy**
   - Click Deploy
   - Wait for build to complete

---

## Database Setup for Different Platforms

### MySQL 8.0

```bash
# Create database
mysql -u root -p
CREATE DATABASE chatroomlm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatroomlm'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON chatroomlm.* TO 'chatroomlm'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### TiDB Cloud

```bash
# Connection string format
mysql://user:password@host:4000/chatroomlm?ssl=true
```

### AWS RDS

```bash
# Create RDS MySQL instance
# Copy endpoint from AWS console
# Connection string: mysql://user:password@endpoint:3306/chatroomlm
```

---

## SSL/TLS Setup

### Using Let's Encrypt with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check if server is running
curl http://localhost:3000

# Check database connection
npm run check
```

### Logs

```bash
# View application logs
pm2 logs chatroomlm

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# View MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Backups

```bash
# Backup database
mysqldump -u chatroomlm -p chatroomlm > backup.sql

# Restore database
mysql -u chatroomlm -p chatroomlm < backup.sql
```

### Updates

```bash
# Update dependencies
npm update

# Rebuild and restart
npm run build
pm2 restart chatroomlm
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Database Connection Errors

- Verify `DATABASE_URL` format
- Check database server is running
- Verify credentials and permissions
- Check firewall rules

### OAuth Not Working

- Verify `OAUTH_SERVER_URL` is correct
- Check `VITE_APP_ID` matches your OAuth app
- Ensure callback URL is registered in OAuth provider

### Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

---

## Performance Optimization

### Database Optimization

```sql
-- Check indexes
SHOW INDEX FROM messages;
SHOW INDEX FROM activity_logs;

-- Optimize tables
OPTIMIZE TABLE messages;
OPTIMIZE TABLE activity_logs;
```

### Caching

- Enable browser caching in Nginx
- Use CDN for static assets
- Implement Redis for session caching

### Load Balancing

For high-traffic deployments, use:
- Nginx load balancer
- AWS ELB/ALB
- HAProxy

---

## Security Hardening

1. **Firewall Rules**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH Security**
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port

3. **Database Security**
   - Use strong passwords
   - Restrict database access to app server only
   - Enable SSL for database connections

4. **Application Security**
   - Keep dependencies updated
   - Use environment variables for secrets
   - Enable CORS only for trusted domains
   - Implement rate limiting

---

## Support

For deployment issues or questions, please refer to:
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [tRPC Documentation](https://trpc.io/)

