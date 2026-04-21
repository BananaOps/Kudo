# ── Stage 1: Frontend build ───────────────────────────────────────────────────
FROM node:25-alpine AS frontend

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ .
RUN npm run build
# → /app/dist/ contains the compiled SPA

# ── Stage 2: Backend build (embeds frontend) ──────────────────────────────────
FROM golang:1.26-bookworm AS backend

WORKDIR /app

# Cache Go modules separately from source.
COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .

# Replace the dev placeholder with the real frontend build.
# go:embed in cmd/api/static.go picks this up automatically.
COPY --from=frontend /app/dist ./cmd/api/dist

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -trimpath -o /bin/kudo ./cmd/api

# ── Stage 3: Run (distroless, rootless) ───────────────────────────────────────
# Single static binary — no shell, no package manager, minimal attack surface.
# Runs as UID 65532 (nonroot) declared by the base image.
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=backend /bin/kudo /kudo

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/kudo"]
