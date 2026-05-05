set shell := ["/bin/bash", "-cu"]
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]
set dotenv-load := true

root_dir := justfile_directory()

# List available recipes
default:
    @just --list

# Enable git hooks
setup:
    git config core.hooksPath .githooks

# Run the Go backend server (port 8080)
backend:
    go run {{ root_dir }}/cmd/server/...

# Install frontend dependencies
install:
    cd {{ root_dir }}/frontend && npm install

# Run the Vite frontend dev server (port 5173) — requires backend running in another terminal
frontend:
    cd {{ root_dir }}/frontend && npm run dev

# Build the frontend for production
build-frontend:
    cd {{ root_dir }}/frontend && npm run build

# Build the Docker image locally
docker-build:
    docker build --platform linux/amd64 -t center-of-hash:local .

# Run the production Docker image locally (mirrors Cloud Run)
docker-run:
    docker run --rm -p 8080:8080 center-of-hash:local

# Compile all Go code (catches errors without running)
compile:
    go build {{ root_dir }}/...

# Run all Go tests
test:
    go test {{ root_dir }}/...
