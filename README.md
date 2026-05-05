# Center of Hash

A 3D visualization of Bitcoin's global hashrate distribution over time. Watch the geographic "center of mass" of mining power shift as countries rise and fall — most dramatically when China banned mining in mid-2021.

**Live:** [center-of-hash.reus.now](https://center-of-hash.reus.now)

## Local Development

Requires Go 1.26+ and Node 22+.

**Terminal 1 — backend:**
```bash
just backend
# Listening on :8080
```

**Terminal 2 — frontend:**
```bash
just frontend
# http://localhost:5173
```

The Vite dev server proxies `/api` to `:8080`, so both need to be running.

## Data

Hashrate geography data from the [Cambridge Centre for Alternative Finance (CCAF)](https://ccaf.io/cbeci/mining-map), embedded as a static snapshot (Sept 2019–Dec 2021). The embedded dataset (`internal/ccaf/ccaf.json`) is derived from CCAF's mining map and is used under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## Stack

- **Backend:** Go, stdlib HTTP server, embedded CCAF hashrate data
- **Frontend:** React, Three.js (`@react-three/fiber`), Tailwind CSS, Vite
- **Deploy:** Docker (multi-stage), Cloud Run, GitHub Actions on `master` push
