# Progress

| Phase                                  | Status                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| 0 Foundations                          | **Built — awaiting review.** Two criteria need accounts to verify (see below). |
| 1 Couple MVP                           | Not started                                                                    |
| 2 Vendor marketplace                   | Not started                                                                    |
| 3 Payments and contracts               | Not started                                                                    |
| 4 AI assistant                         | Not started                                                                    |
| 5 Wedding day and guest experience     | Not started                                                                    |
| 6 Post-wedding, admin depth and launch | Not started                                                                    |

## Phase 0 — Foundations (2026-11-07)

### Built

- Turborepo + pnpm monorepo, strict TypeScript 6.0, ESLint flat config, Prettier.
- Design tokens (light/dark, WCAG-checked) and component library: web (Tailwind v4, Storybook)
  and native (React Native).
- Schema v1 (8 migrations): identity, staff roles, audit log, weddings, members with
  per-module permissions, invites, events, places, guests/households/invitations/RSVPs,
  checklist, budget, vendors/listings/My vendors, plans/entitlements/flags, consents, privacy
  requests, reference data. RLS on every table.
- pgTAP tests (72 assertions): RLS enabled everywhere, wedding isolation, collaborator
  permissions, vendor isolation and moderation, entitlements.
- Typed API (tRPC) in `packages/api`, served by the web app, used by web and mobile.
- Web: sign-in (magic link, Apple, Google), auth callback for same-device and cross-device
  links, session-refreshing proxy, protected couple home with "create wedding".
- Mobile: Expo Router app with sign-in (magic link, native Apple on iOS, Google), deep-link
  callback, protected home calling the shared API.
- Domain, validation, i18n packages with unit tests (money maths, due-date rescheduling,
  time-zone formatting, redirects).
- Seed script: 150 guests in 70 households, 4 events, 10 booked vendors, partly filled budget,
  43 tasks, 30 marketplace vendors; four demo logins.
- GitHub Actions CI: format, lint, types, unit tests, web build, Storybook build, Playwright,
  and a Supabase job (migrations, pgTAP, seed twice).

### Acceptance criteria

| Criterion                                                                       | Result                                                                                                                                                                                                                     | Evidence                                                                     |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Sign up and sign in on iOS, Android and web with magic link, Apple and Google   | **Partly verified.** Code complete; web sign-in screens pass E2E; iOS and Android bundles compile. End-to-end sign-in **blocked** until a Supabase project, Google OAuth client and Apple Developer account are connected. | `apps/web/e2e/auth.spec.ts` (10 passing), `expo export` for iOS and Android  |
| CI runs lint, type checks and tests on every PR; web preview deploys per branch | **Partly verified.** Workflow written and every step passes locally; first real run happens once the repo is on GitHub. Previews **blocked** until Vercel is connected.                                                    | `.github/workflows/ci.yml`                                                   |
| RLS tests prove user A cannot read or write wedding B                           | **Pass**                                                                                                                                                                                                                   | `supabase/tests/010_wedding_isolation.test.sql` (32 assertions) plus 020–040 |

### Known issues

- Mobile stores the session in AsyncStorage; move to encrypted storage in Phase 1 (D-013).
- Generated DB types came from a local shim; the CI types check is advisory until regenerated
  against real Supabase (D-011).
- Phone OTP deferred to Phase 1 (D-018).
- Sentry and PostHog are not wired yet (Phase 1, once projects exist).
- Bundle id `com.example.aisle` and the "Aisle" name are placeholders (D-003).
