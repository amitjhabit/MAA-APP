# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MAA CRM — a community management platform for the Maithil Association of America. Built with Next.js 14 App Router, Neon PostgreSQL (serverless), and deployed on Vercel.

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
npm run start        # Production server
npm run db:migrate   # Initialize/migrate DB schema (node scripts/migrate.js)
```

No test runner is configured. No lint script is configured.

## Environment Setup

Copy `.env.local.example` → `.env.local` and fill in:

```
DATABASE_URL=          # Neon PostgreSQL connection string
ADMIN_SECRET=          # Password for all admin API calls
NEXT_PUBLIC_APP_URL=   # App base URL
```

The DB schema is created automatically on the first request via `ensureInit()` — no manual migration needed for local dev.

## Architecture

### Server vs Client Components

**Server components** (no `'use client'`): Fetch directly from the DB using `getDb()` and `ensureInit()`. Used for public-facing pages where SSR matters for mobile load time (e.g., `app/page.js`, `app/events/page.js`, `app/about/page.js`).

**Client components** (`'use client'`): Use `useState`/`useEffect` and call API routes via `fetch()`. Used for admin pages (all of `app/admin/`) and interactive wrappers like `app/components/HomeClient.js` and `app/components/EventsClient.js`.

**Hybrid pattern**: Server page fetches data → passes as props to a client component child that handles interactivity. See `app/page.js` + `app/components/HomeClient.js` for the pattern.

### Admin Authentication

All admin API routes check a single shared secret header:

```javascript
function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}
```

Admin client pages prompt for this secret on first load and store it in component state. The secret is passed as `{ headers: { 'x-admin-secret': secret } }` on every fetch.

### Database Layer (`lib/db.js`)

Singleton Neon SQL client via `getDb()`. `ensureInit()` is idempotent and called at the top of every server component and API route. Schema is defined inline via `CREATE TABLE IF NOT EXISTS`.

**Tables**: `members`, `events`, `event_registrations`, `donations`, `news_posts`, `volunteers`, `committee_members`, `gallery`, `inquiries`, `about_content`.

**Date handling**: Neon returns `DATE` columns as JavaScript `Date` objects when queried from server components, but as strings when serialized through `NextResponse.json()` to client components. Use the `localDate()` helper (present in `HomeClient.js`, `EventsClient.js`, and `admin/events/page.js`) for all date rendering — it handles both formats safely.

### API Structure

- `app/api/public/*` — No auth required. Read-only or form submissions. All have `export const dynamic = 'force-dynamic'` and return `Cache-Control: no-store`.
- `app/api/*` (non-public) — Require `x-admin-secret` header. Full CRUD.

**Consistent response shape**:
```javascript
{ success: boolean, data: object|array, message?: string, errors?: object, stats?: object, pagination?: object }
```

List endpoints support `?search=`, `?status=`, `?page=`, `?limit=` (max 50). Use `ILIKE` for search and `RETURNING *` on writes.

### Routing

All public pages: `app/(route)/page.js`  
All admin pages: `app/admin/(module)/page.js`  
Shared components: `app/components/`

### Styling

Pure CSS in `app/globals.css`. No Tailwind. CSS variables for the design system:

- `--saffron` / `--saffron-light` / `--saffron-dark` — primary orange (#E8720C)
- `--gold` / `--gold-light` — secondary (#C9960C)
- `--navy` — headings/admin sidebar (#0D2137)
- `--crimson` — danger/religious category
- `--forest` — success/social category

Component classes: `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.badge`, `.hero`, `.shell`, `.modal`, `.modal-backdrop`, `.admin-sidebar`, `.loading-state`, `.empty-state`.

Responsive breakpoint at 768px — mobile nav uses a hamburger drawer.

### Maithili Language

Many tables and UI elements have parallel Maithili text fields (`title_maithili`, `name_maithili`, etc.). These are plain Unicode strings — no special handling needed.

## Key Constraints

- `members.email` is UNIQUE
- `news_posts.slug` is UNIQUE  
- `event_date` is `NOT NULL` on events
- Membership `type`: `individual | student | honorary | corporate`
- Membership `status`: `active | inactive | pending | expired`
- Event `status`: `upcoming | ongoing | completed | cancelled`
- Donation `payment_method`: `zelle | credit_card | check | cash | other`
- `is_active = TRUE` on members filters for active-only counts in stats

## Working Directory

Always make changes in `C:\Amit\Project\maa-full`. Never use Claude worktree branches. Commit directly to `main` and push to trigger Vercel auto-deploy.
