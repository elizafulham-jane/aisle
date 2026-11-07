/**
 * Pure, deterministic description of the demo data. Kept separate from the database writes
 * so its shape (150 guests in 70 households, etc.) is unit-tested.
 */
import { allocate, money } from '@aisle/domain';
import { Faker, en, en_AU, en_GB } from '@faker-js/faker';

export const DEMO_SEED = 20270619;
export const DEMO_WEDDING_SLUG = 'demo-alex-and-sam';
export const DEMO_DATE = '2027-06-19';
export const DEMO_TZ = 'Europe/London';
export const DEMO_CURRENCY = 'GBP';
export const DEMO_BUDGET_MINOR = 3_000_000; // £30,000

export interface DemoGuest {
  firstName: string;
  lastName: string;
  ageGroup: 'adult' | 'child' | 'infant';
  side: 'a' | 'b' | 'both';
  list: 'A' | 'B';
  tags: string[];
  dietary: string[];
  email: string | null;
  plusOneAllowed: boolean;
}

export interface DemoHousehold {
  displayName: string;
  guests: DemoGuest[];
  city: string;
  invitedTo: Array<'welcome' | 'ceremony' | 'reception' | 'brunch'>;
}

/** Household make-up: 20 singles + 40 couples + 10 families of five = 70 households, 150 guests. */
export const HOUSEHOLD_MIX = [
  { kind: 'single', count: 20, adults: 1, children: 0 },
  { kind: 'couple', count: 40, adults: 2, children: 0 },
  { kind: 'family', count: 10, adults: 2, children: 3 },
] as const;

const DIETARY = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'nut_allergy',
  'dairy_free',
  'pescatarian',
] as const;

export function buildHouseholds(): DemoHousehold[] {
  const faker = new Faker({ locale: [en_GB, en], seed: DEMO_SEED });
  const households: DemoHousehold[] = [];
  let index = 0;

  for (const mix of HOUSEHOLD_MIX) {
    for (let i = 0; i < mix.count; i += 1) {
      index += 1;
      const lastName = faker.person.lastName();
      const side = (['a', 'b', 'both'] as const)[index % 3] ?? 'both';
      const tags = [faker.helpers.arrayElement(['family', 'friends', 'work', 'university'])];
      const list: 'A' | 'B' = index % 9 === 0 ? 'B' : 'A';
      const guests: DemoGuest[] = [];

      for (let a = 0; a < mix.adults; a += 1) {
        const firstName = faker.person.firstName();
        guests.push({
          firstName,
          lastName,
          ageGroup: 'adult',
          side,
          list,
          tags,
          dietary:
            faker.number.int({ min: 1, max: 10 }) <= 2 ? [faker.helpers.arrayElement(DIETARY)] : [],
          email: faker.internet
            .email({ firstName, lastName, provider: 'example.com' })
            .toLowerCase(),
          plusOneAllowed: mix.kind === 'single' && index % 4 === 0,
        });
      }
      for (let c = 0; c < mix.children; c += 1) {
        guests.push({
          firstName: faker.person.firstName(),
          lastName,
          ageGroup: c === 2 && index % 2 === 0 ? 'infant' : 'child',
          side,
          list,
          tags,
          dietary: [],
          email: null, // no contact details for children
          plusOneAllowed: false,
        });
      }

      const invitedTo: DemoHousehold['invitedTo'] = ['ceremony', 'reception'];
      if (index % 7 < 4) invitedTo.unshift('welcome'); // ~40 households
      if (index % 7 < 3) invitedTo.push('brunch'); //   ~30 households

      households.push({
        displayName:
          mix.kind === 'single'
            ? `${guests[0]?.firstName} ${lastName}`
            : mix.kind === 'couple'
              ? `${guests[0]?.firstName} & ${guests[1]?.firstName} ${lastName}`
              : `The ${lastName} family`,
        guests,
        city: faker.location.city(),
        invitedTo,
      });
    }
  }
  return households;
}

export const DEMO_EVENTS = [
  {
    key: 'welcome',
    kind: 'welcome_drinks',
    name: 'Welcome drinks',
    start: '2027-06-18T18:00:00+01:00',
    end: '2027-06-18T22:00:00+01:00',
    venue: 'The Swan, Bibury',
    dress: 'Smart casual',
  },
  {
    key: 'ceremony',
    kind: 'ceremony',
    name: 'Ceremony',
    start: '2027-06-19T14:00:00+01:00',
    end: '2027-06-19T14:45:00+01:00',
    venue: 'St Mary’s Church, Bibury',
    dress: 'Formal',
  },
  {
    key: 'reception',
    kind: 'reception',
    name: 'Reception',
    start: '2027-06-19T15:30:00+01:00',
    end: '2027-06-20T00:00:00+01:00',
    venue: 'Barnsley House, Cirencester',
    dress: 'Formal',
  },
  {
    key: 'brunch',
    kind: 'farewell_brunch',
    name: 'Farewell brunch',
    start: '2027-06-20T10:30:00+01:00',
    end: '2027-06-20T13:00:00+01:00',
    venue: 'Barnsley House, Cirencester',
    dress: 'Relaxed',
  },
] as const;

/** Default budget split in basis points (sums to 10,000). */
export const BUDGET_SPLIT = [
  { key: 'venue', name: 'Venue', bps: 3000 },
  { key: 'catering', name: 'Food and drink', bps: 2200 },
  { key: 'photo_video', name: 'Photography and video', bps: 1200 },
  { key: 'attire', name: 'Outfits and beauty', bps: 900 },
  { key: 'flowers_decor', name: 'Flowers and decor', bps: 800 },
  { key: 'music', name: 'Music and entertainment', bps: 700 },
  { key: 'stationery', name: 'Stationery', bps: 300 },
  { key: 'transport', name: 'Transport', bps: 300 },
  { key: 'other', name: 'Rings, favours and other', bps: 600 },
] as const;

export function budgetPlan() {
  const parts = allocate(
    money(DEMO_BUDGET_MINOR, DEMO_CURRENCY),
    BUDGET_SPLIT.map((c) => c.bps),
  );
  return BUDGET_SPLIT.map((c, i) => ({ ...c, plannedMinor: parts[i]?.amountMinor ?? 0 }));
}

export interface DemoListing {
  vendorName: string;
  slug: string;
  categoryKey: string;
  country: 'GB' | 'AU';
  currency: 'GBP' | 'AUD';
  city: string;
  lat: number;
  lng: number;
  priceFromMinor: number;
  capacityMax: number | null;
  styleTags: string[];
  sponsored: boolean;
}

const UK_CITIES = [
  { city: 'Cirencester', lat: 51.7189, lng: -1.968 },
  { city: 'Bath', lat: 51.3811, lng: -2.359 },
  { city: 'Oxford', lat: 51.752, lng: -1.2577 },
  { city: 'London', lat: 51.5072, lng: -0.1276 },
  { city: 'Bristol', lat: 51.4545, lng: -2.5879 },
];
const AU_CITIES = [
  { city: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { city: 'Byron Bay', lat: -28.6474, lng: 153.602 },
];

const LISTING_CATEGORIES = [
  'venues',
  'catering',
  'photography',
  'videography',
  'florists',
  'music_band',
  'music_dj',
  'officiants',
  'hair_makeup',
  'attire',
  'cakes',
  'planners',
  'rentals',
  'stationery',
  'transport',
] as const;

/** 30 marketplace vendors: 20 in the UK, 10 in Australia, two per category. */
export function buildListings(): DemoListing[] {
  const faker = new Faker({ locale: [en_GB, en_AU, en], seed: DEMO_SEED + 1 });
  return Array.from({ length: 30 }, (_, i) => {
    const uk = i < 20;
    const place = faker.helpers.arrayElement(uk ? UK_CITIES : AU_CITIES);
    const categoryKey = LISTING_CATEGORIES[i % LISTING_CATEGORIES.length] ?? 'venues';
    const word = faker.word.adjective({ length: { min: 4, max: 8 } });
    const name = `${word[0]?.toUpperCase()}${word.slice(1)} ${categoryKey.split('_').pop()?.replace(/s$/, '')} co.`;
    return {
      vendorName: name.replace(/\b(\w)/g, (m) => m.toUpperCase()),
      slug: `${word}-${categoryKey.replace(/_/g, '-')}-${i + 1}`.toLowerCase(),
      categoryKey,
      country: uk ? 'GB' : 'AU',
      currency: uk ? 'GBP' : 'AUD',
      city: place.city,
      lat: place.lat + faker.number.float({ min: -0.05, max: 0.05, fractionDigits: 4 }),
      lng: place.lng + faker.number.float({ min: -0.05, max: 0.05, fractionDigits: 4 }),
      priceFromMinor: faker.number.int({ min: 4, max: 120 }) * 10_000,
      capacityMax: categoryKey === 'venues' ? faker.number.int({ min: 80, max: 250 }) : null,
      styleTags: faker.helpers.arrayElements(
        ['rustic', 'modern', 'classic', 'garden', 'coastal', 'minimal'],
        2,
      ),
      sponsored: i % 10 === 0,
    };
  });
}

/** The ten vendors the demo couple has booked (indexes into buildListings + manual ones). */
export const BOOKED_VENDORS = [
  { listingIndex: 0, stage: 'paid_in_full', agreedMinor: 900_000 },
  { listingIndex: 1, stage: 'booked', agreedMinor: 640_000 },
  { listingIndex: 2, stage: 'booked', agreedMinor: 240_000 },
  { listingIndex: 4, stage: 'booked', agreedMinor: 180_000 },
  { listingIndex: 5, stage: 'booked', agreedMinor: 150_000 },
  { listingIndex: 7, stage: 'paid_in_full', agreedMinor: 45_000 },
  { listingIndex: 8, stage: 'booked', agreedMinor: 85_000 },
  { listingIndex: 10, stage: 'booked', agreedMinor: 60_000 },
  { manual: 'Aunt Jo’s Cakes', categoryKey: 'cakes', stage: 'booked', agreedMinor: 35_000 },
  {
    manual: 'Cotswold Classic Cars',
    categoryKey: 'transport',
    stage: 'booked',
    agreedMinor: 70_000,
  },
] as const;
