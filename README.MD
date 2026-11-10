# Shortly

**Make every link count.**

Shortly is a minimalist URL shortener: paste a long URL, get a short link, share it, and see how many times it was clicked. It is a three-tier application (React frontend, Express API, PostgreSQL) that runs entirely in Docker containers on localhost with one command.

Built for the Mid Exam of **COMP6991031 – Cloud Services** (BINUS University, 2026/2027).

| | |
|---|---|
| GitHub | `<repository-url>` |
| Article | `<article-url>` |
| YouTube demo | `<video-url>` |

## Why this project

Long URLs are awkward to share in chats, slides and printed material, and they give no feedback on whether anyone opened them. Shortly solves both with a single core feature: **create a short link that redirects (HTTP 302) and counts clicks.**

I chose it because it is small enough to finish, yet it touches everything a backend / cloud engineer works with: a REST API, a relational database, HTTP semantics (201, 204, 302, 404), input validation, and container orchestration.

**Target users:** students, content creators, digital marketers and anyone who shares links.

## Features

- Shorten an http/https URL into a random 6-character code
- Redirect `/<code>` to the original URL with HTTP 302 and count the click
- List links (newest first) with click counts and total statistics
- Copy a short link to the clipboard; delete a link
- Responsive layout; light and dark mode

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS v4, Lucide React, served by Nginx 1.27 |
| Backend | Node.js 20, Express 5, node-postgres (`pg`), Helmet, express-rate-limit |
| Database | PostgreSQL 16 |
| Containers | Docker, Docker Compose |
| Tools | Adminer (profile `tools`), curl / Postman |

## Architecture

