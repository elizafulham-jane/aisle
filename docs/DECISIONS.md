# Architecture decisions

Short records of decisions and why. Newest at the bottom. "Default" means a product question
the spec left open, answered with the most reversible option until the owner decides.

## D-001 Stack as specified; tRPC and Inngest

Using the stack from the spec. For the two either/or choices: **tRPC** (served by the Next.js
app at `/api/trpc`, called by web and mobile) and **Inngest** for background jobs (Phase 1).
Both approved on 2026-11-07.

## D-002 TypeScript 6.0, not 7.0

TypeScript 7.0 (native compiler) is the latest release, but `typescript-eslint` supports
`<6.1` and Expo SDK 58 pins `~6.0.3`. Pinned to 6.0.3 everywhere. Revisit when both support 7.

## D-003 Working name and placeholders

Codename **Aisle** (`@aisle/*` packages) until the brand is decided. Placeholders:
`example.com`, bundle id / package `com.example.aisle`, URL scheme `aisle://`. All live in
config (`app.json`, env files, i18n `app.name`), not in code.

## D-004 Shared UI: one token source, two component sets

`packages/ui/src/tokens.ts` is the only place colours, type, spacing, radii and motion are
defined. The web CSS (`src/web/tokens.css`, Tailwind v4 `@theme`) is generated from it and a
test fails if it drifts. Web components use Tailwind + Radix Slot; native components use React
Native styles that read the same tokens.

Deviation from what was proposed: NativeWind is **not** used on mobile yet. Plain styles from
tokens avoid a Babel/Metro plugin and are easy to swap later. A token-level contrast test
enforces WCAG AA for both light and dark.

## D-005 Design direction: "letterpress and myrtle"

Bright paper background, ink-dark text, hairline rules instead of shadows, one accent
(myrtle green, the evergreen traditionally carried in British bouquets). Headings in
**Libre Caslon Display** (the typeface family of letterpress invitations), interface text in
**Hanken Grotesk**. Both are OFL-licensed and **self-hosted** (fontsource on web, expo-google-fonts
on mobile), so no request ever goes to Google Fonts — avoids a GDPR transfer of visitor IPs.

## D-006 Data conventions

- Money: `bigint` minor units (`money_minor` domain, non-negative) + `currency_code` domain.
- Time: `timestamptz` (UTC); weddings and events carry an `iana_timezone`. Calendar-only
  values (wedding date, task due dates) are `date` in the wedding's own zone.
- Status columns are `text` + `CHECK` rather than Postgres enums (adding a value needs no
  enum migration gymnastics).
- Every tenant table carries `wedding_id` or `vendor_id`, even child tables, so each RLS
  check is one indexed lookup. Triggers reject child rows whose `wedding_id` doesn't match
  their parent.

## D-007 Permission model

- Roles per wedding: `owner` (max 2, at least 1, enforced by a deferred constraint trigger),
  `editor`, `contributor`, `viewer`.
- Per-module overrides (`member_module_access`): can lower an editor or viewer, cannot raise a
  viewer above view; contributors see nothing except modules explicitly granted, plus tasks
  assigned to them.
- Only owners manage members and invites.
- All checks are `security definer` helpers in the `app_private` schema (not exposed by the
  API). Policies call them; tests in `supabase/tests` prove isolation.

## D-008 pnpm with hoisted node_modules

`node-linker=hoisted` in `.npmrc`. Expo supports isolated installs since SDK 54 but documents
hoisting as the fix when native packages misbehave; hoisting also guarantees one copy of React
for web and mobile. Revisit if install size becomes a problem.

## D-009 Writes that must be atomic go through RPCs

`create_wedding`, `accept_member_invite` and `create_vendor` are `security definer` functions
so the row and the caller's membership are created in one transaction. Direct inserts into
`weddings` are not allowed by RLS.

## D-010 Database tests without Docker

This build workspace cannot pull container images, so `scripts/db-test.sh` falls back to a
throwaway Postgres 16 with a small Supabase shim (`supabase/local/supabase_shim.psql`: API
roles, `auth.users`, `auth.uid()`), applies every migration and runs the same pgTAP files.
CI runs them against the real Supabase stack (`supabase start`, `supabase test db`).

## D-011 Generated database types

