# MachineBazaar — Build Specification

> **For:** Claude Code
> **Goal:** Scaffold and build the full codebase for MachineBazaar, a B2B used-industrial-machinery marketplace for India.
> **How to use this file:** Read top to bottom. Build the monorepo structure first, then the database schema, then backend modules, then the frontend. Honor every business rule in the "Business Rules" section — these are non-negotiable and several are deliberate design decisions, not bugs.

---

## 1. Product Overview

MachineBazaar is a marketplace where businesses buy and sell **used industrial machinery** in India. Revenue comes from three pillars plus a referral stream:

1. **Marketplace** — buyers and sellers transact; the platform takes a **2% commission, split 1% buyer + 1% seller**.
2. **Certification engine** — a machine inspection/certification report. **Triggered ONLY when a buyer applies for a bank loan** (NOT for every listing). Fees vary by machine complexity.
3. **Buyback programme** — backed by a **published depreciation schedule** derived from the founder's domain expertise.
4. **Finance referral commissions** — earned from bank/NBFC partners when buyers are referred for financing.

**Competitive moat:** The founder's 35 years of industrial-machinery expertise is why **banks accept platform certification reports**. Certification credibility must be protected and never diluted.

---

## 2. User Roles

| Role | Registration | GST requirement |
|------|--------------|-----------------|
| **Seller** | Public signup | **GST mandatory** to list any machine |
| **Buyer** | Public signup | GST **optional** at signup; **required only when applying for a loan** |
| **Admin** | **No public registration.** Email + password, seeded/created internally only | N/A |

---

## 3. Tech Stack (use exactly this)

- **Frontend:** React (Vite) + React Router v6 + Tailwind CSS
- **Backend:** NestJS + PostgreSQL 16
- **ORM:** Prisma (or TypeORM if Prisma is unsuitable — prefer Prisma)
- **Storage:** Local disk storage (see §9 for path config). **Designed to swap to AWS S3 later with no schema changes** — just swap the storage service implementation.
- **Auth:** JWT (access + refresh) + OTP for phone verification
- **GST verification:** Masters India API
- **Monorepo:** organize as `/apps/web` (React + Vite) and `/apps/api` (NestJS), shared types in `/packages/shared`

---

## 4. Design System (frontend must follow exactly)

- **Background:** white. **No dark themes anywhere.**
- **Colors:** dark navy `#0F2544` (primary), blue accent `#1A56DB`.
- **Fonts:** `Plus Jakarta Sans` (UI/body), `Instrument Serif` (display/headings).
- **Icons:** SVG line icons only.
- **No emojis** anywhere in the UI.
- **Ticker bar:** a navy bar showing live/recent listings, scrolling.
- Aesthetic is **professional and conservative**. Clean typography, generous whitespace.

---

## 5. Database Schema

Build these tables (Postgres 16). Names are guidance; keep relations and constraints.

### users
- `id` (uuid, pk)
- `role` (enum: `SELLER`, `BUYER`, `ADMIN`)
- `email` (unique, nullable for buyers who sign up by phone)
- `phone` (unique)
- `password_hash` (used by ADMIN; buyers/sellers use OTP-first but may set a password)
- `full_name`
- `phone_verified` (bool)
- `gst_number` (nullable; **required for sellers**, required for buyers only before a loan application)
- `business_name` (auto-filled from GST verification)
- `gst_status` (enum: `UNVERIFIED`, `ACTIVE`, `INACTIVE`)
- `created_at`, `updated_at`

