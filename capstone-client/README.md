# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Docker

This project includes Docker support for containerizing the React client application.

### Multi-stage Dockerfile

The `Dockerfile` uses a multi-stage build for optimization:

**Stage 1: Builder**
- Node.js 20 Alpine environment
- Installs dependencies
- Runs `npm run build` (Vite)
- Output: optimized production bundle in `/build/dist/`

**Stage 2: Runtime**
- Nginx Alpine image (~25MB)
- Copies built assets from builder
- Copies custom nginx.conf for SPA routing and API proxy
- Exposes port 80

### Building the Image

From **project root**:

```bash
# Build the client image
docker build -f capstone-client/Dockerfile -t capstone-client:latest .

# Run the container
docker run -d -p 80:80 capstone-client:latest
```

### Using Docker Compose

```bash
# From project root
docker-compose up -d client

# View logs
docker-compose logs -f client

# Access at http://localhost:5173
```

### Nginx Configuration

The included `nginx.conf` handles:

- **SPA Routing**: Serves index.html for all non-file routes (React Router support)
- **API Proxying**: Routes `/api/*` requests to backend at `http://api:4000`
- **Compression**: Gzip compression for faster asset delivery
- **Caching**: 
  - Static assets (JS, CSS): 1 year cache
  - HTML: 1 hour cache
  - API: No cache (always fresh)
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.

### Image Size

- **Builder Stage**: ~200MB (not in final image)
- **Runtime Stage**: ~40-50MB total
  - Nginx Alpine: ~25MB
  - Built assets: ~15-25MB

### Environment Variables

To use an external API instead of `http://api:4000`, edit `nginx.conf`:

```nginx
# Change this line in location /api/ block:
proxy_pass http://api:4000;

# To:
proxy_pass http://your-api-domain.com;
```

Then rebuild the image.

### Troubleshooting

**Build fails with npm errors:**
```bash
npm ci
rm -rf dist node_modules/.vite
docker build -f capstone-client/Dockerfile --no-cache -t capstone-client:latest .
```

**Container won't start:**
```bash
docker logs capstone-client
```

**Can't reach API:**
- Ensure API service is running
- Verify `http://api:4000` is accessible from container network
- Check nginx logs: `docker logs capstone-client`

**Blank page or 404s:**
- Check Vite build succeeded: `ls -la capstone-client/dist/`
- Verify nginx is serving files correctly
- Check browser console for errors
