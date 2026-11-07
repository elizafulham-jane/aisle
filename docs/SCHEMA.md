# Data model

Source of truth: `supabase/migrations/`. This page summarises it. Tables marked _(planned)_
arrive in the phase shown; everything else exists in schema v1.

## Conventions

- Every tenant row has `wedding_id` or `vendor_id`; RLS enforces it on every table.
- Money: `bigint` minor units + `currency_code`. Time: `timestamptz` UTC + IANA zone per
  wedding/event. Status: `text` + `CHECK`.
- Soft delete (`deleted_at`) and `audit_log` triggers on guests, households, members,
  invites, payments (and contracts/signatures when they arrive).
- Permission helpers live in `app_private` (not exposed through the API):
  `has_wedding_access(wedding_id, module, 'view'|'edit')`, `is_task_assignee(task_id)`,
  `has_vendor_role(vendor_id, min_role)`, `is_staff(roles)`.

## Identity, weddings and collaboration (v1)

```mermaid
erDiagram
  profiles ||--o{ wedding_members : joins
  profiles ||--o{ vendor_members : joins
  profiles ||--o{ staff_roles : admin
  weddings ||--o{ wedding_members : has
  wedding_members ||--o{ member_module_access : overrides
  weddings ||--o{ member_invites : pending
  weddings ||--o{ events : has
  places ||--o{ events : venue
  places ||--o{ weddings : location
  vendors ||--o{ vendor_members : has
```

## Guests and RSVP (v1) and seating (Phase 5)

```mermaid
erDiagram
  weddings ||--o{ households : has
  households ||--o{ guests : contains
  guests |o--o| guests : "plus-one of"
  households ||--o{ invitations : receives
  events ||--o{ invitations : for
  guests ||--o{ rsvps : answers
  events ||--o{ rsvps : for
  events ||--o{ meal_options : offers
  meal_options |o--o{ rsvps : chosen
  weddings ||--o{ rsvp_questions : asks
  events ||--o| seating_layouts : "planned"
  seating_layouts ||--o{ layout_elements : "planned"
  layout_elements ||--o{ seat_assignments : "planned"
  seating_layouts ||--o{ seating_rules : "planned"
```

## Planning and budget (v1); run-of-show (Phase 5)

```mermaid
erDiagram
  weddings ||--o{ tasks : has
  task_templates |o--o{ tasks : seeds
  tasks |o--o{ tasks : subtask
  tasks ||--o{ task_assignees : assigned
  wedding_members ||--o{ task_assignees : does
  tasks }o--o| wedding_vendors : about
  tasks }o--o| budget_items : about
  weddings ||--o{ budget_categories : has
  budget_categories ||--o{ budget_items : has
  events |o--o{ budget_items : "per-guest basis"
  budget_items ||--o{ expense_payments : "off-platform"
  contributors |o--o{ expense_payments : "paid by"
  events ||--o{ timeline_items : "planned"
```

## Vendors (v1 basics; deals in Phases 2–3)

```mermaid
erDiagram
  vendor_categories ||--o{ listings : classifies
  vendors ||--o{ listings : has
  weddings ||--o{ wedding_vendors : "My vendors"
  listings |o--o{ wedding_vendors : "if on platform"
  listings ||--o{ packages : "planned"
  wedding_vendors ||--o{ enquiries : "planned"
  enquiries ||--o{ quotes : "planned"
  quotes ||--o| contracts : "planned"
  quotes ||--o| bookings : "planned"
  bookings ||--|| payment_schedules : "planned"
  payment_schedules ||--|{ instalments : "planned"
  instalments ||--o{ payments : "planned"
```

## Business and platform (v1)

```mermaid
erDiagram
  plans ||--o{ plan_entitlements : grants
  vendors ||--o{ entitlement_overrides : has
  weddings ||--o{ entitlement_overrides : has
  profiles ||--o{ consents : gives
  profiles ||--o{ privacy_requests : files
```

Also: `feature_flags`, `audit_log`.

Planned later: messaging (`conversations`, `messages`), content (`websites`,
`website_sections`, `invitation_designs`, `mood_boards`, `documents`), guest media
(`albums`, `photos`, `guestbook_entries`), gifts (`registry_links`, `gifts`, `thank_yous`),
money (`payouts`, `refunds`, `ledger_entries`, `stripe_events`), AI (`ai_conversations`,
`ai_usage`), and `subscriptions`/`promo_codes`. The full proposed diagrams are in the Phase 0
proposal and will be added here as each table lands.
