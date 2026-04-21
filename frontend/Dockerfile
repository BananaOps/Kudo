# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:25-alpine AS builder

WORKDIR /app

# Separate dependency install from source copy for layer caching.
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build
# dist/ is now ready

# ── Stage 2: serve (rootless nginx) ───────────────────────────────────────────
# nginxinc/nginx-unprivileged runs as UID 101 (non-root) out of the box.
# alpine-slim has no shell — closest to distroless available for nginx.
# If you need a fully distroless image, embed a Go static-file server and use
# gcr.io/distroless/static-debian12:nonroot instead.
FROM nginxinc/nginx-unprivileged:alpine-slim

# Copy the production build.
COPY --from=builder /app/dist /usr/share/nginx/html

# Override the default server block with SPA-aware config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 8080 — nginx-unprivileged listens on 8080 by default (non-privileged).
EXPOSE 8080
