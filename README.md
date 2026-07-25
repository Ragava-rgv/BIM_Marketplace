# BIM_Marketplace
BIM marketplace for Machinery 

## Local development

### 1. Postgres

**Option A — Docker** (if you have Docker installed):

```bash
docker compose up -d
```

This starts `postgres:16` on `localhost:5432` with user/password `postgres`/`postgres` and database `machinebazaar`, matching the default `DATABASE_URL` in `apps/api/.env.example`.

**Option B — native Postgres** (no Docker):

1. Install PostgreSQL 16+ (e.g. from [postgresql.org](https://www.postgresql.org/download/)).
2. Create the database: `createdb machinebazaar` (or via `psql -U postgres -c "CREATE DATABASE machinebazaar;"`).
3. Point `DATABASE_URL` in `apps/api/.env` at that instance, e.g.
   `postgresql://postgres:<your-password>@localhost:5432/machinebazaar?schema=public`.

### 2. API environment

Copy `apps/api/.env.example` to `apps/api/.env` and fill in at minimum:

- `DATABASE_URL` — from step 1
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — **required**, the app won't boot without them. Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — credentials for the seeded admin account

Everything else (OTP provider, GST verify, Razorpay, storage) has a working local default — leave blank/placeholder for local dev. OTP codes and GST lookups print to the API console / are stubbed automatically when their key env var is blank (see comments in `.env.example`); Razorpay-dependent payment routes are simply disabled with a startup warning if unconfigured, they don't crash the app.

### 3. Migrate, generate, seed

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### 4. Run

From the repo root:

```bash
npm run dev:api   # NestJS on :3001
npm run dev:web   # Vite on :5173 (proxies /api and /media to :3001)
```