`packages/db/src/database.types.ts` was generated from the shim database
(`scripts/gen-types.sh`). The CI check comparing it with types generated from real Supabase
is advisory until the first regeneration on a machine with Docker, then becomes blocking.

## D-012 Authentication flows

- Web: `@supabase/ssr` with cookies; `proxy.ts` (Next.js 16) refreshes sessions and guards
  `/app`, `/vendor`, `/admin`. Server code trusts only `getClaims()` (signature-checked).
- Magic links: `/auth/callback` accepts both `?code=` (same browser, PKCE) and
  `?token_hash=&type=` (opened on another device). The second needs the Supabase email
  template change described in the README.
- Mobile: PKCE with deep link `aisle://auth/callback`. Apple uses native Sign in with Apple on
  iOS and the browser flow elsewhere. Google uses the browser flow for now (works in Expo Go
  and dev builds); the native Google SDK can replace it later without schema changes.
- Open redirects are blocked (`safeRedirectPath`).

## D-013 Mobile session storage

Phase 0 stores the Supabase session in AsyncStorage (Supabase's documented default).
**To do in Phase 1:** move to an encrypted store (key in `expo-secure-store`) before any real
user data is on devices.

## D-014 Reference data vs demo data

Vendor categories, starter checklist templates, plans, entitlements and feature flags are in a
migration (every environment needs them). Demo data is only in `supabase/seed` (TypeScript,
deterministic, re-runnable, refuses hosted databases unless `SEED_ALLOW_REMOTE=1`).

## D-015 Launch markets

Australia and the United Kingdom: currencies **AUD** and **GBP**, locales **en-AU** and
**en-GB** (en-AU falls back to en-GB). Production database region (London, Sydney, or one per
market) is open; the dev project's region doesn't matter.

## D-016 Feature flags and entitlements

Database tables are the source of truth for entitlements and kill switches (readable by RLS
and server code). PostHog flags are only for experiments and gradual rollouts.

## D-017 Product defaults for open questions (approve or change any)

| #   | Topic                       | Default                                                                                                                                                                                   |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | Modules with no phase       | Address collection, RSVP reminders, contributors, gift tracking, documents → Phase 1. Collaborator chat → Phase 2. Mood boards, invitation design, announcements, SMS/WhatsApp → Phase 5. |
| 10  | Booking vs Phase 2          | Accepting a quote creates a `pending` booking, `confirmed` in Phase 3. My vendors has a "Quote accepted" stage.                                                                           |
| 11  | Undated weddings            | Tasks show in time-to-go buckets with no dates; a range uses its start date.                                                                                                              |
| 12  | Per-guest headcount         | Attending + awaiting until the RSVP deadline, then attending only. Optional child price per item.                                                                                         |
| 13  | FX                          | Budget in wedding currency; foreign amounts keep original currency plus a converted amount at a stored daily rate (provider to choose).                                                   |
| 14  | Contributor role            | Assigned tasks + modules explicitly granted.                                                                                                                                              |
| 15  | Planners                    | Owners are always the couple; planners join as editors.                                                                                                                                   |
| 16  | RSVP name-search check      | Couple chooses email, postcode or a custom question; email preselected.                                                                                                                   |
| 17  | Vendor access to guest data | Counts only; named exports shared per vendor by the couple and audit-logged.                                                                                                              |
| 18  | Stripe fees                 | Vendor is merchant of record and bears processing fees (confirm charge type against Stripe docs in Phase 3).                                                                              |
| 19  | Cash fund                   | Phase 5 behind flag `gifts.cash_fund`, off.                                                                                                                                               |
| 20  | E-signature                 | Built-in simple e-signature with audit trail; lawyer to confirm for AU/UK.                                                                                                                |
| 21  | WhatsApp                    | Share links first; templates once Meta approves (flag `messaging.whatsapp_templates`).                                                                                                    |
| 22  | Offline                     | Day-of read-only plus check-offs; guest list, seating, contacts read-only.                                                                                                                |
| 23  | Malware scanning            | ClamAV in a background job.                                                                                                                                                               |
| 25  | Reviews                     | Off-platform vendors can't be reviewed.                                                                                                                                                   |
| 26  | Flags                       | See D-016.                                                                                                                                                                                |

## D-018 Phone OTP moves to Phase 1

Phase 0 ships magic link, Apple and Google. Phone OTP needs Twilio, which arrives in Phase 1.
