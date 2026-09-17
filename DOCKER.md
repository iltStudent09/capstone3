# Docker Setup for Capstone3

This project includes Docker support for containerizing both the API and client applications. This guide covers building and running the project with Docker.

## Quick Start

### Prerequisites
- Docker installed (version 20.10+)
- Docker Compose installed (version 1.29+)

### Run Everything with Docker Compose

```bash
# Start all services (MongoDB, API, Client)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# View specific service logs
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f client
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **MongoDB**: localhost:27017

## API Dockerfile (capstone-api/Dockerfile)

### Multi-Stage Build Architecture

**Stage 1: Builder**
- Installs all dependencies (including dev dependencies)
- Compiles TypeScript to JavaScript
- Output: compiled code in `dist/` folder

**Stage 2: Runtime**
- Installs only production dependencies
- Includes compiled code from Stage 1
- Exposes port 4000
- Includes health checks

### Benefits
- **Smaller image size**: ~150MB (vs 500MB+ single-stage)
- **Better security**: No dev dependencies, build tools, or TypeScript compiler in production
- **Faster startup**: Pre-compiled JavaScript, no runtime compilation
- **Improved reliability**: Health checks enable automatic container recovery

### Building Manually

```bash
# Build the API image
docker build -f capstone-api/Dockerfile -t capstone-api:latest .

# Run the API container
docker run -d \
  --name capstone-api \
  -p 4000:4000 \
  -e MONGODB_URI=mongodb://localhost:27017/capstone3 \
  -e JWT_SECRET=your-secret-key \
  -e CLIENT_ORIGIN=http://localhost:5173 \
  capstone-api:latest
```

## Client Dockerfile (capstone-client/Dockerfile)

Multi-stage build for the React frontend:

**Stage 1: Builder**
- Node.js 20 environment
- Installs dependencies
- Builds React production bundle

**Stage 2: Runtime**
- Alpine Linux with Nginx
- Serves compiled React app
- Includes API proxy configuration

### Building Manually

```bash
# Build the client image
docker build -f capstone-client/Dockerfile -t capstone-client:latest ./capstone-client

# Run the client container
docker run -d \
  --name capstone-client \
  -p 80:80 \
  capstone-client:latest
```

## Environment Variables

### API Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 4000 | API server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `CLIENT_ORIGIN` | No | http://localhost:5173 | Frontend URL for CORS |

### Example .env file

```env
PORT=4000
MONGODB_URI=mongodb://mongodb:27017/capstone3
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_ORIGIN=http://localhost:5173
```

## Health Checks

Both services include health checks:

### API Health Check
- Endpoint: `GET /api/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Start period: 10 seconds
- Retries: 3

Check health status:
```bash
docker ps
# Look for the STATUS column - should show "(healthy)" or "(unhealthy)"

# Or use inspect
docker inspect --format='{{.State.Health.Status}}' capstone-api
```

## Docker Compose Services

### mongodb
- Image: `mongo:7.0-alpine`
- Port: 27017
- Volume: `mongodb_data:/data/db` (persistent)
- Health check: MongoDB ping command

### api
- Builds from: `capstone-api/Dockerfile`
- Port: 4000
- Depends on: MongoDB (waits for health check)
- Restart: unless-stopped

### client
- Builds from: `capstone-client/Dockerfile`
- Port: 5173 (mapped to 80 inside container)
- Depends on: API

## Debugging

### View build output
```bash
docker-compose build --no-cache api
```

### Interactive shell in running container
```bash
docker exec -it capstone-api /bin/sh
```

### See container logs
```bash
docker logs capstone-api -f --tail=50
```

### Restart a service
```bash
docker-compose restart api
```

### Rebuild a specific service
```bash
docker-compose up -d --build api
```

## Production Considerations

### Security
1. Change `JWT_SECRET` to a strong random value
2. Use environment-specific `.env` files
3. Don't commit `.env` to version control
4. Use Docker secrets or orchestration platform secrets in production

### Performance
1. Use Alpine Linux images (smaller, faster)
2. Multi-stage builds reduce image size
3. Leverage Docker layer caching
4. Use `.dockerignore` to exclude unnecessary files

### Deployment
1. Push images to a registry (Docker Hub, ECR, GCR, etc.)
2. Use container orchestration (Kubernetes, Docker Swarm, ECS, etc.)
3. Monitor container health and logs
4. Set resource limits for containers
5. Use secrets management for sensitive data

## Cleaning Up

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove unused images
docker image prune -a

# Remove all unused resources
docker system prune -a --volumes
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB container is running and healthy: `docker ps`
- Check `MONGODB_URI` is correct (use `mongodb://mongodb:27017` in Docker Compose)
- Check network connectivity

### "Port already in use"
```bash
# Find what's using the port
lsof -i :4000

# Use a different port in docker-compose.yml
# Change "4000:4000" to "4001:4000"
```

### "Build fails with TypeScript errors"
- Ensure `tsconfig.json` exists in project root
- Check all required dev dependencies are installed
- Rebuild without cache: `docker-compose build --no-cache api`

### "Health check failing"
- Check logs: `docker logs capstone-api`
- Verify MongoDB is accessible: `docker logs mongodb`
- Ensure all env vars are set correctly

### "Client can't connect to API"
- Check `CLIENT_ORIGIN` env var is set correctly in API container
- Verify API container is healthy: `docker ps`
- Check network connectivity between containers
- In docker-compose, use service name: `http://api:4000`

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Docker Images](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
