# Center of Hash — Claude Context

## What this is

A 3D visualization of Bitcoin's global hashrate geographic distribution over time, using CCAF (Cambridge Centre for Alternative Finance) data. The "centroid" is the hashrate-weighted center of mass of all mining regions — it moves visibly when major countries enter or exit the network (most dramatically: China's ban in mid-2021).

## Project structure

```
cmd/server/          Go HTTP server entrypoint
internal/
  api/               HTTP handlers (/api/snapshots, /api/snapshots/latest)
  ccaf/              CCAF data parsing and centroid computation
  data/              Embedded CSV data files
frontend/
  src/
    components/      React components (Globe, HUD, panels)
    hooks/           Data fetching hooks (useSnapshots)
    scene/           Three.js scene setup
  vite.config.ts     Dev proxy: /api → localhost:8080
Dockerfile           Multi-stage: Node → Go → alpine runtime
justfile             Task runner
```

## Running locally

Two terminals required:

```bash
# Terminal 1
just backend        # Go server on :8080

# Terminal 2
just frontend       # Vite dev server on :5173
```

Navigate to `http://localhost:5173`. The Vite dev proxy forwards `/api` calls to `:8080`.

To simulate the production Docker image locally:
```bash
just docker-build
just docker-run     # → http://localhost:8080
```

## Architecture notes

**Static file serving:** The Go server checks for `frontend/dist` at startup with a relative path (`os.Stat("frontend/dist")`). In the Docker image, the binary lives at `/app/server` and the dist is at `/app/frontend/dist`, satisfying this check. In local dev, the dist directory is absent so the server only runs the API, and Vite serves the frontend.

**API calls:** The frontend uses root-relative paths (`fetch('/api/snapshots')`). This means the app must always be served from the root of its domain — a subpath deployment like `reus.now/center-of-hash` would break this without code changes.

**Embedded data:** CCAF hashrate data is compiled into the binary via `go:embed`. No external data source at runtime.

**CORS:** Set to `*` in handlers — safe since there are no authenticated endpoints.

## Deployment

- **Service:** Cloud Run (`center-of-hash`, `us-central1`, project `reus-now`)
- **Domain:** `center-of-hash.reus.now` (Cloud Run domain mapping)
- **CI/CD:** Push to `master` → GitHub Actions builds Docker image, pushes to Artifact Registry (`us-central1-docker.pkg.dev/reus-now/center-of-hash/center-of-hash`), deploys to Cloud Run
- **Auth:** Workload Identity Federation — no stored secrets in GitHub

## Key constraints

- Go version: 1.26 (see `go.mod` and `Dockerfile`)
- The Docker build uses `--platform linux/amd64` for Cloud Run compatibility
- `frontend/node_modules` and `frontend/dist` are in `.dockerignore` — the Docker build runs `npm ci` and `npm run build` inside the container
