# Capstone API - Docker Build

This directory contains the Dockerfile for building the Capstone API as a containerized application.

## Architecture

The Dockerfile uses a **multi-stage build** approach to optimize image size and security:

### Stage 1: Builder
- Installs all dependencies (including dev dependencies)
- Copies TypeScript source code
- Compiles TypeScript to JavaScript (outputs to `dist/` folder)
- Final image size: ~500MB (not included in runtime image)

### Stage 2: Runtime
- Starts fresh with a clean Node.js image
- Copies only production dependencies (no dev dependencies)
- Copies only compiled JavaScript output from builder stage
- Final image size: ~150-200MB (optimized for production)

## Building the Image

From the **project root**:

```bash
# Build the image
docker build -f capstone-api/Dockerfile -t capstone-api:latest .

# Build for specific platforms
docker buildx build -f capstone-api/Dockerfile -t capstone-api:latest --platform linux/amd64,linux/arm64 .
```

## Running the Container

```bash
# Run the container
docker run -d \
  --name capstone-api \
  -p 4000:4000 \
  -e PORT=4000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/capstone3 \
  -e JWT_SECRET=your-secret-key \
  -e CLIENT_ORIGIN=http://localhost:5173 \
  capstone-api:latest

# View logs
docker logs -f capstone-api

# Stop the container
docker stop capstone-api

# Remove the container
docker rm capstone-api
```

## Environment Variables

Required environment variables:

- `PORT` - API port (default: 4000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLIENT_ORIGIN` - Frontend origin for CORS (e.g., http://localhost:5173)

## Health Check

The image includes a built-in health check that:
- Runs every 30 seconds
- Has a 3-second timeout
- Waits 10 seconds before first check (start period)
- Retries up to 3 times before marking unhealthy

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' capstone-api
```

## Optimization Details

### Size Reduction
- **Alpine Linux base** (~40MB): Lightweight, minimal attack surface
- **Multi-stage build**: Removes build tools and dev dependencies from runtime image
- Final image: ~150MB (vs ~500MB+ for single-stage)

### Security
- No dev dependencies in runtime (reduces vulnerabilities)
- Non-root user can be added in future iterations
- Minimal attack surface with Alpine Linux

### Performance
- Production dependencies only: Faster startup time
- Compiled JavaScript: No runtime compilation overhead
- Health checks: Enables automatic container restart on failure

## Troubleshooting

### Build fails with TypeScript errors
- Verify `tsconfig.json` is present in project root
- Check that all TypeScript files are in the `src/` directory
- Ensure package.json has TypeScript and required types installed

### Container exits immediately
- Check logs: `docker logs capstone-api`
- Verify environment variables are set correctly
- Ensure MongoDB is accessible from the container

### Health check failing
- Verify the API is running: `docker logs capstone-api`
- Check MONGODB_URI is accessible
- Ensure JWT_SECRET and other env vars are configured
