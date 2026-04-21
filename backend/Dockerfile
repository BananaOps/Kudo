# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM golang:1.26-bookworm AS builder

WORKDIR /app

# Cache dependency download layer separately from source.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Produce a fully static binary — required for distroless/static.
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -trimpath -o /bin/api ./cmd/api

# ── Stage 2: run (distroless, rootless) ───────────────────────────────────────
# gcr.io/distroless/static-debian12:nonroot
#   • No shell, no package manager, no libc — minimal attack surface.
#   • Ships with /etc/passwd declaring UID 65532 ("nonroot").
#   • Works because the Go binary is statically compiled (CGO_ENABLED=0).
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /bin/api /api

# Run as nonroot (UID 65532) — declared by the base image.
USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/api"]
