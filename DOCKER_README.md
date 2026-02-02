# Docker Setup for RichBoy Application

This guide will help you set up and run the RichBoy application using Docker containers.

## Prerequisites

1. **Install Docker Desktop** (for Mac/Windows) or **Docker Engine** (for Linux)
   - Mac: Download from https://www.docker.com/products/docker-desktop/
   - Windows: Download from https://www.docker.com/products/docker-desktop/
   - Linux: Follow instructions at https://docs.docker.com/engine/install/

2. **Verify Docker Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## Quick Start

1. **Start Docker Desktop** (or ensure Docker daemon is running)

2. **Clone the repository** (if you haven't already)
   ```bash
   git clone <repository-url>
   cd RichBoy
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend (optional, for local development)
   cp frontend/.env.example frontend/.env.local
   ```

4. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

5. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432 (for external connections)
   - Redis: localhost:6379 (for external connections)

## Services Overview

The Docker Compose setup includes:

- **db**: PostgreSQL 15 database
- **redis**: Redis 7 server (for future Celery integration)
- **backend**: Django application with DRF
- **frontend**: Next.js application

## Development Workflow

### Running in Development Mode
```bash
# Start all services with hot reload
docker-compose up

# Or run in background
docker-compose up -d
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete your database data)
docker-compose down -v
```

### Viewing Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Running Commands in Containers
```bash
# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec db psql -U postgres -d richboy_db

# Run Django migrations
docker-compose exec backend python manage.py migrate

# Create Django superuser
docker-compose exec backend python manage.py createsuperuser
```

## Environment Variables

### Backend (.env)
- `SECRET_KEY`: Django secret key
- `DEBUG`: Enable/disable debug mode
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Troubleshooting

### Docker Daemon Not Running
If you see "Cannot connect to the Docker daemon", ensure Docker Desktop is running on your system.

### Port Conflicts
If ports 3000, 8000, 5432, or 6379 are already in use, you can modify them in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port to 3001
```

### Database Connection Issues
If the backend can't connect to the database:
1. Ensure the database service is healthy: `docker-compose logs db`
2. Wait a few moments after starting for the database to be ready
3. Check that the DATABASE_URL environment variable is correct

### Build Issues
If you encounter build errors:
```bash
# Rebuild without cache
docker-compose build --no-cache

# Force rebuild specific service
docker-compose build --no-cache backend
```

## Production Considerations

This setup is optimized for development. For production deployment, consider:

1. Using proper secret management (avoid hardcoded secrets)
2. Setting `DEBUG=False` in production
3. Using persistent volumes for data
4. Implementing proper backup strategies
5. Using HTTPS certificates
6. Implementing proper logging and monitoring

## Database Migrations

When updating the backend Django models:

```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate
```

## Contributing

When making changes to the Docker setup:

1. Test both `docker-compose up --build` and existing local development
2. Update this documentation if you add new services or change configurations
3. Ensure environment variable examples are kept up to date