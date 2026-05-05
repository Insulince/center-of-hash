# Stage 1: Build the Vite frontend
FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Go binary
FROM golang:1.26-alpine AS backend
WORKDIR /build
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/...

# Stage 3: Minimal runtime image
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend /build/server .
COPY --from=frontend /build/dist ./frontend/dist
EXPOSE 8080
CMD ["./server"]
