# Oracle Cloud Deployment Guide for RichBoy Application

This guide will help you deploy the RichBoy application on Oracle Cloud Infrastructure (OCI) using Docker containers.

## Prerequisites

1. **Oracle Cloud Account** with access to create:
   - Compute instances (VM)
   - Block storage volumes
   - Virtual cloud network (VCN)
   - Internet gateway
   - Security lists/firewall rules

2. **Domain Name** (optional but recommended for HTTPS)
   - Point your domain to the Oracle instance public IP

3. **Local Development Environment**
   - Git installed
   - SSH key pair for Oracle instance access

## Step 1: Provision Oracle Cloud Instance

### 1.1 Create Compute Instance

1. Log in to Oracle Cloud Console
2. Navigate to **Compute** → **Instances**
3. Click **Create Instance**
4. Configure the instance:
   - **Name**: `richboy-prod`
   - **Compartment**: Choose your compartment
   - **Availability Domain**: Choose closest to your users
   - **Instance Type**: **Virtual Machine**
   - **Instance Shape**: **VM.Standard.E2.2** (2 OCPUs, 16 GB RAM) or higher
   - **Boot Volume**: 50 GB (minimum)
   - **SSH Keys**: Upload your public SSH key
   - **Image**: Choose **Oracle Linux 8** or **Ubuntu 20.04/22.04**

### 1.2 Configure Networking

1. In the instance creation wizard, configure networking:
   - **Virtual Cloud Network**: Create new VCN
   - **Subnet**: Public subnet (for internet access)
   - **Assign Public IP**: Yes

### 1.3 Configure Security Lists/Firewall

Add these inbound rules to your security list:

```
# SSH Access
Port: 22
Source: 0.0.0.0/0 (or your IP for better security)

# HTTP Access
Port: 80
Source: 0.0.0.0/0

# HTTPS Access
Port: 443
Source: 0.0.0.0/0

# Docker Swarm (if using cluster)
Port: 2377
Source: 0.0.0.0/0
```

## Step 2: Connect to Oracle Instance

```bash
# SSH into your instance
ssh -i path/to/your/private-key ubuntu@your-oracle-public-ip
# or for Oracle Linux:
ssh -i path/to/your/private-key opc@your-oracle-public-ip
```

## Step 3: Setup the Instance

### 3.1 Update System

```bash
# For Ubuntu
sudo apt update && sudo apt upgrade -y

# For Oracle Linux
sudo dnf update -y
```

### 3.2 Install Required Packages

```bash
# For Ubuntu
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git

# For Oracle Linux
sudo dnf install -y docker docker-compose nginx certbot python3-certbot-nginx git
```

### 3.3 Configure Docker

```bash
# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and log back in for group changes to take effect
exit
# SSH back in
```

## Step 4: Clone and Configure the Application

### 4.1 Clone Repository

```bash
# Clone your repository
git clone https://github.com/your-username/RichBoy.git
cd RichBoy
```

### 4.2 Configure Environment

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Edit the production environment file
nano .env.prod
```

**Important: Update these values in `.env.prod`:**
- `POSTGRES_PASSWORD`: Generate a strong password
- `REDIS_PASSWORD`: Generate a strong password
- `SECRET_KEY`: Generate a Django secret key (use `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
- `ALLOWED_HOSTS`: Add your domain and Oracle instance IP
- `DOMAIN_NAME`: Your actual domain name
- `LETS_ENCRYPT_EMAIL`: Your email for SSL certificates

### 4.3 Update Nginx Configuration

```bash
# Update domain in nginx configuration
sed -i 's/your-domain.com/your-actual-domain.com/g' nginx/conf.d/default.conf
```

## Step 5: Deploy with SSL Certificate

### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot and obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --no-eff-email

# Copy certificates to nginx ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/chain.pem nginx/ssl/

# Set up automatic renewal
sudo crontab -e
# Add this line for renewal:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option B: Use Your Own SSL Certificates

