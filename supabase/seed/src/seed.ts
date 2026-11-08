/**
 * Demo data: one wedding (150 guests in 70 households, 4 events, 10 booked vendors, a
 * partly filled budget) plus 30 marketplace vendors.
 *
 *   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres pnpm seed
 *
 * Runs as the database owner in one transaction and is safe to re-run: previous demo rows
 * are removed first. Never point this at production.
 */
import { randomUUID } from 'node:crypto';
import { addDays } from '@aisle/domain';
import pg from 'pg';
import {
  BOOKED_VENDORS,
  DEMO_BUDGET_MINOR,
  DEMO_CURRENCY,
  DEMO_DATE,
  DEMO_EVENTS,
  DEMO_TZ,
  DEMO_WEDDING_SLUG,
  budgetPlan,
  buildHouseholds,
  buildListings,
} from './plan';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const TODAY = process.env.SEED_TODAY ?? new Date().toISOString().slice(0, 10);

if (
  /supabase\.co|pooler\.supabase\.com/.test(DATABASE_URL) &&
  process.env.SEED_ALLOW_REMOTE !== '1'
) {
  console.error('Refusing to seed a hosted database. Set SEED_ALLOW_REMOTE=1 for a dev project.');
  process.exit(1);
}

const DEMO_USERS = {
  alex: { email: 'alex@demo.aisle.test', name: 'Alex Morgan' },
  sam: { email: 'sam@demo.aisle.test', name: 'Sam Patel' },
  planner: { email: 'priya@demo.aisle.test', name: 'Priya Shah' },
  mum: { email: 'maggie@demo.aisle.test', name: 'Maggie Morgan' },
  vendor: { email: 'vendor@demo.aisle.test', name: 'Robin Hale' },
} as const;

type Client = pg.PoolClient | pg.Client;

async function one<T = Record<string, unknown>>(
  db: Client,
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const { rows } = await db.query(sql, params);
  if (!rows[0]) throw new Error(`Expected a row from: ${sql.slice(0, 80)}`);
  return rows[0] as T;
}