```text
 Browser
    │  http://localhost:8090
    ▼
┌───────────────────────── network: shortly_net (bridge) ─────────────────────────┐
│                                                                                 │
│  ┌──────────────┐   /api/*, /health, /<code>   ┌──────────────┐   SQL :5432   ┌────────────────┐
│  │ web          │ ───────────────────────────▶ │ api          │ ────────────▶ │ db             │
│  │ Nginx :80    │                              │ Express :3000│               │ PostgreSQL     │
│  │ React static │                              │              │               │ :5432          │
│  └──────────────┘                              └──────────────┘               └───────┬────────┘
│   host 8090 → 80                                host 127.0.0.1:3000 → 3000             │
│                                                                                volume: db_data
│  ┌──────────────┐  (profile: tools)                                                    │
│  │ adminer :8080│ ── host 127.0.0.1:8091 ──────────────────────────────────────────────┘
│  └──────────────┘
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **web** serves the built React files. Nginx proxies `/api/*`, `/health` and any short code `/<code>` to `api:3000`, so the browser only talks to one origin.
- **api** validates input, generates codes, records clicks and talks to PostgreSQL by its service name `db` (never `localhost` or an IP).
- **db** stores data in the named volume `db_data`; `database/init.sql` creates the schema on first start.

## Project structure

```text
UTS/
├── backend/
│   ├── src/
│   │   ├── middleware/errors.js     # 404 + error handler (no stack traces to clients)
│   │   ├── routes/urls.js           # GET/POST /api/urls, GET /api/urls/stats, DELETE /api/urls/:id
│   │   ├── routes/redirect.js       # GET /:code → 302
│   │   ├── services/shortCode.js    # random code generation + insert with retry
│   │   ├── app.js  config.js  db.js  errors.js  validation.js  server.js
│   ├── test/unit.test.js            # node:test, runs without a database
│   ├── Dockerfile  .dockerignore  package.json
├── frontend/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/              # Header, UrlForm, UrlResult, StatsOverview, UrlList, CopyButton
│   │   ├── layouts/AppLayout.jsx
│   │   ├── services/                # api.js, theme.jsx, format.js
│   │   ├── App.jsx  main.jsx  index.css
│   ├── index.html  vite.config.js  nginx.conf
│   ├── Dockerfile  .dockerignore  package.json
├── database/init.sql
├── docs/screenshots/
├── compose.yml
├── .env.example
└── README.MD
```

## Database

```sql
CREATE TABLE urls (
    id           SERIAL PRIMARY KEY,
    short_code   VARCHAR(20) NOT NULL UNIQUE,
    original_url TEXT        NOT NULL CHECK (char_length(original_url) <= 2048),
    clicks       INTEGER     NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## API

| Method | Endpoint | Success | Description |
|---|---|---|---|
| GET | `/health` | 200 (503 if DB down) | Health check that also pings the database |
| GET | `/api/urls` | 200 | List shortened URLs |
| GET | `/api/urls/stats` | 200 | Total links and total clicks |
| POST | `/api/urls` | 201 | Create a short URL — body `{"original_url": "https://..."}` |
| DELETE | `/api/urls/:id` | 204 | Delete a short URL (404 if not found) |
| GET | `/:code` | 302 | Redirect to the original URL and add one click |

Invalid input returns **400** (`javascript:`, `ftp:` and other non-http(s) URLs are rejected); too many creates from one IP returns **429**.

```bash
curl -i http://localhost:8090/health
curl -i -X POST http://localhost:8090/api/urls \
     -H "Content-Type: application/json" \
     -d '{"original_url":"https://github.com/"}'
curl -i http://localhost:8090/api/urls
curl -i http://localhost:8090/docker          # 302 → https://docs.docker.com/compose/
```

## How to run (Docker)

Requirements: Docker Engine with the Compose plugin (Docker Desktop, or Docker inside WSL).

```bash
git clone <repository-url> shortly
cd shortly
cp .env.example .env          # then set POSTGRES_PASSWORD
docker compose up -d --build
```

| URL | What |
|---|---|
| http://localhost:8090 | Shortly app |
| http://localhost:8090/health | Health check |
| http://localhost:3000/api/urls | API directly (bound to 127.0.0.1) |
| http://localhost:8091 | Adminer — only with `docker compose --profile tools up -d` |

Useful commands:

```bash
docker compose ps                     # all services up, db (healthy)
docker compose logs -f api
docker compose down                   # stop; data in db_data is kept
docker compose down -v                # stop AND delete the db_data volume (data is lost)
docker images | grep shortly          # image sizes
```

**Persistence test:** create a link → `docker compose down` → `docker compose up -d` → the link is still listed. After `docker compose down -v` the volume is removed, so the database starts again from `init.sql` with only the two sample rows.

### Local development without Docker

```bash
# Terminal 1 — needs a local PostgreSQL with database/init.sql applied
cd backend && npm install
# backend/.env: DB_HOST=localhost DB_USER=... DB_PASSWORD=... DB_NAME=shortly
npm run dev

# Terminal 2
cd frontend && npm install && npm run dev   # http://localhost:5173, /api proxied to :3000
```

Run the backend tests with `cd backend && npm test`.

## Docker notes

- **Multi-stage builds.** The API image installs production dependencies in a `builder` stage and copies only `node_modules` + `src` into the runtime stage. The web image builds React with Node, then copies only the `dist/` folder into `nginx:alpine`; Node, npm and all dev dependencies are left behind. Result: `shortly-web` ≈ 72 MB, `shortly-api` ≈ 197 MB.
- **Pinned base images:** `node:20.18-alpine3.20`, `nginx:1.27.3-alpine`, `postgres:16.4-alpine`, `adminer:4.8.1` — never `latest`.
- **Layer cache:** `package.json` and `package-lock.json` are copied before the source, so `npm ci` is reused until dependencies change.
- **COPY vs ADD:** only `COPY` is used. `ADD` can also download URLs and auto-extract tar files, which is implicit behaviour we don't need.
- **Healthchecks + `depends_on: condition: service_healthy`:** `api` starts only after PostgreSQL answers `pg_isready`; `web` starts only after `/health` succeeds.
- **Secrets:** all credentials come from `.env` (git-ignored). Only `.env.example` with placeholders is committed.

## Security and data privacy

- Only http/https URLs up to 2048 characters are accepted.
- All SQL uses parameterized queries.
- No accounts and no personal data are collected; only URLs, click counts and timestamps are stored. If a submitted URL contains personal data, it falls under Indonesia's Personal Data Protection Law (UU No. 27 Tahun 2022), so links can be deleted at any time.
- Rate limiting on link creation, Helmet security headers, API and Adminer ports bound to 127.0.0.1.
- Sample data is dummy data.

## Screenshots

Put screenshots in `docs/screenshots/` and reference them here:

- `docs/screenshots/app.png` — the app
- `docs/screenshots/compose-ps.png` — `docker compose ps`
- `docs/screenshots/curl.png` — endpoint tests with status codes
- `docs/screenshots/persistence.png` — persistence test
- `docs/screenshots/images.png` — `docker images`

## Credits

Open-source libraries: React, Vite, Tailwind CSS, Lucide, Express, node-postgres, Helmet, express-rate-limit, PostgreSQL, Nginx, Adminer. The project layout follows my earlier course project (Library Admin).

## AI Usage Declaration

AI use type for this exam: **Partial** (max 50% of the work).

| Item | Details |
|---|---|
| Tool | Claude (Anthropic) via Claude Code |
| Parts assisted | Scaffolding of the backend/frontend files following my existing project structure, Dockerfile and compose.yml drafts, README and report draft |
| My own work | Project idea, concept and technology choices, UI direction, running and testing the containers, screenshots, video, article, and understanding/explaining every line of the Dockerfiles and compose.yml |
| Example prompt | "Build the app described in my README.md following the exam PDF, with the same code structure as my Library Admin project, and draft the Word report." |

---

**Shortly** — Make every link count.
