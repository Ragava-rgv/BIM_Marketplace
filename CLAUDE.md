# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MachineBazaar — a B2B marketplace for buying and selling used industrial machinery in India. The full functional/design spec lives in `project_spec.md`; read it before making product decisions, especially §8 ("non-negotiable" business rules) and §7 (frontend routes).

## Repository layout

npm workspaces monorepo:

- `apps/api` — NestJS REST API (PostgreSQL via Prisma)
- `apps/web` — React 19 + Vite + React Router v6 + Tailwind v4 frontend
- `packages/shared` — shared TypeScript types/enums (`UserRole`, `GstStatus`, DTOs, etc.) consumed by both apps as `@machinebazaar/shared`

`packages/shared` is compiled to CommonJS (`tsconfig.json` → `"module": "commonjs"`, no `"type": "module"` in `package.json`). Because it's symlinked into the workspace, Vite must be told to pre-bundle it — `apps/web/vite.config.ts` has `optimizeDeps.include: ['@machinebazaar/shared']`. **Do not remove this** — without it the browser's ES module loader throws `SyntaxError: The requested module ... does not provide an export named 'UserRole'` and the entire frontend fails to load.

## Commands

Run from the repo root unless noted.

```bash
# install (workspaces)
npm install

# run dev servers
npm run dev:api          # NestJS on :3001 (watch mode, ts-node via nest start --watch)
npm run dev:web          # Vite on :5173 (proxies /api and /media to :3001)

# build
npm run build:shared     # must run before building api/web if shared types changed
npm run build:api
npm run build:web

# run the compiled API
node apps/api/dist/src/main   # or: cd apps/api && npm run start:prod (note: that script points at dist/main, not dist/src/main — prefer the explicit path or rebuild via `nest build` which emits to dist/src)
```

API-specific (run from `apps/api`):

```bash
npx prisma migrate dev      # apply/create migrations against DATABASE_URL
npx prisma db seed          # seed admin user + reference data (prisma/seed.ts)
npm run test                # jest unit tests
npm run test:e2e            # jest e2e tests (test/jest-e2e.json)
npx jest path/to.spec.ts    # run a single test file
npm run lint
```

Web-specific (run from `apps/web`):

```bash
npm run build   # tsc -b && vite build — type-checks then bundles
npm run lint
```

Required environment variables for the API are documented in `apps/api/.env.example` (DB connection, JWT secrets, Masters India GST API key, OTP provider key, storage path, admin seed credentials).

## Architecture

### Backend (`apps/api/src`)

NestJS modules, one per domain area: `auth`, `gst`, `listings`, `media`, `messaging`, `transactions`, `certifications`, `loans`, `finance-partners`, `buyback`, `depreciation`, `admin`, plus cross-cutting `common` (guards, decorators, interceptors) and `storage`/`prisma` infrastructure modules.

Key cross-module flows worth understanding before changing business logic:

- **Auth**: phone+OTP for buyers/sellers, email+password for admins. OTPs are *not* sent via SMS in dev — `OtpService.dispatch` logs them as `[DEV OTP] phone=<phone> code=<6digits>` to the console/log file. JWT access+refresh pair; `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.X)` gate endpoints.
- **GST verification**: integrates with the Masters India 7-step verification flow (`gst` module). A user's `gstStatus` must be `ACTIVE` before they can publish a listing (sellers) or submit a loan application (buyers) — this is a non-negotiable gate from the spec, not just a UX nicety.
- **Listings**: sellers create drafts, admin reviews/approves/rejects (`PENDING_REVIEW` → `ACTIVE`/`REJECTED`). `StorageService` + media validation handle uploads (served from `/media`).
- **Messaging**: admin-mediated chat between buyers and sellers. Messages are filtered for contact-info leakage (`bodyRaw` vs `bodyFiltered`); repeated attempts auto-block a conversation (`wasBlocked`). Buyer↔seller contact details stay hidden until a transaction's commission is marked PAID.
- **Transactions/commissions**: `TransactionsService.listForUser(userId, role)` special-cases `UserRole.ADMIN` to return all transactions — the admin "list all" controller endpoint delegates to it rather than duplicating logic. Marking a commission `PAID` is the *only* trigger that releases buyer↔seller contact details (`CONTACT_RELEASED`).
- **Loans/certification**: multi-step buyer financing — Listing → loan application (`DRAFT`) → submit (requires GST `ACTIVE`, triggers an independent certification, moves to `CERT_PENDING`). Certification status transitions are constrained by a `VALID_TRANSITIONS` map on the backend; the admin UI mirrors these constraints client-side.
- **Admin module**: dashboard summary aggregation (`AdminDashboardSummary`), listing review queue, message audit (raw + filtered), commission/contact-release management, certification oversight, finance-partner and depreciation-schedule CRUD.

Currency math uses `Prisma.Decimal` throughout — don't introduce floating-point arithmetic on monetary fields.

### Frontend (`apps/web/src`)

- `router.tsx` — single `createBrowserRouter` config, grouped by layout: `PublicLayout` (marketing pages), `AuthLayout` (login/signup/OTP/admin-login), and three role-scoped groups (`SellerLayout`, `BuyerLayout`, `AdminLayout`) each wrapped in `<ProtectedRoute roles={[...]} />`.
- `lib/auth-context.tsx` — `AuthProvider`/`useAuth`; `authenticate(tokens)` persists the JWT pair and loads `/auth/me`; `api.ts` wires axios with request/response interceptors for bearer-token attachment and silent refresh-token retry on 401.
- `lib/saved-listings.ts` — localStorage-backed buyer bookmarking, keyed per-user.
- `components/ui.tsx` — shared primitives (`Button`, `Field`, `Input`, `Select`, `Textarea`, `EmptyState`, `ErrorBanner`, `SuccessBanner`, `StatusBadge`, etc.). These intentionally have minimal prop surfaces (e.g. no `className` passthrough on banners/empty-states) — wrap in a `<div>` for layout spacing rather than extending the components.
- `components/icons.tsx` — hand-drawn SVG line icons (per the spec: no emoji, no icon-font dependency).
- Design tokens live in `src/index.css` via Tailwind v4's `@theme` (`--color-navy: #0f2544`, `--color-accent: #1a56db`, `--font-sans: "Plus Jakarta Sans"`, `--font-display: "Instrument Serif"`) rather than a `tailwind.config.ts`.

Pages are organized by audience: `pages/public`, `pages/auth`, `pages/buyer`, `pages/seller`, `pages/admin`. Buyer/seller dashboards surface a GST-status nudge banner whenever `gstStatus !== GstStatus.ACTIVE`, consistent with the backend gating rules above.
