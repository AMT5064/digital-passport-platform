# Deployment Guide

Deploy the Digital Passport Event Engagement Platform to production.

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups setup
- [ ] SSL/TLS certificates obtained
- [ ] Domain name configured
- [ ] Docker image built and tested
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Monitoring and logging configured

## Deployment Options

### Option 1: VPS with Docker (Recommended)

Perfect for: Small to medium events (up to 5,000 concurrent users)

#### Prerequisites
- Linux VPS (Ubuntu 22.04+)
- Docker & Docker Compose installed
- Domain name pointing to VPS IP
- 4GB+ RAM, 20GB+ storage

#### Steps

1. **Connect to VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Clone repository:**
   ```bash
   git clone <repo-url> /opt/digital-passport
   cd /opt/digital-passport
   ```

4. **Create production environment file:**
   ```bash
   sudo nano .env.production
   ```

   ```env
   DATABASE_URL=postgresql://postgres:strong_password@postgres:5432/digital_passport
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NODE_ENV=production
   ```

5. **Create production Docker Compose file:**
   ```bash
   sudo nano docker-compose.prod.yml
   ```

   (Use the provided docker-compose.prod.yml as reference)

6. **Configure reverse proxy (nginx):**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

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
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

8. **Build and deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

9. **Verify deployment:**
   ```bash
   curl https://yourdomain.com
   docker-compose logs app
   ```

### Option 2: Cloud Platforms

#### AWS ECS

1. **Build and push image to ECR:**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin [account-id].dkr.ecr.[region].amazonaws.com
   docker build -t digital-passport .
   docker tag digital-passport:latest [account-id].dkr.ecr.[region].amazonaws.com/digital-passport:latest
   docker push [account-id].dkr.ecr.[region].amazonaws.com/digital-passport:latest
   ```

2. **Setup RDS PostgreSQL:**
   - Create RDS PostgreSQL instance
   - Note the endpoint and credentials
   - Update DATABASE_URL

3. **Create ECS cluster:**
   - Navigate to ECS console
   - Create cluster
   - Launch task using Docker image

4. **Setup load balancer:**
   - Configure Application Load Balancer
   - Route traffic to ECS tasks

#### Google Cloud Run

1. **Build image:**
   ```bash
   gcloud builds submit --tag gcr.io/[project-id]/digital-passport
   ```

2. **Deploy:**
   ```bash
   gcloud run deploy digital-passport \
     --image gcr.io/[project-id]/digital-passport \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=[connection-string]
   ```

3. **Setup Cloud SQL:**
   - Create PostgreSQL instance
   - Configure connection
   - Update DATABASE_URL

#### DigitalOcean App Platform

1. **Connect Git repository**
2. **Configure environment variables**
3. **Add database component**
4. **Deploy app**

### Option 3: Traditional Server Deployment

#### Manual Node.js Deployment

1. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PostgreSQL:**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

3. **Clone and setup:**
   ```bash
   git clone <repo-url> /opt/digital-passport
   cd /opt/digital-passport
   npm ci
   npm run build
   ```

4. **Setup PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "digital-passport" -- start
   pm2 startup
   pm2 save
   ```

5. **Configure nginx as reverse proxy**

6. **Setup SSL certificates**

## Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://user:password@db-host:5432/digital_passport

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Environment
NODE_ENV=production

# Optional: Email service
RESEND_API_KEY=your-resend-api-key

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Database Backup Strategy

### Automated Backups (PostgreSQL)