### listings
- `id` (uuid, pk)
- `seller_id` (fk → users)
- `title`, `description`
- `machine_category`, `machine_make`, `machine_model`, `manufacture_year`
- `asking_price` (numeric)
- `location_city`, `location_state`
- `status` (enum: `DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `UNDER_OFFER`, `SOLD`, `REJECTED`, `WITHDRAWN`)
- `complexity_tier` (enum: `SIMPLE`, `STANDARD`, `COMPLEX` — drives certification fee)
- `created_at`, `updated_at`

### listing_media
- `id` (uuid, pk)
- `listing_id` (fk → listings)
- `type` (enum: `PHOTO`, `VIDEO`)
- `storage_key` (relative file path on disk, e.g. `listing-photos/uuid.jpg`; becomes an S3 key when migrated)
- `url` (served via the API's `/media/:key` endpoint for now)
- `captured_at` (timestamp parsed from the timestamp overlay/metadata)
- `duration_seconds` (for video)
- `order_index`

### conversations  (admin-mediated buyer↔seller chat)
- `id` (uuid, pk)
- `listing_id` (fk → listings)
- `buyer_id` (fk → users)
- `seller_id` (fk → users)
- `status` (enum: `OPEN`, `CONTACT_RELEASED`, `CLOSED`)
- `created_at`

### messages
- `id` (uuid, pk)
- `conversation_id` (fk → conversations)
- `sender_id` (fk → users)
- `body_raw` (original text)
- `body_filtered` (text after phone/email auto-blocking)
- `was_blocked` (bool — true if contact info was detected & redacted)
- `created_at`

### transactions
- `id` (uuid, pk)
- `listing_id` (fk → listings)
- `buyer_id`, `seller_id` (fk → users)
- `sale_price` (numeric)
- `buyer_commission` (1% of sale_price)
- `seller_commission` (1% of sale_price)
- `commission_status` (enum: `PENDING`, `PAID`)
- `contact_released_at` (nullable — set only after commission PAID)
- `created_at`

### certifications
- `id` (uuid, pk)
- `listing_id` (fk → listings)
- `loan_application_id` (fk → loan_applications)
- `complexity_tier` (snapshot)
- `fee` (numeric — computed from complexity)
- `status` (enum: `REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`)
- `report_storage_key` (path to the certification report PDF on disk; becomes S3 key when migrated)
- `inspector_notes`
- `created_at`, `completed_at`

### loan_applications
- `id` (uuid, pk)
- `listing_id` (fk → listings)
- `buyer_id` (fk → users)
- `partner_id` (fk → finance_partners)
- `amount_requested` (numeric)
- `status` (enum: `DRAFT`, `SUBMITTED`, `CERT_PENDING`, `WITH_PARTNER`, `APPROVED`, `REJECTED`)
- `referral_commission` (numeric — earned from partner)
- `created_at`

> **Note:** Submitting a loan application is what **triggers a certification** for that listing, and requires the buyer to have a verified GST.

### finance_partners
- `id` (uuid, pk)
- `name`, `type` (enum: `BANK`, `NBFC`)
- `referral_rate` (numeric)
- `active` (bool)

### buyback_offers
- `id` (uuid, pk)
- `listing_id` or `machine_reference`
- `original_price`, `machine_age_years`
- `depreciated_value` (computed from depreciation_schedule)
- `offer_amount`
- `status` (enum: `QUOTED`, `ACCEPTED`, `EXPIRED`, `COMPLETED`)
- `created_at`

### depreciation_schedule
- `id` (uuid, pk)
- `machine_category`
- `year_offset` (0,1,2,…)
- `retained_value_pct` (numeric — % of original value retained at that age)
- Seed this table; founder will supply real values. Provide a sensible placeholder curve.

---

## 6. Backend Modules (NestJS)

Build one module per concern. Each exposes REST endpoints under `/api`.

### 6.1 Auth Module
- Signup (buyer/seller), OTP send + verify, login, refresh, logout.
- Admin login is **email + password only**, no signup endpoint.
- JWT access + refresh tokens. Role-based guards (`@Roles(...)`).

### 6.2 GST Verification Module (Masters India API)
Implement this exact 7-step backend flow:
1. Receive GST number from client.
2. Call Masters India API with the GST number.
3. Validate the response — check the GSTIN exists.
4. Validate **active status** (reject if cancelled/suspended).
5. Extract the legal/trade business name.
6. Auto-fill `business_name` on the user record.
7. Set `gst_status = ACTIVE` and persist.
- Sellers cannot create listings until GST is `ACTIVE`.
- Buyers can browse without GST but cannot submit a loan application until GST is `ACTIVE`.
- Store the Masters India API key in env vars; never hardcode.

### 6.3 Listings Module
- CRUD for seller listings.
- **Media validation on upload (enforce server-side):**
  - **Photos:** minimum **5**, maximum **10**.
  - Every photo must be **timestamped** and captured **within the last 30 days** (validate `captured_at`).
  - **Exactly one mandatory running video:** minimum **60 seconds**, machine must be **actively operating**, with a **timestamp overlay**.
  - Recommend the **Timestamp Camera** app to sellers in the UI copy.
- New listings go to `PENDING_REVIEW` → admin approves to `ACTIVE`.
- Public browse/search/filter endpoints (category, make, year, price, location).

### 6.4 Messaging Module (admin-mediated)
- All buyer↔seller communication goes through **platform chat only**.
- **Auto-block phone numbers and email addresses** in every message: detect via regex, redact into `body_filtered`, set `was_blocked = true`. Store original in `body_raw` for admin audit.
- **Contact details are released only after commission is paid** — set `conversations.status = CONTACT_RELEASED` and `transactions.contact_released_at` only when `commission_status = PAID`.
- This anonymity-until-paid rule is a deliberate revenue-protection decision. Do not add any path that leaks contact info earlier.

### 6.5 Certification Module
- Certification is created **only** from a submitted loan application — never standalone, never for all listings.
- Fee computed from `complexity_tier` (SIMPLE/STANDARD/COMPLEX → fee bands; make configurable).
- Admin/inspector workflow: `REQUESTED → IN_PROGRESS → COMPLETED`, with report PDF saved to local storage and served via the media endpoint.

### 6.6 Finance & Buyback Module
- **Loan applications:** create, submit (triggers certification + requires buyer GST), route to a `finance_partner`, track status, record `referral_commission`.
- **Buyback:** quote engine that reads `depreciation_schedule` to compute `depreciated_value` and produce an `offer_amount`.

### 6.7 Transactions / Commission Module
- Create transaction on accepted offer.
- Compute `buyer_commission` and `seller_commission` (1% each of sale price).
- On `commission_status = PAID`, trigger contact release in the messaging module.

### 6.8 Admin Module
- Listing review/approval queue.
- Message audit (view `body_raw`, blocked flags).
- Commission management + release trigger.
- Certification workflow management.
- Finance partner management.
- Depreciation schedule management.

---

## 7. Frontend — Site Map & Routes (React Router v6)

> All routes are client-side via React Router v6. The Vite dev server proxies `/api/*` to the NestJS backend. Use `createBrowserRouter` with nested layouts (public layout, seller layout, buyer layout, admin layout).

### Public
- `/` — homepage (hero, live ticker bar, featured listings, how-it-works)
- `/listings` — browse + filters
- `/listings/:id` — listing detail
- `/how-it-works`
- `/about`

### Auth
- `/login`
- `/signup` (buyer/seller selector)
- `/verify-otp`
- `/admin/login` (separate, email+password)

### Seller
- `/seller/dashboard`
- `/seller/listings`
- `/seller/listings/new` (multi-step: details → media upload with photo/video validation UI → review)
- `/seller/listings/:id/edit`
- `/seller/messages`
- `/seller/gst-verification`

### Buyer
- `/buyer/dashboard`
- `/buyer/messages`
- `/buyer/saved`
- `/buyer/loans` (loan applications)
- `/buyer/loans/new`
- `/buyer/gst-verification` (gated step before loan submission)

### Admin
- `/admin/dashboard`
- `/admin/listings` (review queue)
- `/admin/messages` (audit)
- `/admin/transactions` (commission + contact release)
- `/admin/certifications`
- `/admin/finance-partners`
- `/admin/depreciation`

---

## 8. Business Rules (NON-NEGOTIABLE — enforce in code)

1. **Sellers must have an ACTIVE GST** before any listing can be created.
2. **Buyers need ACTIVE GST only to submit a loan application** — never required just to browse or message.
3. **Listing media gate:** 5–10 timestamped photos (each captured within 30 days) **plus exactly one** running video ≥60s showing the machine operating with a timestamp overlay. Reject the listing if any condition fails.
4. **All buyer↔seller chat is admin-mediated** through platform chat; phone numbers and emails are auto-detected and blocked.
5. **Contact details release ONLY after commission is paid.** No earlier path.
6. **Commission is 2% total, split 1% buyer + 1% seller.**
7. **Certification triggers ONLY on loan application** — not on every listing. Fee scales with machine complexity.
8. **Admin has no public registration.**
9. Certification credibility is the platform's moat — keep certification gated and never auto-issue.

---

## 9. Integrations & Env Vars

```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
OTP_PROVIDER_KEY=...            # SMS OTP gateway
MASTERS_INDIA_API_KEY=...       # GST verification
MASTERS_INDIA_BASE_URL=...
STORAGE_LOCAL_PATH=./uploads    # Root folder for all uploaded files
MEDIA_BASE_URL=http://localhost:3001/media   # API endpoint that serves files
```

- Use **local disk storage** via NestJS with `multer`. Save files under `STORAGE_LOCAL_PATH` in subfolders:
  - `listing-photos/`
  - `listing-videos/`
  - `certification-reports/`
- Serve files via a dedicated `/media/:subfolder/:filename` endpoint in the API (stream from disk).
- **S3 migration path (future):** All storage logic must be encapsulated in a single `StorageService` with `upload(file, path)` and `getUrl(key)` methods. When AWS S3 is ready, replace only this service — no schema or business logic changes needed. The `storage_key` column values are already structured as S3-compatible prefixed keys (e.g. `listing-photos/uuid.jpg`).

---

## 10. Build Order (suggested for Claude Code)

1. Monorepo scaffold (`/apps/web`, `/apps/api`, `/packages/shared`).
2. Prisma schema + migrations for all tables in §5; seed depreciation schedule + an admin user.
3. Auth module (JWT + OTP) and role guards.
4. GST verification module (Masters India 7-step flow).
5. Listings module + local disk media upload (`StorageService`) with the validation rules.
6. Messaging module with contact auto-blocking.
7. Transactions/commission + contact-release linkage.
8. Certification + loan/finance/buyback modules.
9. Admin module + endpoints.
10. React (Vite) frontend: Tailwind config with design system colors/fonts, `createBrowserRouter` with all routes in §7, Axios/fetch wiring to the API, role-based protected route wrappers.

---

## 11. Acceptance Checks

- A seller without ACTIVE GST cannot publish a listing (API rejects).
- A listing with 4 photos, or photos older than 30 days, or no 60s+ running video, is rejected.
- A buyer message containing a phone number or email is redacted before the seller sees it.
- Contact info is unavailable in the UI until the transaction's commission is marked PAID.
- A certification record only ever exists when tied to a submitted loan application.
- Commission split is exactly 1% / 1%.
- No emojis, no dark theme; colors and fonts match the design system.