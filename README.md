# Aisle (working name)

A wedding organisation platform: couples plan everything in one place, vendors are discovered,
booked and paid through a marketplace, and guests get what they need without friction.
iOS, Android and web.

- Build status by phase: [`docs/PROGRESS.md`](docs/PROGRESS.md)
- Why things are the way they are: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Data model: [`docs/SCHEMA.md`](docs/SCHEMA.md)

## Repository layout

```
apps/
  web/        Next.js 16 (App Router): couple dashboard, vendor portal, admin, wedding sites, typed API
  mobile/     Expo SDK 58 + Expo Router: couple and guest app
packages/
  api/        tRPC routers (business logic; RLS still applies)
  config/     shared TypeScript and ESLint config
  db/         generated database types and helpers
  domain/     pure business logic (money, scheduling) with unit tests
  i18n/       message catalogues (ICU), locale and time-zone formatting
  ui/         design tokens, web components (+ Storybook), native components
  validation/ Zod schemas shared by client and server
supabase/
  migrations/ schema, RLS, reference data (append-only)
  tests/      pgTAP tests (RLS isolation, permissions, entitlements)
  seed/       demo data script
scripts/      database test and type-generation helpers
```

## Prerequisites

- Node 22+, pnpm 10 (`corepack enable`)
- For the full local backend: Docker + the [Supabase CLI](https://supabase.com/docs/guides/local-development)
- For database tests without Docker: Postgres 16 with PostGIS and pgTAP (`postgresql-16-postgis-3`, `postgresql-16-pgtap`)
- For mobile: Xcode / Android Studio for dev builds, or an Expo account for EAS builds

## First run

```bash
pnpm install
supabase start            # local Postgres, Auth, Storage (prints URL and keys)
supabase db reset         # apply all migrations
pnpm seed                 # demo wedding + 30 marketplace vendors
cp apps/web/.env.example apps/web/.env.local       # fill in values from `supabase start`
cp apps/mobile/.env.example apps/mobile/.env.local
pnpm --filter @aisle/web dev                       # http://localhost:3000
pnpm --filter @aisle/mobile dev                    # Expo dev server
```

Local magic-link emails appear in the Supabase mail inbox printed by `supabase start`.
Demo accounts (sign in by magic link): `alex@demo.aisle.test` (couple),
`priya@demo.aisle.test` (planner, editor), `maggie@demo.aisle.test` (viewer, budget hidden),
`vendor@demo.aisle.test` (vendor owner).

## Everyday commands

| Command                                      | What it does                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | All packages, via Turborepo                                                    |
| `pnpm db:test`                               | Migrations + pgTAP tests (real Supabase if running, else a throwaway Postgres) |
| `pnpm db:types`                              | Regenerate `packages/db/src/database.types.ts` after a migration               |
| `pnpm seed`                                  | Re-create demo data (safe to re-run; refuses hosted databases)                 |
| `pnpm --filter @aisle/web test:e2e`          | Playwright tests (desktop + mobile viewports)                                  |
| `pnpm --filter @aisle/ui storybook`          | Component library on http://localhost:6006                                     |
| `pnpm --filter @aisle/ui build:css`          | Regenerate web token CSS after editing `tokens.ts`                             |

Schema changes: add a new file in `supabase/migrations/` (never edit one that has been applied),
then `pnpm db:test` and `pnpm db:types`.

## Environment variables

Templates: [`apps/web/.env.example`](apps/web/.env.example), [`apps/mobile/.env.example`](apps/mobile/.env.example).
Both apps validate their environment at start-up and fail with a clear message if something
is missing. Never commit `.env*` files other than the examples.

## Connecting real services

### Supabase project (dev)

1. Create a project. Copy the URL and publishable key into both `.env.local` files.
2. `supabase link --project-ref <ref>` then `supabase db push` to apply migrations.
3. **Auth → URL configuration**: site URL `http://localhost:3000` (dev); redirect URLs
   `http://localhost:3000/auth/callback**`, `https://*-<team>.vercel.app/auth/callback**`,
   `aisle://auth/callback**`.
4. **Auth → Email templates → Magic link**: so links work when opened on a different device,
   set the link to:
   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
5. **Auth → Providers**: enable Apple and Google (below).

### GitHub secrets for database deploys

The `Deploy database (dev)` workflow applies new migrations to the dev project. In the repo's
**Settings → Secrets and variables → Actions**, add `SUPABASE_PROJECT_REF` (the 20-letter
ref), `SUPABASE_DB_PASSWORD`, and `SUPABASE_ACCESS_TOKEN`. Create the token in Supabase under
**Account → Access Tokens**, limited to the dev project, with: Project Settings (Read),
API Keys (Read), API Key Secrets (Read), Connection Pooling (Read), Database (Read-write),
Migrations (Read-write).

### Google sign-in (Google Cloud)

Create an OAuth client of type _Web application_ with redirect URI
`https://<project-ref>.supabase.co/auth/v1/callback`. Put its client id and secret in
Supabase → Auth → Providers → Google. (Native Android/iOS client ids are added later if we
switch mobile to the native Google SDK — see D-012.)

### Sign in with Apple (Apple Developer account)

Create an App ID with Sign in with Apple, a Services ID for web
(return URL `https://<project-ref>.supabase.co/auth/v1/callback`) and a key. In Supabase,
add the Services ID **and** the iOS bundle id as client ids, plus the generated secret.

### Vercel (web previews)

Import the GitHub repo, set **Root Directory** to `apps/web`, add the `NEXT_PUBLIC_*`
variables. Every branch gets a preview deployment.

### EAS (mobile builds)

`npx eas-cli@latest init` in `apps/mobile`, then
`npx eas-cli@latest build --profile development --platform all`.
Replace `com.example.aisle` in `app.json` with the real identifier first.
