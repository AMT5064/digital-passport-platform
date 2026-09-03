# Base44 Dev Environment

## Stack
- **Next.js 15** (Pages Router) + TypeScript + Tailwind CSS
- **Prisma 5** + **PostgreSQL 16** (compose service `postgres`)
- **NextAuth.js** (credentials/JWT strategy) — `lib/auth.ts`
- Dev server: `next dev -H 0.0.0.0 -p 3000`

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d
```
The `app` service startup command (runs every boot, in order):
1. `apt-get install openssl ca-certificates` — Prisma schema engine needs OpenSSL (node:20-slim lacks it)
2. `npm install --legacy-peer-deps`
3. `prisma generate` + `prisma db push` (creates/mirrors schema)
4. `tsx prisma/seed.ts` — seeds admin accounts, event, zones, activities, sample attendees/scans
5. `next dev -H 0.0.0.0 -p 3000`

`node_modules` and `.next` are anonymous volumes (persist across restarts, not overwritten by bind mount).

## Key fixes applied for this environment
- **`@next-auth/prisma-adapter`** was imported in `lib/auth.ts` but missing from `package.json` — added as a dependency.
- **Seed idempotency**: `prisma/seed.ts` used `scan.create` which failed on re-run due to the `@@unique([userId, zoneId, eventId])` constraint (and the non-zero exit blocked `next dev` from starting). Changed to `scan.upsert` keyed on the compound unique.
- **`allowedDevOrigins`** in `next.config.js` must use the **bare hostname** (`3000-${BASE44_PUBLIC_HOST_SUFFIX}`), NOT a full `https://` origin — Next.js compares against `parsedOrigin.hostname` only.
- `BASE44_PUBLIC_HOST_SUFFIX` is passed into the `app` service via compose `environment:`.

## No external secrets required
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` are local defaults in `.env.base44-defaults`.
- `RESEND_API_KEY` is listed in `.env.example` but not referenced in code — optional, not needed to boot.

## Seed credentials (for testing)
- Super Admin: `admin@digitialpassport.com` / `Admin@123`
- Event Admin: `admin@techsummit.com` / `Manager@123`
- Attendee: `john@example.com` / `User@123`

## Verifying it works
```bash
docker compose -f docker-compose.base44.yml ps
curl -sf http://localhost:3000/   # should return HTML
```
The login page is at `/login`; the admin dashboard at `/admin`.
