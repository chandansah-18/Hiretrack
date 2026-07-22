# Recruitment Operations Dashboard

Modern recruitment operations dashboard built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Prerequisites

- Node.js 18+
- Supabase project (hosted or local)
- `@huntsmenbarons.com` email domain access

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` with your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Run locally

```bash
npm run dev
```

## Database migrations

Apply all migrations via the Supabase CLI before going live:

```bash
supabase migration up
```

Or apply each file in `supabase/migrations/` via the Supabase SQL Editor.

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

## Security

- Row Level Security (RLS) is enabled on all tables
- Profile self-upgrades are blocked — users cannot escalate their own role
- Write/delete operations on data tables require record ownership or admin role
- LocalStorage auth fallback is disabled in production
- Dev API routes (`/api/dev/*`) are blocked in production
- Session concurrency is limited to 5 active sessions per user

## Go-live checklist

1. Apply all migrations to production Supabase
2. Set all env vars on host
3. Disable public signups in Supabase Auth dashboard
4. Create the first admin manually via Supabase before inviting users
5. Verify all RLS policies are active
