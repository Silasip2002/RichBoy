# RichBoy Oracle Cloud Deployment

Quick deployment guide for Oracle Cloud Infrastructure.

## 🚀 Quick Start

### 1. Provision Oracle Instance
- **Shape**: VM.Standard.E2.2 (2 OCPUs, 16 GB RAM) or higher
- **OS**: Oracle Linux 8 or Ubuntu 20.04/22.04
- **Storage**: 50 GB minimum
- **Network**: Public IP with ports 22, 80, 443 open

### 2. Setup Instance
```bash
# SSH into your instance
ssh -i your-key.pem opc@your-instance-ip

# Update system
sudo dnf update -y  # or sudo apt update && sudo apt upgrade -y for Ubuntu

# Install Docker
sudo dnf install -y docker docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/RichBoy.git
cd RichBoy

# Configure environment
cp .env.prod.example .env.prod
nano .env.prod  # Update with your values

# Get SSL certificates (Let's Encrypt)
sudo dnf install -y certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/chain.pem nginx/ssl/

# Update domain in config
sed -i 's/your-domain.com/your-actual-domain.com/g' nginx/conf.d/default.conf

# Deploy!
./deploy.sh
```

### 4. Configure DNS
- Point your domain A records to the Oracle instance public IP
- Wait for DNS propagation

## 📁 Key Files Created

- `docker-compose.prod.yml` - Production Docker configuration
- `nginx/nginx.conf` - Nginx main configuration
- `nginx/conf.d/default.conf` - Nginx site configuration
- `.env.prod.example` - Production environment template
- `deploy.sh` - Automated deployment script
- `ORACLE_DEPLOYMENT_GUIDE.md` - Detailed deployment guide

## 🔧 Configuration

### Environment Variables (.env.prod)
```bash
# Database
POSTGRES_PASSWORD=your_secure_password
POSTGRES_USER=richboy_user
POSTGRES_DB=richboy_prod

# Django
SECRET_KEY=your_django_secret_key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# SSL
DOMAIN_NAME=your-domain.com
```

### SSL Certificates
Place your SSL certificates in `nginx/ssl/`:
- `fullchain.pem`
- `privkey.pem`
- `chain.pem`

## 🛠️ Management Commands

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update application
git pull
./deploy.sh

# Create Django superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## 🔒 Security

- ✅ HTTPS with SSL/TLS
- ✅ Security headers in Nginx
- ✅ Internal Docker network
- ✅ Strong passwords required
- ✅ CORS protection

## 📊 Monitoring

The deployment includes:
- Health checks on all services
- Container status monitoring
- SSL certificate renewal (manual setup required)
- Database backup scripts (manual setup required)

## 🆘 Troubleshooting

### Containers won't start
```bash
docker-compose -f docker-compose.prod.yml logs
```

### SSL Certificate Issues
- Verify certificates in `nginx/ssl/`
- Check domain in nginx configuration
- Ensure ports 80/443 are open in security list

### Database Connection Issues
- Check database credentials in `.env.prod`
- Verify database container is healthy
- Check network connectivity between containers

## 📈 Scaling

For higher load:
1. Upgrade to larger compute shape
2. Add Oracle Load Balancer
3. Use OCI Block Storage for database
4. Consider OCI Autonomous Database

## 📞 Support

- **Oracle Cloud Documentation**: https://docs.oracle.com/en/cloud/
- **Docker Documentation**: https://docs.docker.com/
- **Application Issues**: Check GitHub Issues

## 🔄 Updates

To update the application:
```bash
git pull
./deploy.sh
```

This will rebuild containers with the latest code and restart services.