# CLAUDE.md — TrlNow project context

> Auto-loaded by Claude Code every session. Read this BEFORE touching anything
> database-related. On another machine: `git pull` first — this file and the
> safety helpers it describes were added 19 Jul 2026.

## ⛔ THE ONE RULE THAT MUST NEVER BE BROKEN — shared database

TrlNow's production Postgres (Vercel Neon resource **`neon-camel-clock`**) is
**SHARED with the Abims2026 wedding-invitation site**. The wedding site's tables
(`rsvps`, `blessings`) live in the **`public`** schema. TrlNow must ONLY ever
touch its own **`trlnow`** schema.

**What happened when this rule didn't exist (19 Jul 2026):** the vercel-build ran
`prisma db push --accept-data-loss` against `public` and **dropped the couple's
wedding guest list — 23 RSVPs and 8 blessings**. It was recovered only by a
time-limited Neon point-in-time restore. Do not let any change recreate this risk.

### Hard rules
- **Never** run `prisma db push`, `prisma migrate` (dev/reset/deploy/resolve),
  `psql`, or any other DB tool against the Neon `DATABASE_URL` directly. The URL
  must have `schema=trlnow` appended first. The sanctioned entry points already
  do this — use them and nothing else:
  - Runtime client: `prisma` export from `src/lib/prisma.ts`
    (via `trlnowDatabaseUrl()`). Never construct `new PrismaClient()` elsewhere.
  - Seeding: `npm run db:seed` (`prisma/seed.ts` has its own copy of the helper).
  - Schema push: `node scripts/prebuild.js --push` — the ONLY way to push. It
    appends `schema=trlnow` and hard-refuses postgres URLs without it.
- **Never** remove/bypass `trlnowDatabaseUrl()`, the seed helper, or the
  `--push` guard; any new script that opens a DB connection must reuse the same
  URL logic.
- **Never** use `--force-reset` on any prisma command, and never "clean up" or
  "reset" the database as a whole — only the `trlnow` schema, and only via the
  entry points above.
- **Never touch the `public` schema.** TrlNow's pre-19-Jul tables (`User`,
  `Shipment`, `ShipmentStatus`, `Branch`, …) still sit orphaned in `public`
  next to the wedding tables. Leave them; if the user explicitly asks to clean
  them up, drop ONLY those named TrlNow tables, one by one, after confirming
  `rsvps`/`blessings` row counts before and after.
- Local dev is safe: `.env` uses SQLite (`file:./dev.db`); only Vercel builds
  reach Neon. Never point local `.env` at the Neon URL.
- If the wedding site's data ever vanishes again: check TrlNow deployment build
  logs on Vercel first (`prisma db push` drop warnings), and restore via Neon
  console → branch `main` → Backup & Restore → point-in-time (free-plan window
  is short — hours, act fast).

## Build pipeline (Vercel)
`vercel.json` → `npm run vercel-build` =
`node scripts/prebuild.js` (switches Prisma provider sqlite→postgresql on Vercel)
→ `prisma generate` → `node scripts/prebuild.js --push` (schema-safe db push)
→ `npm run db:seed` (upsert-only demo data) → `next build`.

## What TrlNow is
Shipment-tracking platform: Next.js 14 App Router + Prisma + NextAuth
(role-based: ADMIN/STAFF/CUSTOMER). See `README.md` for local quick start.
Live at https://trlnow.vercel.app (Vercel project `trlnow`, team
`ay4real5s-projects`, auto-deploys from GitHub `ay4real5/Trlnow` main).
Demo logins are seeded (`admin@trlnow.com` etc. — see `prisma/seed.ts`).
