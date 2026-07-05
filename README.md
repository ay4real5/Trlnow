# TrlNow — Shipment Tracking Platform

Full-stack shipment tracking system built with Next.js 14, Prisma, and NextAuth.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js (credentials provider, JWT sessions, role-based access)
- **UI**: TailwindCSS + lucide-react icons
- **Email**: Nodemailer (optional — logs to console if SMTP not configured)

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Default uses SQLite locally — no PostgreSQL needed for dev

# 3. Create database schema
npx prisma db push

# 4. Seed demo data
npm run db:seed

# 5. Start dev server
npm run dev
```

## Demo Accounts

| Role     | Email                | Password      |
|----------|----------------------|---------------|
| Admin    | admin@trlnow.com     | admin123      |
| Staff    | staff@trlnow.com     | staff123      |
| Customer | customer@trlnow.com  | customer123   |

Sample tracking numbers for testing:
- `TRL-84J2-7K9P-1M3Q` (in transit)
- `TRL-9X4L-2B8N-5T6W` (delivered)


## Deploy to Vercel

### 1. Push to GitHub

```bash
git add -A
git commit -m "ready for vercel"
git push origin main
```

### 2. Create a PostgreSQL Database

Use one of these free providers:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Vercel Postgres**: https://vercel.com/docs/storage

Copy the connection string (format: `postgresql://user:pass@host:5432/db?schema=public`)

### 3. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no build config needed

### 4. Set Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

| Key              | Value                                      |
|------------------|--------------------------------------------|
| `DATABASE_URL`   | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_SECRET`| Generate at https://generate-secret.now.sh |
| `NEXTAUTH_URL`   | `https://your-app.vercel.app`              |
| `SMTP_HOST`      | (optional) your SMTP server                |
| `SMTP_PORT`       | (optional) 587                             |
| `SMTP_USER`      | (optional) SMTP username                   |
| `SMTP_PASSWORD`  | (optional) SMTP password                   |
| `SMTP_FROM`      | (optional) noreply@yourdomain.com          |

### 5. Deploy

Click **Deploy**. Vercel will:
- Run `npm install` (triggers `postinstall` → `prisma generate`)
- Run `npm run build` (Next.js build)

### 6. Set Up Database

After first deploy, run the schema push and seed from your local machine
using the production DATABASE_URL. Set `DB_PROVIDER=postgresql` to switch the provider:

```bash
DB_PROVIDER="postgresql" DATABASE_URL="your-vercel-postgres-url" npx prisma db push
DB_PROVIDER="postgresql" DATABASE_URL="your-vercel-postgres-url" npm run db:seed
```

## Features

### Customer
- Track shipments by tracking number
- Register / login
- View own shipments dashboard

### Admin / Staff
- Dashboard with statistics (shipments, delays, branches, customers)
- Shipments CRUD with controlled status flow
- Status timeline with location, branch, and notes
- Customer management
- Branch management (CRUD)
- Staff management (admin only)
- CSV report export with filters

### Status Flow
```
created → picked_up → in_transit → out_for_delivery → delivered
                                                          ↗
                        ↘ exception ────────────────────────
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (auth, shipments, track, customers, branches, staff, reports, stats)
│   ├── admin/         # Admin pages (dashboard, shipments, customers, branches, staff, reports)
│   ├── track/         # Public tracking pages
│   ├── dashboard/     # Customer dashboard
│   ├── login/         # Auth pages
│   ├── register/
│   ├── page.tsx       # Landing page
│   └── layout.tsx     # Root layout
├── components/        # Shared UI components
└── lib/               # Prisma, auth, notifications, utils
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Demo data seeder
```
