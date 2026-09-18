# Capstone 3

Policy Claims Tracker is a full-stack insurance claims application with:
- an Express + TypeScript API
- a React + Vite client
- MongoDB for storage
- Docker and Kubernetes deployment support

## Project layout

- [capstone-api/](capstone-api/) - API Docker build notes and backend container setup
- [capstone-client/](capstone-client/) - Client Docker build notes and frontend container setup
- [src/](src/) - API source code, models, routes, middleware, and seed data
- [capstone-client/src/](capstone-client/src/) - React client source code
- [k8s/](k8s/) - Kubernetes manifests and kind cluster config
- [DOCKER.md](DOCKER.md) - Docker and Docker Compose deployment guide
- [docker-compose.yml](docker-compose.yml) - Local container stack
- [docker-compose.prod.yml](docker-compose.prod.yml) - Production-oriented compose setup

## What lives where

### API
The backend API is in [src/](src/):
- [src/server.ts](src/server.ts) - server startup and database connection
- [src/routes/](src/routes/) - auth, claims, policies, dashboard, and health routes
- [src/models/](src/models/) - MongoDB schemas
- [src/middleware/](src/middleware/) - auth, validation, and error handling
- [src/seed.ts](src/seed.ts) - demo data seeding

### Client
The frontend is in [capstone-client/src/](capstone-client/src/):
- [capstone-client/src/pages/](capstone-client/src/pages/) - application pages
- [capstone-client/src/components/](capstone-client/src/components/) - shared UI components
- [capstone-client/src/context/](capstone-client/src/context/) - auth state
- [capstone-client/src/api.ts](capstone-client/src/api.ts) - API client setup

### Kubernetes
Kubernetes resources are in [k8s/](k8s/):
- [k8s/namespace.yaml](k8s/namespace.yaml) - app namespace
- [k8s/secrets.yaml](k8s/secrets.yaml) - environment secrets
- [k8s/mongo.yaml](k8s/mongo.yaml) - MongoDB deployment, PVC, and service
- [k8s/api.yaml](k8s/api.yaml) - API deployment and service
- [k8s/client.yaml](k8s/client.yaml) - client deployment and NodePort service
- [k8s/kind-config.yaml](k8s/kind-config.yaml) - kind cluster port mapping

## How to start the app

### Option 1: Run locally with Docker Compose

1. Make sure Docker is running.
2. Start the stack from the project root:

```bash
docker compose up -d --build
```

3. Open the app:
- Client: http://localhost:3000
- API: http://localhost:4000/api/health

### Option 2: Run in Kubernetes with kind

1. Create the kind cluster using [k8s/kind-config.yaml](k8s/kind-config.yaml).
2. Build the images:

```bash
docker build -f capstone-api/Dockerfile -t capstone-api:latest .
docker build -f capstone-client/Dockerfile -t capstone-client:latest .
```

3. Load the images into kind:

```bash
kind load docker-image capstone-api:latest --name policy-claims
kind load docker-image capstone-client:latest --name policy-claims
```

4. Apply the manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/client.yaml
```

5. Open the app:
- Client: http://localhost:30080
- API health: http://localhost:4000/api/health

### Option 3: Run the apps individually

#### API

```bash
npm install
npm run seed
npm run dev
```

#### Client

```bash
cd capstone-client
npm install
npm run dev
```

## Demo login

Use the seeded admin account:
- Email: admin@example.com
- Password: AdminPass123

## Tests

### API tests
From the project root:

```bash
npm test
```

### Client tests
From [capstone-client/](capstone-client/):

```bash
npm test
```

## Notes

- The API expects `JWT_SECRET`, `MONGODB_URI`, `PORT`, and `CLIENT_ORIGIN`.
- The client proxies API calls to the backend in local development.
- The Kubernetes client service expects the API service to be named `api`.
- The project includes seeded data for demo and test use.

## More details

- See [DOCKER.md](DOCKER.md) for Docker-specific guidance.
- See [capstone-api/README.md](capstone-api/README.md) for backend container notes.
- See [capstone-client/README.md](capstone-client/README.md) for frontend container notes.