```bash
# Copy your certificates to nginx ssl directory
sudo cp path/to/your/fullchain.pem nginx/ssl/
sudo cp path/to/your/privkey.pem nginx/ssl/
sudo cp path/to/your/chain.pem nginx/ssl/
```

## Step 6: Deploy the Application

### 6.1 Build and Start Containers

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

### 6.2 Check Container Status

```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Check logs for any issues
docker-compose -f docker-compose.prod.yml logs -f
```

### 6.3 Create Django Superuser

```bash
# Access backend container
docker-compose -f docker-compose.prod.yml exec backend bash

# Create superuser
python manage.py createsuperuser

# Exit container
exit
```

## Step 7: Setup Monitoring and Backups

### 7.1 Setup Monitoring Script

Create a monitoring script:

```bash
nano monitor.sh
```

Add this content:

```bash
#!/bin/bash

# Check if all containers are running
containers=("richboy_backend_prod" "richboy_frontend_prod" "richboy_nginx" "richboy_db_prod" "richboy_redis_prod")

for container in "${containers[@]}"; do
    if ! docker ps | grep -q $container; then
        echo "ALERT: $container is not running!"
        # Send alert email or notification here
    fi
done

# Check disk space
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo "ALERT: Disk usage is ${disk_usage}%"
fi
```

Make it executable and add to crontab:

```bash
chmod +x monitor.sh
crontab -e
# Add: */5 * * * * /path/to/RichBoy/monitor.sh
```

### 7.2 Setup Database Backups

Create backup script:

```bash
nano backup.sh
```

Add this content:

```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/richboy_backup_$DATE.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Dump database
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U richboy_user richboy_prod > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make it executable and add to crontab:

```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/RichBoy/backup.sh
```

## Step 8: Configure Domain DNS

1. Go to your domain registrar
2. Add DNS records:
   - **A Record**: `@` → Your Oracle instance public IP
   - **A Record**: `www` → Your Oracle instance public IP
3. Wait for DNS propagation (usually 30 minutes to 24 hours)

## Step 9: Verify Deployment

1. **Check HTTP**: Visit `http://your-domain.com` (should redirect to HTTPS)
2. **Check HTTPS**: Visit `https://your-domain.com`
3. **Check SSL**: Verify certificate is valid
4. **Test Features**:
   - User registration/login
   - Creating accounts/assets
   - Uploading profile pictures
   - All dashboard features

## Troubleshooting

### Common Issues

1. **Containers won't start**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. **Database connection errors**:
   - Check database credentials in `.env.prod`
   - Verify database container is healthy

3. **Nginx SSL errors**:
   - Verify certificate files exist in `nginx/ssl/`
   - Check nginx configuration for correct paths

4. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER .
   sudo chmod -R 755 nginx/ssl/
   ```

### Performance Optimization

1. **Enable Docker BuildKit**:
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Monitor Resource Usage**:
   ```bash
   docker stats
   htop
   ```

3. **Optimize PostgreSQL**:
   Edit `docker-compose.prod.yml` to add PostgreSQL performance settings

## Security Considerations

1. **Regular Updates**: Keep system and containers updated
2. **Firewall**: Restrict SSH access to specific IPs
3. **SSL**: Always use HTTPS in production
4. **Secrets**: Use strong, unique passwords
5. **Backups**: Regular automated backups
6. **Monitoring**: Set up alerts for unusual activity

## Scaling Considerations

For higher traffic, consider:

1. **Oracle Load Balancer**: Distribute traffic across multiple instances
2. **OCI Block Storage**: Larger, faster storage for database
3. **OCI Object Storage**: For media files and backups
4. **Database as a Service**: Use OCI Autonomous Database
5. **Container Registry**: Use OCI Container Registry for images

## Support

- **Oracle Cloud Documentation**: https://docs.oracle.com/en/cloud/
- **Docker Documentation**: https://docs.docker.com/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Django Documentation**: https://docs.djangoproject.com/

This deployment provides a secure, scalable, and maintainable production environment for your RichBoy application on Oracle Cloud Infrastructure.