import { describe, expect, it } from 'vitest';
import {
  CurrencyMismatchError,
  add,
  allocate,
  formatMoney,
  money,
  multiply,
  parseMoneyInput,
  sum,
} from './money';

describe('money', () => {
  it('rejects fractional minor units and bad currency codes', () => {
    expect(() => money(10.5, 'GBP')).toThrow(RangeError);
    expect(() => money(100, 'gbp')).toThrow(RangeError);
  });

  it('adds and sums within one currency', () => {
    expect(add(money(1999, 'GBP'), money(1, 'GBP'))).toEqual(money(2000, 'GBP'));
    expect(sum([money(10, 'AUD'), money(20, 'AUD'), money(30, 'AUD')], 'AUD')).toEqual(
      money(60, 'AUD'),
    );
  });

  it('refuses to mix currencies', () => {
    expect(() => add(money(1, 'GBP'), money(1, 'AUD'))).toThrow(CurrencyMismatchError);
  });

  it('multiplies by integer headcounts only', () => {
    expect(multiply(money(8550, 'GBP'), 120)).toEqual(money(1_026_000, 'GBP'));
    expect(() => multiply(money(100, 'GBP'), 1.5)).toThrow(RangeError);
  });
});

describe('allocate', () => {
  it('always sums exactly to the total', () => {
    const total = money(2_500_001, 'GBP');
    const parts = allocate(total, [4000, 1000, 1000, 1500, 800, 700, 1000]);
    expect(parts.reduce((a, p) => a + p.amountMinor, 0)).toBe(total.amountMinor);
  });

  it('splits £100 three ways as 33.34/33.33/33.33', () => {
    expect(allocate(money(10000, 'GBP'), [1, 1, 1]).map((m) => m.amountMinor)).toEqual([
      3334, 3333, 3333,
    ]);
  });

  it('handles zero weights and empty input', () => {
    expect(allocate(money(100, 'GBP'), [0, 0]).map((m) => m.amountMinor)).toEqual([0, 0]);
    expect(allocate(money(100, 'GBP'), [])).toEqual([]);
  });
});

describe('formatting and parsing', () => {
  it('formats GBP and AUD for their locales', () => {
    expect(formatMoney(money(123456, 'GBP'), 'en-GB')).toBe('£1,234.56');
    expect(formatMoney(money(123456, 'AUD'), 'en-AU')).toBe('$1,234.56');
  });

  it('parses user input without floating point', () => {
    expect(parseMoneyInput('1,234.56', 'GBP')).toEqual(money(123456, 'GBP'));
    expect(parseMoneyInput('0.1', 'GBP')).toEqual(money(10, 'GBP'));
    expect(parseMoneyInput('19.99', 'AUD')).toEqual(money(1999, 'AUD'));
    expect(parseMoneyInput('1.234', 'GBP')).toBeNull();
    expect(parseMoneyInput('-5', 'GBP')).toBeNull();
    expect(parseMoneyInput('abc', 'GBP')).toBeNull();
  });
});