```bash
# Create backup script
cat > /home/user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres digital_passport | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

# Make executable
chmod +x /home/user/backup-db.sh

# Schedule with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

## Monitoring & Logging

### Application Monitoring

1. **PM2 Monitoring (if using PM2):**
   ```bash
   pm2 web  # Opens web dashboard at http://localhost:9615
   ```

2. **Docker Logs:**
   ```bash
   docker logs -f digital-passport-app
   ```

3. **Sentry Integration:**
   - Sign up at https://sentry.io
   - Add SENTRY_DSN to environment
   - Monitor errors in real-time

### Database Monitoring

```bash
# Monitor PostgreSQL connections
psql -U postgres -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# Check disk usage
df -h /var/lib/postgresql
```

### System Monitoring

1. **Install monitoring tools:**
   ```bash
   apt-get install htop iotop nethogs
   ```

2. **Monitor resource usage:**
   ```bash
   htop  # CPU and memory
   iotop # Disk I/O
   nethogs # Network usage
   ```

## Performance Optimization

### Caching Strategy

```bash
# Install Redis
apt-get install redis-server

# Configure in app for session caching and leaderboard
```

### Database Optimization

```sql
-- Create indexes on frequently queried columns (already in schema.prisma)

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Load Balancing

For high traffic events (1000+ concurrent users):

1. **Setup multiple app instances:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale app=3
   ```

2. **Configure load balancer:**
   - nginx
   - HAProxy
   - Cloud load balancer

## Security Hardening

### SSL/TLS Configuration

```nginx
# Use strong SSL protocols and ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Rate Limiting

```nginx
# Configure in nginx
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

location /api/ {
    limit_req zone=api burst=50;
    proxy_pass http://localhost:3000;
}
```

### Database Security

```sql
-- Create dedicated user with limited permissions
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE digital_passport TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
```

### Firewall Rules

```bash
# UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Maintenance

### Regular Maintenance Tasks

```bash
# Weekly: Check disk space
df -h

# Weekly: Review logs
journalctl -u docker.service --since "7 days ago"

# Monthly: Update packages
apt-get update && apt-get upgrade

# Monthly: Database optimization
VACUUM ANALYZE;
```

### Updating Application

```bash
# Pull latest code
git pull origin main

# Build new image
docker build -t digital-passport:latest .

# Stop old container
docker-compose down

# Start new container
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### High Memory Usage

```bash
# Check memory-heavy processes
ps aux --sort=-%mem | head -20

# Docker: Check container stats
docker stats
```

### Database Performance

```sql
-- Check table sizes
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Connection Issues

```bash
# Test database connection
psql -h db-host -U postgres -d digital_passport -c "SELECT 1"

# Check application logs
docker logs digital-passport-app

# Verify environment variables
docker exec digital-passport-app env | grep DATABASE_URL
```

## Scaling for Large Events

### For 1,000+ concurrent users:

1. **Horizontal Scaling:**
   - Deploy multiple app instances
   - Use load balancer

2. **Database Optimization:**
   - Connection pooling (PgBouncer)
   - Read replicas
   - Caching layer (Redis)

3. **Content Delivery:**
   - CloudFront/CDN for static assets
   - Optimize images

4. **Monitoring:**
   - Set up alerts
   - Real-time dashboards

## Backup & Disaster Recovery

### Regular Backups

```bash
# Automated daily backups
0 2 * * * pg_dump -h localhost -U postgres digital_passport | gzip > /backups/$(date +\%Y\%m\%d).sql.gz

# Off-site backup
*/4 * * * * aws s3 sync /backups s3://your-bucket/backups/
```

### Recovery Procedure

```bash
# Restore from backup
gunzip < backup.sql.gz | psql -U postgres digital_passport
```

## Post-Deployment Testing

1. **Smoke Tests:**
   ```bash
   curl https://yourdomain.com
   curl https://yourdomain.com/api/leaderboard?eventId=event-1
   ```

2. **Load Testing:**
   ```bash
   # Using Apache Bench
   ab -n 1000 -c 100 https://yourdomain.com
   ```

3. **Functional Testing:**
   - Test all major features
   - Test QR scanning flow
   - Test leaderboard updates
   - Test admin functions

## Support & Monitoring URLs

- Application: https://yourdomain.com
- API: https://yourdomain.com/api
- Admin: https://yourdomain.com/admin
- Logs: Docker logs or application monitoring service

---

**Deployment Complete!** Your Digital Passport platform is now live.
