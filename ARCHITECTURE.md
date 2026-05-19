# MAA App — Architecture Document

**Project:** Maithil Association of America CRM  
**Stack:** Next.js 14 App Router · Neon PostgreSQL · Vercel  
**Last Updated:** May 2026

---

## 1. Overview

MAA App is a full-stack community management platform that combines a public-facing website with a private admin CRM. It handles membership, events, donations, finance, receipts, gallery, news, and committee management for the Maithil Association of America.

```
Public Website  ──►  Next.js Server Components  ──►  Neon PostgreSQL
Admin CRM       ──►  Next.js Client Components   ──►  API Routes  ──►  Neon PostgreSQL
                                                          │
                                              ┌───────────┼────────────┐
                                           Gmail SMTP  Google Drive  Puppeteer PDF
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR pages + API routes |
| Database | Neon PostgreSQL (serverless) | Primary data store |
| Hosting | Vercel | Deployment + CDN |
| Email | Nodemailer + Gmail SMTP | Transactional emails |
| PDF | Puppeteer Core + Chromium | Receipt PDF generation |
| Cloud Storage | Google Drive API v3 | Receipt PDF archive |
| Auth | Shared secret (`ADMIN_SECRET`) | Admin access control |

---

## 3. Repository Structure

```
maa-full/
├── app/
│   ├── layout.js                    # Root HTML layout, global CSS import
│   ├── page.js                      # Homepage (server component)
│   ├── globals.css                  # Full CSS design system
│   │
│   ├── about/page.js                # About Us public page
│   ├── contact/page.js              # Contact Us public page
│   ├── donate/page.js               # Donate page (Zelle QR)
│   ├── events/page.js               # Events listing
│   ├── gallery/page.js              # Photo gallery
│   ├── join/page.js                 # Membership application form
│   ├── news/page.js                 # News & announcements
│   │
│   ├── admin/
│   │   ├── layout.js                # Admin shell (sidebar, auth gate)
│   │   ├── page.js                  # Admin dashboard
│   │   ├── about/page.js            # Manage About Us content
│   │   ├── analytics/page.js        # Site analytics
│   │   ├── committee/page.js        # Committee members CRUD
│   │   ├── donations/page.js        # Donations CRUD
│   │   ├── events/page.js           # Events CRUD
│   │   ├── finance/page.js          # Finance: transactions, receipts, budget, P&L
│   │   ├── gallery/page.js          # Gallery albums + photo management
│   │   ├── homepage/page.js         # Edit homepage content
│   │   ├── inquiries/page.js        # View contact form submissions
│   │   ├── members/page.js          # Members CRUD + CSV import
│   │   ├── news/page.js             # News posts CRUD
│   │   └── volunteers/page.js       # Volunteer management
│   │
│   ├── components/
│   │   ├── PublicNav.js             # Responsive nav (all public pages)
│   │   ├── PublicFooter.js          # Site footer
│   │   ├── HomeClient.js            # Interactive home page wrapper
│   │   ├── EventsClient.js          # Events list with filters
│   │   ├── NewsClient.js            # News list with filters
│   │   ├── GalleryClient.js         # Gallery grid with lightbox
│   │   ├── CommitteeSection.js      # Committee cards (client, re-fetches on mount)
│   │   └── InquiryWidget.js         # Floating inquiry button + modal
│   │
│   └── api/
│       ├── health/route.js          # GET /api/health — uptime check
│       ├── analytics/route.js       # Analytics data
│       │
│       ├── members/
│       │   ├── route.js             # GET (list) / POST (create)
│       │   ├── [id]/route.js        # GET / PATCH / DELETE
│       │   ├── import/route.js      # POST — CSV bulk import
│       │   ├── template/route.js    # GET — download CSV template
│       │   └── lookup/route.js      # GET — email autocomplete
│       │
│       ├── events/
│       │   ├── route.js             # GET / POST
│       │   └── [id]/route.js        # GET / PATCH / DELETE
│       │
│       ├── donations/
│       │   ├── route.js             # GET / POST (triggers receipt auto-gen)
│       │   └── [id]/route.js        # GET / PATCH / DELETE
│       │
│       ├── volunteers/
│       │   ├── route.js             # GET / POST
│       │   └── [id]/route.js        # PATCH / DELETE
│       │
│       ├── committee/
│       │   ├── route.js             # GET / POST
│       │   └── [id]/route.js        # PATCH / DELETE
│       │
│       ├── inquiries/
│       │   ├── route.js             # GET / POST
│       │   └── [id]/route.js        # PATCH / DELETE
│       │
│       ├── news/
│       │   ├── route.js             # GET / POST
│       │   └── [id]/route.js        # PATCH / DELETE
│       │
│       ├── gallery/
│       │   ├── route.js             # GET / POST
│       │   ├── [id]/route.js        # PATCH / DELETE
│       │   ├── upload/route.js      # POST — image upload
│       │   ├── albums/route.js      # GET / POST albums
│       │   └── albums/[id]/scan/route.js  # Scan folder for images
│       │
│       ├── finance/
│       │   ├── categories/route.js  # Budget categories
│       │   ├── transactions/route.js       # GET / POST transactions
│       │   ├── transactions/[id]/route.js  # PATCH / DELETE
│       │   ├── budget/route.js      # Budget items CRUD
│       │   ├── pl/route.js          # P&L summary report
│       │   ├── templates/route.js           # Receipt templates CRUD
│       │   ├── templates/[id]/route.js      # GET / PATCH / DELETE template
│       │   ├── templates/[id]/signature/route.js  # Upload signature image
│       │   ├── receipts/route.js            # GET receipts list
│       │   ├── receipts/[id]/pdf/route.js   # GET — serve PDF
│       │   ├── receipts/generate/route.js   # POST — batch generate PDFs
│       │   ├── receipts/send/route.js       # POST — email receipt
│       │   └── receipts/upload-drive/route.js  # POST — upload to Google Drive
│       │
│       ├── admin/
│       │   ├── about/route.js       # About content CRUD
│       │   ├── about/[id]/route.js  # Update / delete about item
│       │   ├── homepage/route.js    # Homepage content key-value store
│       │   ├── test-drive/route.js  # Diagnostic: test Drive connection
│       │   └── reseed-templates/route.js  # Re-seed default receipt templates
│       │
│       └── public/                  # No auth required
│           ├── contact/route.js     # POST — contact form submission
│           ├── join/route.js        # POST — membership application
│           ├── donate/route.js      # POST — public donation form
│           ├── events/route.js      # GET — upcoming events
│           ├── news/route.js        # GET — published news
│           ├── committee/route.js   # GET — current committee
│           ├── stats/route.js       # GET — member/event counts
│           ├── about/route.js       # GET — about content
│           ├── gallery/route.js     # GET — gallery photos
│           └── gallery/albums/route.js  # GET — gallery albums
│
├── lib/
│   ├── db.js        # DB singleton, ensureInit(), all schema migrations
│   ├── email.js     # Nodemailer transporter, sendMail()
│   ├── pdf.js       # Puppeteer PDF generation from HTML
│   ├── drive.js     # Google Drive client, upload helpers
│   └── receipts.js  # Receipt generation, PDF, email, Drive orchestration
│
├── scripts/
│   └── migrate.js   # Standalone migration runner (npm run db:migrate)
│
├── public/
│   └── images/gallery/   # Static images served by Next.js
│
├── .env.local            # Local secrets (never committed)
├── .env.local.example    # Template for required env vars
├── CLAUDE.md             # AI assistant project instructions
└── ARCHITECTURE.md       # This document
```

---

## 4. Database Schema

All tables are created by `lib/db.js → ensureInit()` on first request. No manual migration step needed.

### Core Tables

#### `members`
Stores all association members.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT NOT NULL | |
| email | TEXT UNIQUE | |
| phone | TEXT | |
| address, city, state, zip | TEXT | US address |
| country | TEXT | default 'USA' |
| membership_type | TEXT | individual / student / honorary / corporate |
| membership_plan | TEXT | annual / lifetime |
| membership_status | TEXT | active / inactive / pending / expired |
| join_date | DATE | |
| expiry_date | DATE | |
| amount_paid | NUMERIC(10,2) | |
| payment_method | TEXT | |
| village_district | TEXT | Origin district in Mithila |
| notes | TEXT | |
| is_active | BOOLEAN | default TRUE — used for stats counts |
| created_at / updated_at | TIMESTAMPTZ | auto-managed by trigger |

#### `events`
All events (upcoming, ongoing, completed, cancelled).

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| title / title_maithili | TEXT | Bilingual titles |
| event_date | DATE NOT NULL | |
| event_time | TEXT | |
| location / city / state | TEXT | |
| is_online | BOOLEAN | |
| meeting_link | TEXT | |
| category | TEXT | cultural / religious / social / educational / fundraiser / other |
| status | TEXT | upcoming / ongoing / completed / cancelled |
| description | TEXT | |
| cover_image | TEXT | URL |
| max_attendees | INT | |
| registration_required | BOOLEAN | |
| created_at / updated_at | TIMESTAMPTZ | |

#### `event_registrations`
Links members to events.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| event_id | FK → events | |
| member_id | FK → members | nullable (guest) |
| name / email / phone | TEXT | Guest details if non-member |
| status | TEXT | registered / attended / cancelled |
| notes | TEXT | |
| registered_at | TIMESTAMPTZ | |

#### `donations`
Donation records. Creating a donation auto-triggers receipt generation.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| member_id | FK → members | nullable |
| donor_name / donor_email | TEXT | |
| amount | NUMERIC(10,2) NOT NULL | |
| payment_method | TEXT | zelle / credit_card / check / cash / other |
| payment_date | DATE | |
| campaign | TEXT | |
| purpose | TEXT | |
| status | TEXT | pending / completed / failed / refunded |
| notes | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

#### `news_posts`
News articles and announcements.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| title / title_maithili | TEXT | |
| slug | TEXT UNIQUE | URL-safe identifier |
| category | TEXT | general / cultural / event / announcement / newsletter |
| status | TEXT | draft / published / archived |
| excerpt / content | TEXT | |
| author | TEXT | |
| cover_image | TEXT | URL |
| published_at | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

#### `volunteers`
Volunteer roster.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| member_id | FK → members | nullable |
| name / email / phone | TEXT | |
| role | TEXT | |
| skills | TEXT | |
| availability | TEXT | |
| status | TEXT | active / inactive |
| hours_contributed | INT | |
| notes | TEXT | |
| joined_at | TIMESTAMPTZ | |

#### `committee_members`
Executive committee and leadership.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| member_id | FK → members | nullable |
| name | TEXT NOT NULL | |
| role | TEXT NOT NULL | |
| committee_type | TEXT | executive / advisory / sub |
| email | TEXT | |
| photo_url | TEXT | |
| term_start / term_end | DATE | |
| is_current | BOOLEAN | default TRUE |
| bio | TEXT | |
| sort_order | INT | |

#### `inquiries`
Contact form submissions.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name / email / phone | TEXT | |
| inquiry_type | TEXT | general / membership / event / donation / volunteer / other |
| subject / message | TEXT | |
| status | TEXT | new / read / replied / archived |
| created_at | TIMESTAMPTZ | |

#### `about_content`
Dynamic content for the About Us page.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| section | TEXT NOT NULL | paragraph / core_value / activity / quote / goals |
| title / title_maithili | TEXT | |
| content | TEXT | |
| icon | TEXT | Emoji or image URL |
| sort_order | INT | |
| is_active | BOOLEAN | |

#### `homepage_content`
Key-value store for editable homepage text.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| section | TEXT | hero / stats / etc. |
| key | TEXT | eyebrow / title / subtitle / etc. |
| value | TEXT | |
| is_active | BOOLEAN | |

#### `gallery_albums`
Photo album containers.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT NOT NULL | |
| description | TEXT | |
| cover_image | TEXT | |
| event_id | FK → events | optional link |
| created_at | TIMESTAMPTZ | |

#### `gallery`
Individual photos.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| album_id | FK → gallery_albums | |
| title / caption | TEXT | |
| image_url | TEXT NOT NULL | |
| thumbnail_url | TEXT | |
| category | TEXT | |
| is_featured | BOOLEAN | |
| sort_order | INT | |
| uploaded_at | TIMESTAMPTZ | |

### Finance Tables

#### `budget_categories`
Income and expense categories.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT UNIQUE | |
| type | TEXT | income / expense |
| description | TEXT | |
| is_active | BOOLEAN | |
| sort_order | INT | |

#### `budget_items`
Planned budget allocations by period.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| category_id | FK → budget_categories | |
| fiscal_year | INT | |
| fiscal_month | INT | nullable (annual) |
| allocated_amount | NUMERIC(10,2) | |
| notes | TEXT | |

#### `finance_transactions`
Actual income and expense transactions.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| type | TEXT | income / expense |
| category_id | FK → budget_categories | |
| amount | NUMERIC(10,2) NOT NULL | |
| description | TEXT | |
| transaction_date | DATE | |
| payment_method | TEXT | |
| reference_number | TEXT | |
| member_id | FK → members | nullable |
| donation_id | FK → donations | nullable |
| status | TEXT | pending / completed / cancelled |
| notes | TEXT | |
| created_by | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

#### `receipt_templates`
HTML email templates for receipts.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT | e.g. "Donation Receipt" |
| subject | TEXT | Email subject line |
| body_html | TEXT | Full HTML with {{variable}} placeholders |
| signature | TEXT | Base64-encoded signature image |
| is_active | BOOLEAN | Only one active template used |
| created_at / updated_at | TIMESTAMPTZ | |

**Template variables:** `{{receipt_number}}`, `{{donor_name}}`, `{{amount}}`, `{{amount_words}}`, `{{payment_date}}`, `{{payment_method}}`, `{{campaign}}`, `{{purpose}}`, `{{org_name}}`

#### `receipts`
Generated receipt records.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| receipt_number | TEXT UNIQUE | Format: RCP-YYYYMMDD-XXXXX |
| transaction_id | FK → finance_transactions | nullable |
| donation_id | FK → donations | nullable |
| template_id | FK → receipt_templates | |
| recipient_name / recipient_email | TEXT | |
| amount | NUMERIC(10,2) | |
| html_content | TEXT | Rendered HTML at time of generation |
| pdf_base64 | TEXT | Base64-encoded PDF |
| drive_file_id | TEXT | Google Drive file ID |
| drive_link | TEXT | Public shareable URL |
| emailed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

---

## 5. Authentication

### Admin Auth
All admin API routes use a single shared secret:

```js
// In every admin API route:
function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}
```

- The secret is stored in `ADMIN_SECRET` env var
- Admin UI prompts for password on first load, stores in component state
- Every `fetch()` call from admin pages includes `{ headers: { 'x-admin-secret': secret } }`
- No sessions, no cookies, no JWT — stateless per-request check

### Public API Routes
Routes under `/api/public/*` require no authentication. They are read-only or form submissions with rate-limiting by design.

---

## 6. Component Patterns

### Server Components (no `'use client'`)
Used for public-facing pages where SEO and first-paint performance matter.

```
app/page.js           → queries DB directly via getDb()
app/events/page.js    → queries DB, passes data as props to EventsClient
app/about/page.js     → queries DB, passes data as props
```

**Flow:**
```
Browser → Next.js SSR → ensureInit() → getDb() → Neon SQL → HTML response
```

### Client Components (`'use client'`)
Used for all admin pages and interactive public wrappers.

```
app/admin/members/page.js   → useState + fetch('/api/members', headers)
app/components/HomeClient.js → useState + InquiryModal
```

**Flow:**
```
Browser → React hydration → useEffect/onClick → fetch('/api/...') → JSON response → setState → re-render
```

### Hybrid Pattern
Server page fetches initial data → passes as props → client component handles interactivity.

```
app/events/page.js (server)
  └── <EventsClient events={initialEvents} />  (client — filters, search, load-more)
```

---

## 7. Data Flow: Complete Request Flows

### 7.1 Public User Views Events

```
1. Browser GET /events
2. Next.js SSR: app/events/page.js
3. ensureInit() → creates tables if missing
4. getDb() → sql`SELECT * FROM events WHERE status != 'cancelled' ORDER BY event_date`
5. Neon PostgreSQL returns rows
6. Server renders HTML with event cards
7. Hydrate: EventsClient.js takes over for search/filter interactions
8. Filter click → fetch('/api/public/events?status=upcoming') → JSON → setEvents()
```

### 7.2 Public User Submits Contact Form

```
1. User fills form on /contact
2. POST /api/public/contact  { name, email, phone, inquiry_type, subject, message }
3. route.js: INSERT INTO inquiries ...
4. Admin sees new inquiry in Admin → Inquiries
```

### 7.3 Public User Submits Membership Application

```
1. User fills /join form
2. POST /api/public/join  { name, email, membership_type, ... }
3. route.js: INSERT INTO members (status='pending') ...
4. Admin reviews in Admin → Members, approves (PATCH status='active')
```

### 7.4 Admin Creates Donation → Receipt Auto-Generated

```
1. Admin → Donations → Add Donation
2. POST /api/donations  { donor_name, amount, payment_method, ... }
3. donations/route.js:
   a. INSERT INTO donations
   b. INSERT INTO finance_transactions (type='income', donation_id=...)
   c. Call autoGenerateAndSendReceipt() from lib/receipts.js

4. lib/receipts.js → autoGenerateAndSendReceipt():
   a. SELECT active receipt_template
   b. Generate receipt_number (RCP-YYYYMMDD-XXXXX)
   c. Render HTML: replace {{variables}} in template
   d. INSERT INTO receipts (html_content, ...)
   e. Generate PDF:
      - lib/pdf.js → Puppeteer Core + Chromium
      - Render HTML to PDF buffer
      - UPDATE receipts SET pdf_base64 = ...
   f. Upload to Google Drive (best-effort):
      - lib/drive.js → getDriveClient()
      - uploadPdfToDrive(buffer, filename, folderId)
      - Make file public (anyone with link can view)
      - UPDATE receipts SET drive_file_id, drive_link
   g. Send email:
      - lib/email.js → Nodemailer → Gmail SMTP
      - Attach PDF to email
      - UPDATE receipts SET emailed_at = NOW()

5. Admin sees receipt in Finance → Receipts tab with Drive link
```

### 7.5 Admin Views Finance Dashboard

```
1. Admin → Finance page loads
2. fetch('/api/finance/transactions') → list transactions
3. fetch('/api/finance/receipts') → list receipts with drive_link
4. fetch('/api/finance/pl') → P&L summary (income vs expense by category)
5. fetch('/api/finance/budget') → budget allocations
6. Admin sees Transactions tab, Receipts tab, Budget tab, P&L tab
```

### 7.6 Gallery Photo Upload

```
1. Admin → Gallery → select album → Upload Photo
2. POST /api/gallery/upload  (multipart form, image file)
3. route.js saves image to /public/images/gallery/
4. INSERT INTO gallery (image_url, album_id, ...)
5. Public /gallery page shows new photo immediately
```

---

## 8. Library Modules

### `lib/db.js`
- Singleton Neon SQL client via `getDb()`
- `ensureInit()` — idempotent, runs all `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE` migrations on first call
- Called at the top of every server component and API route
- Uses PostgreSQL triggers for `updated_at` auto-timestamp
- Seeds default budget categories, about content, and receipt templates on first run

### `lib/email.js`
- Nodemailer transporter configured from `SMTP_*` env vars (Gmail)
- Exports `sendMail({ to, subject, html, attachments })`
- Used by `lib/receipts.js` and contact form routes

### `lib/pdf.js`
- Uses `puppeteer-core` + `@sparticuz/chromium` (Vercel-compatible headless Chrome)
- Exports `generatePdf(html)` → returns Buffer
- Runs with `--no-sandbox` flags for serverless compatibility
- 30-second timeout guard

### `lib/drive.js`
- Google Drive API v3 via `googleapis` package
- Service account auth from `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- `getDriveClient()` → authenticated Drive client
- `uploadPdfToDrive(buffer, filename, folderId)` → returns `{ fileId, link }`
- `uploadReceiptToDrive(sql, receiptId, buffer, receiptNumber)` → updates DB row
- Returns `null` silently when credentials not configured (local dev safe)

### `lib/receipts.js`
- Orchestrates the full receipt lifecycle
- `autoGenerateAndSendReceipt({ sql, donationId, ... })` — called on every new donation
- `resendExistingReceipt({ sql, receipt, recipientEmail })` — admin resend
- `amountToWords(amount)` — "One Hundred and 50/100 Dollars"
- `makeReceiptNumber()` — `RCP-YYYYMMDD-XXXXX` with microsecond entropy

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (pooler URL) |
| `ADMIN_SECRET` | Yes | Shared password for all admin API routes |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL (e.g. `https://maa-app-swart.vercel.app`) |
| `NEXT_PUBLIC_ORG_NAME` | No | Display name (default: "Maithil Association of America") |
| `NEXT_PUBLIC_ZELLE_EMAIL` | No | Zelle payment email shown on Donate + Join pages |
| `NEXT_PUBLIC_ZELLE_PHONE` | No | Zelle phone number |
| `SMTP_HOST` | Yes | `smtp.gmail.com` |
| `SMTP_PORT` | Yes | `587` |
| `SMTP_USER` | Yes | Gmail address for sending |
| `SMTP_PASS` | Yes | Gmail App Password |
| `SMTP_FROM` | Yes | Display name + email for outgoing mail |
| `GOOGLE_CLIENT_EMAIL` | Optional | Service account email for Drive uploads |
| `GOOGLE_PRIVATE_KEY` | Optional | PEM private key (newlines as `\n`) |
| `GOOGLE_DRIVE_FOLDER_ID` | Optional | Target Drive folder ID for receipts |

---

## 10. Deployment

### Vercel (Production)
- Auto-deploys on every push to `main` branch
- Environment variables set in Vercel → Project Settings → Environment Variables
- Serverless functions (API routes) run as isolated edge/Node.js functions
- Static assets served from Vercel CDN

### Local Development
```bash
cp .env.local.example .env.local
# Fill in DATABASE_URL, ADMIN_SECRET, SMTP_*, NEXT_PUBLIC_APP_URL
npm run dev
# App runs at http://localhost:3000
```

### Database Migration
- **Automatic:** `ensureInit()` runs on first request — creates all tables and applies migrations
- **Manual:** `npm run db:migrate` runs `scripts/migrate.js` standalone

### Moving the Database
To migrate to a new Neon project or account:
1. Export: `pg_dump "OLD_DATABASE_URL" > maa_backup.sql`
2. Create new Neon project, get new connection string
3. Import: `psql "NEW_DATABASE_URL" < maa_backup.sql`
4. Update `DATABASE_URL` in `.env.local` and Vercel environment variables
5. Redeploy on Vercel

---

## 11. Public Pages Summary

| Route | Type | Data Source |
|---|---|---|
| `/` | Server Component | `homepage_content` table + static |
| `/events` | Hybrid (Server + Client) | `events` table via SSR + `/api/public/events` |
| `/news` | Hybrid | `news_posts` table via SSR + `/api/public/news` |
| `/gallery` | Hybrid | `gallery` + `gallery_albums` via SSR + API |
| `/about` | Server Component | `about_content` + `committee_members` via SSR |
| `/contact` | Client Component | POST to `/api/public/contact` |
| `/join` | Client Component | POST to `/api/public/join` |
| `/donate` | Static | Zelle QR code (no DB) |

---

## 12. Admin Pages Summary

| Route | Module | Key Operations |
|---|---|---|
| `/admin` | Dashboard | Stats overview, recent activity |
| `/admin/members` | Members | CRUD, CSV import, status management |
| `/admin/donations` | Donations | CRUD, auto-receipt generation |
| `/admin/finance` | Finance | Transactions, receipts, budget, P&L |
| `/admin/events` | Events | CRUD, registration management |
| `/admin/news` | News | CRUD, publish/draft control |
| `/admin/gallery` | Gallery | Album management, photo upload |
| `/admin/committee` | Committee | Current + past member management |
| `/admin/volunteers` | Volunteers | Roster, hours tracking |
| `/admin/inquiries` | Inquiries | Contact form submissions, status |
| `/admin/about` | About Content | Section CRUD (paragraphs, values, goals) |
| `/admin/homepage` | Homepage | Editable hero text and stats |
| `/admin/analytics` | Analytics | Traffic and engagement data |

---

## 13. Key Design Decisions

**Single shared secret auth** — Simpler than OAuth for a small team; no session management overhead. Stored in component state per page load, not localStorage.

**`ensureInit()` pattern** — Schema lives in code, not migration files. Idempotent — safe to call on every request. New columns added as `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in try/catch blocks.

**Best-effort Drive uploads** — Drive failure never blocks receipt generation or email delivery. All Drive calls are wrapped in try/catch; errors are logged, not thrown.

**Server components for public pages** — Faster first paint, better SEO, no loading spinners for the public-facing site.

**Client components for admin** — Full interactivity, inline editing, modals, and real-time updates without page reloads.

**Pure CSS, no Tailwind** — Single `globals.css` file with CSS variables for the full design system. Easier to maintain for a single developer.

**Neon serverless** — Serverless PostgreSQL with connection pooling built in — compatible with Vercel's serverless function model where persistent connections are not possible.
