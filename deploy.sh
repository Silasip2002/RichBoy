#!/bin/bash

# RichBoy Oracle Cloud Deployment Script
# This script automates the deployment process on Oracle Cloud

set -e  # Exit on any error

echo "🚀 Starting RichBoy deployment on Oracle Cloud..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    print_error ".env.prod file not found. Please copy .env.prod.example to .env.prod and configure it."
    exit 1
fi

# Load environment variables
source .env.prod

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "SECRET_KEY" "DOMAIN_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env.prod"
        exit 1
    fi
done

print_status "Environment variables validated ✓"

# Update domain in nginx configuration
print_status "Updating domain configuration..."
sed -i "s/your-domain.com/${DOMAIN_NAME}/g" nginx/conf.d/default.conf

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    print_warning "SSL certificates not found in nginx/ssl/"
    echo "Please obtain SSL certificates and place them in nginx/ssl/ directory:"
    echo "- fullchain.pem"
    echo "- privkey.pem"
    echo "- chain.pem"
    echo ""
    echo "Or use Let's Encrypt by running:"
    echo "sudo certbot certonly --standalone -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}"
    echo "Then copy certificates to nginx/ssl/"
    exit 1
fi

print_status "SSL certificates found ✓"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build -d

# Wait for containers to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check container health
print_status "Checking container health..."
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Some containers failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

print_status "All containers are running ✓"

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# Collect static files
print_status "Collecting static files..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

print_status "Deployment completed successfully! 🎉"
echo ""
echo "🌐 Your application should be available at:"
echo "   http://${DOMAIN_NAME}"
echo "   https://${DOMAIN_NAME}"
echo ""
echo "📊 To check container status:"
echo "   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "👤 To create Django superuser:"
echo "   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser"