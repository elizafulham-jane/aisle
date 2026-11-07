import { describe, expect, it } from 'vitest';
import {
  BOOKED_VENDORS,
  BUDGET_SPLIT,
  DEMO_BUDGET_MINOR,
  DEMO_EVENTS,
  budgetPlan,
  buildHouseholds,
  buildListings,
} from './plan';

describe('demo data plan', () => {
  const households = buildHouseholds();
  const guests = households.flatMap((h) => h.guests);

  it('has 150 guests in 70 households', () => {
    expect(households).toHaveLength(70);
    expect(guests).toHaveLength(150);
  });

  it('has 4 events', () => {
    expect(DEMO_EVENTS).toHaveLength(4);
  });

  it('never stores contact details for children', () => {
    expect(guests.filter((g) => g.ageGroup !== 'adult').every((g) => g.email === null)).toBe(true);
  });

  it('invites every household to ceremony and reception, and some to the extras', () => {
    expect(
      households.every(
        (h) => h.invitedTo.includes('ceremony') && h.invitedTo.includes('reception'),
      ),
    ).toBe(true);
    const welcome = households.filter((h) => h.invitedTo.includes('welcome')).length;
    expect(welcome).toBeGreaterThan(30);
    expect(welcome).toBeLessThan(70);
  });

  it('is deterministic', () => {
    expect(buildHouseholds()[0]).toEqual(households[0]);
    expect(buildListings()[5]).toEqual(buildListings()[5]);
  });

  it('has 30 marketplace vendors with unique slugs', () => {
    const listings = buildListings();
    expect(listings).toHaveLength(30);
    expect(new Set(listings.map((l) => l.slug)).size).toBe(30);
  });

  it('books exactly 10 vendors', () => {
    expect(BOOKED_VENDORS).toHaveLength(10);
  });

  it('splits the budget to the penny', () => {
    expect(BUDGET_SPLIT.reduce((a, c) => a + c.bps, 0)).toBe(10_000);
    expect(budgetPlan().reduce((a, c) => a + c.plannedMinor, 0)).toBe(DEMO_BUDGET_MINOR);
  });
});
