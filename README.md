<h1 align="center">⚡ Kudo</h1>
<p align="center">
  Slack-native peer recognition app inspired by HeyTaco — give kudos to colleagues with a simple emoji mention.
</p>
<p align="center">
  <img alt="CI" src="https://github.com/BananaOps/Kudo/actions/workflows/ci.yml/badge.svg">
  <img alt="Go" src="https://img.shields.io/badge/Go-1.26-00ADD8?logo=go">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb">
  <img alt="License" src="https://img.shields.io/github/license/BananaOps/Kudo">
</p>

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Slack setup](docs/slack-setup.md)
- [Design system](docs/design-system.md)
- [API endpoints](#api-endpoints)
- [Development](#development)
- [Testing](#testing)
- [Docker](#docker)
- [CI/CD](#cicd)
- [Project structure](#project-structure)

---

## Overview

Kudo lets your Slack workspace recognize teammates by dropping a currency emoji in any message:

```
🌮 @alice great work on the release!
```

- **Give kudos** — mention a colleague + the workspace currency emoji in Slack.
- **Daily quota** — configurable per-workspace allowance (default: 5 per day).
- **Leaderboard** — top receivers at a glance.
- **My kudos** — personal view of kudos received and given.
- **Admin settings** — configure the emoji, currency name, and daily quota.

---

## Architecture

```
┌────────────────────┐     Slack Events / Slash Commands
│   Slack workspace  │ ──────────────────────────────────────────┐
└────────────────────┘                                            │
                                                                  ▼
                                                   ┌─────────────────────────┐
                                                   │  Backend  (Go + net/http)│
                                                   │  :8080                   │
                                                   │  POST /slack/events      │
                                                   │  POST /slack/commands    │
                                                   │  GET  /healthz           │
                                                   │  GET  /api/me/kudos      │
                                                   │  GET  /api/admin/settings│
                                                   │  PUT  /api/admin/settings│
                                                   │  GET  /  (embedded SPA)  │
                                                   └────────────┬────────────┘
                                                                │
                                              ┌─────────────────▼──────────────┐
                                              │         MongoDB 8               │
                                              │  collections: kudos, workspaces │
                                              └────────────────────────────────┘

  The React SPA (built with Vite 8) is embedded inside the Go binary
  via go:embed and served directly by the backend — no separate web server.
```

### Backend packages

| Package | Role |
|---|---|
| `cmd/api` | Entry point — HTTP server, graceful shutdown, embedded SPA |
| `internal/config` | Environment-based configuration |
| `internal/handler` | HTTP handlers (`/healthz`, `/kudos`) |
| `internal/slack` | Slack Events API, slash commands, message parsing |
| `internal/kudos` | Core domain: types, `Service` interface, quota logic, `Repository` interface |
| `internal/workspace` | Workspace settings and `Service` interface |
| `internal/store/mongo` | MongoDB implementations of `kudos.Repository` and `workspace.Service` |

### MongoDB collections

| Collection | Primary key | Compound indexes |
|---|---|---|
| `kudos` | `ObjectID` (auto) | `(workspace_id, from_user_id, created_at)` · `(workspace_id, to_user_id)` · `(workspace_id, from_user_id)` |
| `workspaces` | Slack team ID (string) | — |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Go | ≥ 1.26 | https://go.dev/dl |
| Node.js | ≥ 25 | https://nodejs.org |
| Task | ≥ 3 | https://taskfile.dev |
| Docker | ≥ 24 | https://docs.docker.com/get-docker |
| Docker Compose | v2 | bundled with Docker Desktop |

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/BananaOps/Kudo.git
cd Kudo

# 2. Copy env template and fill in your Slack credentials
cp .env.example .env

# 3. Start MongoDB + the app with Docker Compose
task docker:up
# → http://localhost:8080
```

> **Local dev without Docker**
> ```bash
> # MongoDB must be running locally on port 27017
> task dev          # backend :8080 + frontend :5173 in parallel
> ```

---

## Environment variables

Create a `.env` file at the repo root (copy from `.env.example`, never commit it):

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `8080` | HTTP listen port |
| `MONGODB_URI` | no | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | no | `kudo` | MongoDB database name |
| `SLACK_SIGNING_SECRET` | **yes** | — | Signing secret for verifying Slack webhook requests. Found in your app's **Basic Information** page. |
| `SLACK_BOT_TOKEN` | no | — | Bot OAuth token (`xoxb-…`). Needed only when the bot posts messages back to Slack. Obtained after installing the app to a workspace. |

> See **[docs/slack-setup.md](docs/slack-setup.md)** for a step-by-step guide to creating the Slack app and obtaining these credentials.

---

## API endpoints

### Health

```
GET /healthz
→ 200 { "status": "ok" }
```

### Kudos

```
POST /kudos
Body: { workspace_id, from_user_id, to_user_id, message }
→ 201 { "kudo": { ... } }
→ 422 ErrSelfKudo
→ 429 ErrQuotaExceeded
```

### My kudos

```
GET /api/me/kudos
→ 200 { received: Kudo[], given: Kudo[], stats: { receivedThisWeek, receivedThisMonth, givenThisWeek, givenThisMonth } }
```

### Admin settings

```
GET  /api/admin/settings  → 200 AdminSettings
PUT  /api/admin/settings  Body: AdminSettings → 200 AdminSettings

AdminSettings: { emoji, currencySingular, currencyPlural, dailyAllowance }
```

### Slack integration

```
POST /slack/events    (Events API — URL verification + message events)
POST /slack/commands  (slash commands)
```

### SPA

All unmatched routes serve the embedded React SPA (`index.html` fallback).

---

## Development

### Run everything locally

```bash
task dev
# Starts backend on :8080 and Vite dev server on :5173 concurrently.
# Requires a local MongoDB instance (mongodb://localhost:27017).
```

### Backend

```bash
task backend:run        # go run ./cmd/api
task backend:build      # go build → backend/bin/api
task backend:vet        # go vet ./...
task backend:test       # go test -race ./...
task backend:test:cover # HTML coverage report → backend/coverage.html
```

### Frontend

```bash
task frontend:install   # npm ci
task frontend:dev       # Vite dev server on :5173
task frontend:build     # production build → frontend/dist/
task frontend:test      # Vitest run
task frontend:test:ui   # Vitest browser UI
```

### Combined

```bash
task build   # backend binary + frontend dist
task test    # backend tests + frontend tests
task lint    # go vet + tsc --noEmit
task clean   # remove all build artefacts
```

---

## Testing

```bash
task test          # all suites
task backend:test  # Go only
task frontend:test # Vitest only
```

Current coverage:

| Suite | Cases |
|---|---|
| `internal/handler` | Health · Give kudo (success / quota exceeded / self-kudo / bad body) |
| `internal/kudos` | `CheckQuota` (8 cases) · `RemainingToday` (6 cases) |
| `internal/slack` | `ParseKudo` (16 cases) |
| Frontend – `LeaderboardPage` | 5 |
| Frontend – `MyKudosPage` | 7 |
| Frontend – `AdminSettingsPage` | 14 |

---

## Docker

### Single image (frontend embedded in Go binary)

The production image uses a **3-stage build**:

```
node:25-alpine          ← Stage 1: npm ci + vite build → dist/
        ↓ COPY dist/
golang:1.26-bookworm    ← Stage 2: go:embed dist/ + go build → static binary
        ↓ COPY /bin/kudo
gcr.io/distroless/static-debian12:nonroot  ← Stage 3: final image
```

- **No shell, no package manager** — minimal attack surface.
- **Runs as UID 65532** (`nonroot`) — rootless by default.
- The Go binary embeds the entire SPA and serves it directly over HTTP.

### Build

```bash
task docker:build   # builds kudo:local from the root Dockerfile
```

### Run with Compose

```bash
task docker:up           # build + start MongoDB + app (foreground)
task docker:up:detach    # same, detached
task docker:down         # stop and remove containers
task docker:logs         # follow logs
```

Docker Compose starts:

| Service | Image | Port |
|---|---|---|
| `mongo` | `mongo:8` | `27017` (local only) |
| `app` | `kudo:local` | `8080` |

The `app` service waits for MongoDB to pass its healthcheck before starting.

### Publish

Pushing a tag `v*` (e.g. `v1.2.3`) triggers the CI publish job, which pushes:

```
ghcr.io/bananaops/kudo:v1.2.3
ghcr.io/bananaops/kudo:latest
```

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

| Job | Trigger | Steps |
|---|---|---|
| `backend` | push / PR | `go vet` → `go test -race` → `go build` |
| `frontend` | push / PR | `npm ci` → `tsc --noEmit` → `vitest run` → `vite build` |
| `docker` | after backend + frontend | Build single image (no push) with GHA layer cache |
| `publish` | tag `v*` | Login GHCR → build + push versioned + `latest` tags |

---

## Project structure

```
Kudo/
├── Dockerfile                        # 3-stage build: node → go → distroless
├── docker-compose.yml                # MongoDB + app
├── Taskfile.yml                      # developer tasks
├── .env.example                      # env template
├── .github/
│   └── workflows/ci.yml
├── backend/
│   ├── cmd/api/
│   │   ├── main.go                   # HTTP server, graceful shutdown
│   │   └── static.go                 # go:embed dist/ + SPA handler
│   ├── internal/
│   │   ├── config/                   # env-based config (MONGODB_URI, PORT…)
│   │   ├── handler/                  # HTTP handlers + tests
│   │   ├── kudos/                    # domain types, quota logic, Repository interface
│   │   ├── slack/                    # Events API, message parser + tests
│   │   ├── workspace/                # Workspace type, Service interface, ErrNotFound
│   │   └── store/mongo/              # MongoDB implementations (kudos + workspace)
│   └── go.mod
└── frontend/
    ├── src/
    │   ├── hooks/                    # useMyKudos, useAdminSettings
    │   ├── pages/                    # LeaderboardPage, MyKudosPage, AdminSettingsPage
    │   └── types/                    # shared TypeScript types (Kudo, AdminSettings…)
    └── package.json                  # React 19, Vite 8, TypeScript 6, Tailwind 4
```

---

## License

[MIT](LICENSE) © BananaOps
