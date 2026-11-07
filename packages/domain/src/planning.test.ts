import { describe, expect, it } from 'vitest';
import { addDays, bucketForOffset, rescheduledDueDate } from './planning';

describe('bucketForOffset', () => {
  it.each([
    [-400, '12_plus_months'],
    [-300, '9_months'],
    [-200, '6_months'],
    [-120, '4_months'],
    [-60, '2_months'],
    [-30, '1_month'],
    [-7, 'final_week'],
    [0, 'final_week'],
    [1, 'day_after'],
  ] as const)('%i days → %s', (offset, bucket) => {
    expect(bucketForOffset(offset)).toBe(bucket);
  });
});

describe('addDays', () => {
  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
    expect(addDays('2027-12-31', 1)).toBe('2028-01-01');
  });

  it('is unaffected by daylight-saving changes', () => {
    // UK clocks go forward on 2027-03-28.
    expect(addDays('2027-03-27', 2)).toBe('2027-03-29');
  });
});

describe('rescheduledDueDate', () => {
  const open = {
    status: 'open',
    dueMode: 'relative',
    offsetDays: -90,
    dueDate: '2027-03-01',
  } as const;

  it('moves open relative tasks with the wedding date', () => {
    expect(rescheduledDueDate(open, '2027-09-18')).toBe('2027-06-20');
  });

  it('leaves completed tasks where they are', () => {
    expect(rescheduledDueDate({ ...open, status: 'done' }, '2027-09-18')).toBe('2027-03-01');
  });

  it('leaves fixed-date tasks where they are', () => {
    expect(rescheduledDueDate({ ...open, dueMode: 'fixed' }, '2027-09-18')).toBe('2027-03-01');
  });

  it('clears relative due dates when the wedding date is unset', () => {
    expect(rescheduledDueDate(open, null)).toBeNull();
  });
});
