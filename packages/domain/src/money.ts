/**
 * Money is always an integer number of minor units (pence, cents) plus an ISO 4217 code.
 * Arithmetic stays in integers; formatting is the only place decimals appear.
 */
export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

const CURRENCY_RE = /^[A-Z]{3}$/;

export class CurrencyMismatchError extends Error {
  constructor(a: string, b: string) {
    super(`Cannot combine ${a} with ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}

function assertMinor(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`Money amounts must be safe integers of minor units, got ${amountMinor}`);
  }
}

export function money(amountMinor: number, currency: string): Money {
  assertMinor(amountMinor);
  if (!CURRENCY_RE.test(currency)) {
    throw new RangeError(`Invalid currency code: ${currency}`);
  }
  return { amountMinor, currency };
}

/** Number of minor units in one major unit for a currency (e.g. 100 for GBP, 0 decimals for JPY). */
export function minorUnitDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function sum(items: readonly Money[], currency: string): Money {
  return items.reduce((acc, m) => add(acc, m), money(0, currency));
}

/** Multiply by an integer quantity (e.g. unit price x headcount). */
export function multiply(m: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) throw new RangeError('Quantity must be an integer');
  return money(m.amountMinor * quantity, m.currency);
}

/**
 * Split a total by weights (e.g. basis points) using the largest-remainder method so the
 * parts always add up exactly to the total. Ties go to the earlier weight.
 */
export function allocate(total: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) return [];
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) {
    throw new RangeError('Weights must be non-negative integers');
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) return weights.map(() => money(0, total.currency));

  const raw = weights.map((w) => {
    const product = BigInt(total.amountMinor) * BigInt(w);
    const floor = product / BigInt(weightSum);
    const remainder = product % BigInt(weightSum);
    return { floor: Number(floor), remainder: Number(remainder) };
  });

  let leftover = total.amountMinor - raw.reduce((a, r) => a + r.floor, 0);
  const order = raw
    .map((r, i) => ({ i, remainder: r.remainder }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);

  const amounts = raw.map((r) => r.floor);
  for (const { i } of order) {
    if (leftover <= 0) break;
    amounts[i] = (amounts[i] ?? 0) + 1;
    leftover -= 1;
  }
  return amounts.map((a) => money(a, total.currency));
}

/** Format for display in the user's locale, e.g. formatMoney(money(123456,'GBP'),'en-GB') → "£1,234.56". */
export function formatMoney(m: Money, locale: string): string {
  const digits = minorUnitDigits(m.currency);
  const major = m.amountMinor / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
}

/**
 * Parse user input like "1,234.56" or "1234" into minor units without floating point.
 * Returns null for anything that isn't a plain non-negative decimal amount.
 */
export function parseMoneyInput(input: string, currency: string): Money | null {
  const digits = minorUnitDigits(currency);
  const cleaned = input.trim().replace(/[\s,]/g, '');
  const match = /^(\d+)(?:\.(\d*))?$/.exec(cleaned);
  if (!match) return null;
  const whole = match[1] ?? '0';
  const fraction = match[2] ?? '';
  if (fraction.length > digits) return null;
  const minorStr = whole + fraction.padEnd(digits, '0');
  const amountMinor = Number(minorStr);
  if (!Number.isSafeInteger(amountMinor)) return null;
  return money(amountMinor, currency);
}
