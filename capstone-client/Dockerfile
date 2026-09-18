# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY capstone-client/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY capstone-client ./

# Build the React app with Vite
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

# Copy custom nginx configuration
COPY capstone-client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /build/dist /usr/share/nginx/html

# Create nginx cache and log directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
