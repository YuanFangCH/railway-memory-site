# Railway Memory Site

Railway Memory Site is an open-source content platform for railway history and
cultural collections. It provides public pages, an admin workspace, media
storage, full-text search, and optional integration with a separately deployed
web guide agent.

The repository contains no production articles, images, videos, users, database
dumps, model keys, or certificates. A fresh installation starts with an empty
content database and one administrator created from environment variables.

## Features

- Next.js 16 App Router, React 19, and TypeScript
- Public article, image, video, category, tag, and search pages
- Admin management for posts, images, videos, accounts, media, and site settings
- PostgreSQL 16 with Prisma
- Auth.js credentials with bcrypt password hashes
- Local media storage or MinIO / S3-compatible object storage
- Docker Compose deployment with an HTTP reverse proxy
- Optional export and short-lived write APIs for the companion guide agent

## Quick Start With Docker

1. Copy `.env.example` to `.env`.
2. Replace every `replace-with-*` value and set a strong `ADMIN_PASSWORD`.
3. Start the stack.

```bash
docker compose up -d --build
```

Open `http://localhost/` and sign in at `/admin` with the configured
`ADMIN_USERNAME` and `ADMIN_PASSWORD`.

The database is intentionally empty after the first start. The seed creates or
updates only the administrator and the site settings; it does not create sample
posts, images, categories, or tags.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Required environment variables include:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SITE_NAME`
- `SITE_URL`

See `.env.example` for the full list and for optional guide-agent integration.

## Guide Agent Integration

The website can expose published content to a separately deployed agent:

- `GUIDE_AGENT_EXPORT_TOKEN` protects the read-only export API.
- `GUIDE_AGENT_WRITE_ADMIN_TOKEN` protects short-lived draft or publish sessions.
- `GUIDE_AGENT_ACCOUNT_SYNC_*` keeps website and agent accounts aligned.
- `GUIDE_AGENT_WIDGET_ENABLED=true` loads the public helper widget.

The agent repository is independent and is not required for the website to
start or serve content.

## Data and Media

Local development uses `./storage/media` when `STORAGE_DRIVER=local`.
Production Compose uses the `railway-media` S3 bucket. Uploaded media and
database volumes are runtime data and are excluded from Git.

The included digital-human builder expects a user-supplied PSD. Character layer
files are not distributed with this repository.

## Quality Checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## License

MIT. See [LICENSE](LICENSE).