/** Create an auth user that can sign in by magic link, on real Supabase or the local shim. */
async function createUser(db: Client, email: string, name: string): Promise<string> {
  const cols = new Set(
    (
      await db.query<{ column_name: string }>(
        `select column_name from information_schema.columns where table_schema = 'auth' and table_name = 'users'`,
      )
    ).rows.map((r) => r.column_name),
  );
  // Real Supabase auth.users has no default id, so always supply one.
  const values: Record<string, unknown> = {
    id: randomUUID(),
    email,
    raw_user_meta_data: JSON.stringify({ full_name: name }),
    raw_app_meta_data: JSON.stringify({ provider: 'email', providers: ['email'] }),
  };
  if (cols.has('instance_id')) values.instance_id = '00000000-0000-0000-0000-000000000000';
  if (cols.has('aud')) values.aud = 'authenticated';
  if (cols.has('role')) values.role = 'authenticated';
  if (cols.has('email_confirmed_at')) values.email_confirmed_at = new Date().toISOString();
  if (cols.has('created_at')) values.created_at = new Date().toISOString();
  if (cols.has('updated_at')) values.updated_at = new Date().toISOString();
  // Supabase Auth reads these as strings; NULL breaks magic-link sign-in for seeded users.
  for (const c of [
    'confirmation_token',
    'recovery_token',
    'email_change_token_new',
    'email_change',
  ]) {
    if (cols.has(c)) values[c] = '';
  }

  const keys = Object.keys(values);
  const { id } = await one<{ id: string }>(
    db,
    `insert into auth.users (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
    keys.map((k) => values[k]),
  );

  const hasIdentities = await db.query(
    `select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'identities'`,
  );
  if (hasIdentities.rowCount) {
    await db.query(
      `insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
       values ($1, $1, $2, 'email', now(), now(), now())`,
      [id, JSON.stringify({ sub: id, email, email_verified: true })],
    );
  }
  return id;
}

async function place(
  db: Client,
  name: string,
  country: string,
  lat: number,
  lng: number,
  tz: string,
): Promise<string> {
  const { id } = await one<{ id: string }>(
    db,
    `insert into public.places (name, formatted_address, country_code, location, timezone)
     values ($1, $1, $2, extensions.st_setsrid(extensions.st_makepoint($4, $3), 4326)::extensions.geography, $5)
     returning id`,
    [name, country, lat, lng, tz],
  );
  return id;
}

async function cleanup(db: Client, listingSlugs: string[]) {
  await db.query(`delete from public.weddings where slug = $1`, [DEMO_WEDDING_SLUG]);
  await db.query(`delete from public.vendors where slug = any($1)`, [listingSlugs]);
  await db.query(`delete from auth.users where email = any($1)`, [
    Object.values(DEMO_USERS).map((u) => u.email),
  ]);
  await db.query(`delete from public.places where formatted_address like '%(demo)'`);
}

async function seed() {
  const db = new pg.Client({ connectionString: DATABASE_URL });
  await db.connect();
  const households = buildHouseholds();
  const listings = buildListings();

  try {
    await db.query('begin');
    await cleanup(
      db,
      listings.map((l) => l.slug),
    );

    // Users ------------------------------------------------------------------
    const users: Record<keyof typeof DEMO_USERS, string> = {} as never;
    for (const [key, u] of Object.entries(DEMO_USERS) as [
      keyof typeof DEMO_USERS,
      (typeof DEMO_USERS)[keyof typeof DEMO_USERS],
    ][]) {
      users[key] = await createUser(db, u.email, u.name);
    }

    // Categories -------------------------------------------------------------
    const categories = new Map(
      (
        await db.query<{ key: string; id: string }>(`select key, id from public.vendor_categories`)
      ).rows.map((r) => [r.key, r.id]),
    );

    // Marketplace ------------------------------------------------------------
    const listingIds: string[] = [];
    for (const [i, l] of listings.entries()) {
      const { id: vendorId } = await one<{ id: string }>(
        db,
        `insert into public.vendors (name, slug, country_code, currency, verification_status, created_by)
         values ($1, $2, $3, $4, 'verified', $5) returning id`,
        [l.vendorName, l.slug, l.country, l.currency, i === 0 ? users.vendor : null],
      );
      if (i === 0) {
        await db.query(
          `insert into public.vendor_members (vendor_id, user_id, role) values ($1, $2, 'owner')`,
          [vendorId, users.vendor],
        );
      }
      const { id: listingId } = await one<{ id: string }>(
        db,
        `insert into public.listings
           (vendor_id, category_id, title, summary, description, status, base_location, service_radius_km,
            currency, price_from_minor, capacity_max, style_tags, is_sponsored)
         values ($1, $2, $3, $4, $5, 'published',
                 extensions.st_setsrid(extensions.st_makepoint($7, $6), 4326)::extensions.geography,
                 $8, $9, $10, $11, $12, $13)
         returning id`,
        [
          vendorId,
          categories.get(l.categoryKey),
          `${l.vendorName} — ${l.city}`,
          `Demo listing for ${l.categoryKey.replace(/_/g, ' ')} near ${l.city}.`,
          'This is demo content created by the seed script.',
          l.lat,
          l.lng,
          l.categoryKey === 'venues' ? 0 : 80,
          l.currency,
          l.priceFromMinor,
          l.capacityMax,
          l.styleTags,
          l.sponsored,
        ],
      );
      listingIds.push(listingId);
    }

    // Wedding ----------------------------------------------------------------
    const venuePlace = await place(
      db,
      'Barnsley House, Cirencester (demo)',
      'GB',
      51.7464,
      -1.9119,
      DEMO_TZ,
    );
    const { id: weddingId } = await one<{ id: string }>(
      db,
      `insert into public.weddings
         (slug, partner_a_name, partner_b_name, date_mode, date_start, timezone, place_id, location_label,
          est_guest_count, total_budget_minor, currency, locale, style_tags, priorities, palette, created_by)
       values ($1, 'Alex', 'Sam', 'exact', $2, $3, $4, 'Cotswolds, England', 150, $5, $6, 'en-GB',
               '{garden,classic}', '{food,photos,music}', '{"accent":"#2E5A4C"}', $7)
       returning id`,
      [
        DEMO_WEDDING_SLUG,
        DEMO_DATE,
        DEMO_TZ,
        venuePlace,
        DEMO_BUDGET_MINOR,
        DEMO_CURRENCY,
        users.alex,
      ],
    );

    const members: Record<string, string> = {};
    for (const [key, role, relation] of [
      ['alex', 'owner', 'partner'],
      ['sam', 'owner', 'partner'],
      ['planner', 'editor', 'planner'],
      ['mum', 'viewer', 'family'],
    ] as const) {
      members[key] = (
        await one<{ id: string }>(
          db,
          `insert into public.wedding_members (wedding_id, user_id, role, relation, invited_by)
           values ($1, $2, $3, $4, $5) returning id`,
          [weddingId, users[key], role, relation, users.alex],
        )
      ).id;
    }
    await db.query(
      `insert into public.member_module_access (member_id, wedding_id, module, access) values ($1, $2, 'budget', 'none')`,
      [members.mum, weddingId],
    );

    // Events -----------------------------------------------------------------
    const eventIds: Record<string, string> = {};
    for (const [i, e] of DEMO_EVENTS.entries()) {
      eventIds[e.key] = (
        await one<{ id: string }>(
          db,
          `insert into public.events (wedding_id, kind, name, starts_at, ends_at, timezone, venue_label, dress_code,
                                      rsvp_deadline, sort_order, created_by)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
          [
            weddingId,
            e.kind,
            e.name,
            e.start,
            e.end,
            DEMO_TZ,
            e.venue,
            e.dress,
            `${addDays(DEMO_DATE, -42)}T23:00:00Z`,
            i,
            users.alex,
          ],
        )
      ).id;
    }
    const meals: string[] = [];
    for (const [name, child] of [
      ['Roast chicken, spring vegetables', false],
      ['Cod, samphire and brown butter', false],
      ['Wild mushroom risotto (v)', false],
      ['Children’s menu', true],
    ] as const) {
      meals.push(
        (
          await one<{ id: string }>(
            db,
            `insert into public.meal_options (event_id, wedding_id, name, for_children) values ($1, $2, $3, $4) returning id`,
            [eventIds.reception, weddingId, name, child],
          )
        ).id,
      );
    }

    // Guests, invitations, RSVPs ---------------------------------------------
    let guestCounter = 0;
    for (const h of households) {
      const { id: householdId } = await one<{ id: string }>(
        db,
        `insert into public.households (wedding_id, display_name, address, created_by) values ($1, $2, $3, $4) returning id`,
        [weddingId, h.displayName, JSON.stringify({ city: h.city, country: 'GB' }), users.alex],
      );
      for (const ev of h.invitedTo) {
        await db.query(
          `insert into public.invitations (household_id, event_id, wedding_id, sent_at) values ($1, $2, $3, $4)`,
          [
            householdId,
            eventIds[ev],
            weddingId,
            ev === 'brunch' ? null : `${addDays(TODAY, -20)}T10:00:00Z`,
          ],
        );
      }
      for (const [gi, g] of h.guests.entries()) {
        guestCounter += 1;
        const { id: guestId } = await one<{ id: string }>(
          db,
          `insert into public.guests (household_id, wedding_id, first_name, last_name, email, side, list, age_group,
                                      tags, dietary, plus_one_allowed, sort_order, created_by)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id`,
          [
            householdId,
            weddingId,
            g.firstName,
            g.lastName,
            g.email,
            g.side,
            g.list,
            g.ageGroup,
            g.tags,
            g.dietary,
            g.plusOneAllowed,
            gi,
            users.alex,
          ],
        );
        // About 60% of guests have replied; most are coming.
        const replied = guestCounter % 5 < 3;
        for (const ev of h.invitedTo) {
          const status = !replied ? 'awaiting' : guestCounter % 7 === 0 ? 'declined' : 'attending';
          const meal =
            ev === 'reception' && status === 'attending'
              ? g.ageGroup === 'adult'
                ? meals[guestCounter % 3]
                : meals[3]
              : null;
          await db.query(
            `insert into public.rsvps (guest_id, event_id, wedding_id, status, meal_option_id, responded_at, source)
             values ($1, $2, $3, $4, $5, $6, $7)`,
            [
              guestId,
              eventIds[ev],
              weddingId,
              status,
              meal,
              replied ? `${addDays(TODAY, -5)}T12:00:00Z` : null,
              replied ? 'guest' : 'couple',
            ],
          );
        }
      }
    }

    // Checklist --------------------------------------------------------------
    const templates = (
      await db.query<{
        id: string;
        title: string;
        category: string;
        offset_days: number;
        applies_when: object;
        sort_order: number;
      }>(
        `select id, title, category, offset_days, applies_when, sort_order from public.task_templates where is_active`,
      )
    ).rows.filter((tpl) => Object.keys(tpl.applies_when).length === 0);
    for (const [i, tpl] of templates.entries()) {
      const due = addDays(DEMO_DATE, tpl.offset_days);
      // Past-due tasks are mostly done; leave two overdue so the dashboard has something to nudge.
      const done = due < TODAY && i % 6 !== 5;
      await db.query(
        `insert into public.tasks (wedding_id, template_id, title, category, due_mode, offset_days, due_date, status,
                                   completed_at, completed_by, sort_order, created_by)
         values ($1, $2, $3, $4, 'relative', $5, $6, $7, $8, $9, $10, $11)`,
        [
          weddingId,
          tpl.id,
          tpl.title,
          tpl.category,
          tpl.offset_days,
          due,
          done ? 'done' : 'open',
          done ? `${due}T12:00:00Z` : null,
          done ? users.alex : null,
          tpl.sort_order,
          users.alex,
        ],
      );
    }

    // Budget -----------------------------------------------------------------
    const categoryIds: Record<string, string> = {};
    for (const [i, c] of budgetPlan().entries()) {
      categoryIds[c.key] = (
        await one<{ id: string }>(
          db,
          `insert into public.budget_categories (wedding_id, key, name, planned_bps, planned_minor, sort_order)
           values ($1, $2, $3, $4, $5, $6) returning id`,
          [weddingId, c.key, c.name, c.bps, c.plannedMinor, i],
        )
      ).id;
    }
    const { id: parentsId } = await one<{ id: string }>(
      db,
      `insert into public.contributors (wedding_id, name, pledged_minor, currency) values ($1, 'Alex’s parents', 500000, $2) returning id`,
      [weddingId, DEMO_CURRENCY],
    );

    // Vendors the couple has booked, each with a budget line.
    const vendorBudgetCategory: Record<string, string> = {
      venues: 'venue',
      catering: 'catering',
      photography: 'photo_video',
      videography: 'photo_video',
      florists: 'flowers_decor',
      music_band: 'music',
      music_dj: 'music',
      officiants: 'other',
      hair_makeup: 'attire',
      attire: 'attire',
      cakes: 'catering',
      rentals: 'flowers_decor',
      transport: 'transport',
    };
    for (const b of BOOKED_VENDORS) {
      const listing = 'listingIndex' in b ? listings[b.listingIndex] : undefined;
      const categoryKey = listing?.categoryKey ?? ('categoryKey' in b ? b.categoryKey : 'other');
      const name = listing?.vendorName ?? ('manual' in b ? b.manual : 'Vendor');
      const { id: wvId } = await one<{ id: string }>(
        db,
        `insert into public.wedding_vendors (wedding_id, listing_id, category_id, name, stage, agreed_total_minor, currency, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
        [
          weddingId,
          'listingIndex' in b ? listingIds[b.listingIndex] : null,
          categories.get(categoryKey),
          name,
          b.stage,
          b.agreedMinor,
          DEMO_CURRENCY,
          users.alex,
        ],
      );
      const { id: itemId } = await one<{ id: string }>(
        db,
        `insert into public.budget_items (wedding_id, category_id, name, currency, estimated_minor, actual_minor, wedding_vendor_id,
                                          contributor_id, created_by)
         values ($1, $2, $3, $4, $5, $5, $6, $7, $8) returning id`,
        [
          weddingId,
          categoryIds[vendorBudgetCategory[categoryKey] ?? 'other'],
          name,
          DEMO_CURRENCY,
          b.agreedMinor,
          wvId,
          categoryKey === 'venues' ? parentsId : null,
          users.alex,
        ],
      );
      const paid = b.stage === 'paid_in_full' ? b.agreedMinor : Math.round(b.agreedMinor * 0.25);
      await db.query(
        `insert into public.expense_payments (wedding_id, budget_item_id, amount_minor, currency, paid_on, contributor_id, notes, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          weddingId,
          itemId,
          paid,
          DEMO_CURRENCY,
          addDays(TODAY, -60),
          categoryKey === 'venues' ? parentsId : null,
          b.stage === 'paid_in_full' ? 'Paid in full' : 'Deposit',
          users.alex,
        ],
      );
    }

    // Per-guest and still-to-book items.
    await db.query(
      `insert into public.budget_items (wedding_id, category_id, name, currency, estimated_minor, is_per_guest, unit_minor,
                                        child_unit_minor, event_id, created_by)
       values ($1, $2, 'Drinks package', $3, 0, true, 3500, 800, $4, $5),
              ($1, $6, 'Favours', $3, 0, true, 300, 300, $4, $5)`,
      [
        weddingId,
        categoryIds.catering,
        DEMO_CURRENCY,
        eventIds.reception,
        users.alex,
        categoryIds.other,
      ],
    );
    await db.query(
      `insert into public.budget_items (wedding_id, category_id, name, currency, estimated_minor, created_by)
       values ($1, $2, 'Invitations and on-the-day stationery', $3, 90000, $4),
              ($1, $5, 'Wedding rings', $3, 150000, $4)`,
      [weddingId, categoryIds.stationery, DEMO_CURRENCY, users.alex, categoryIds.other],
    );

    await db.query('commit');

    const counts = await one<Record<string, string>>(
      db,
      `select
         (select count(*) from public.households where wedding_id = $1) as households,
         (select count(*) from public.guests where wedding_id = $1) as guests,
         (select count(*) from public.events where wedding_id = $1) as events,
         (select count(*) from public.wedding_vendors where wedding_id = $1 and stage in ('booked','paid_in_full')) as booked_vendors,
         (select count(*) from public.budget_items where wedding_id = $1) as budget_items,
         (select count(*) from public.tasks where wedding_id = $1) as tasks,
         (select count(*) from public.listings l join public.vendors v on v.id = l.vendor_id where v.slug = any($2) and l.status = 'published') as marketplace_listings`,
      [weddingId, listings.map((l) => l.slug)],
    );
    console.log('Seeded demo data:', counts);
    console.log(
      `Sign in as ${DEMO_USERS.alex.email} (couple), ${DEMO_USERS.planner.email} (planner, editor),`,
    );
    console.log(
      `${DEMO_USERS.mum.email} (viewer, budget hidden) or ${DEMO_USERS.vendor.email} (vendor owner).`,
    );
  } catch (err) {
    await db.query('rollback');
    throw err;
  } finally {
    await db.end();
  }
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
