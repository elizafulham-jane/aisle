// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { buildTokenCss } from './css';
import { colors } from './tokens';

describe('colour contrast (WCAG 2.2 AA)', () => {
  for (const mode of ['light', 'dark'] as const) {
    const c = colors[mode];
    it(`${mode}: body text on background and surface ≥ 4.5`, () => {
      expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.text, c.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: muted text on background and surface ≥ 4.5`, () => {
      expect(contrastRatio(c.textMuted, c.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, c.surface)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: text on accent buttons ≥ 4.5`, () => {
      expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.onAccent, c.accentPressed)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: accent as link text ≥ 4.5`, () => {
      expect(contrastRatio(c.accent, c.background)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: focus ring and strong borders ≥ 3 (non-text)`, () => {
      expect(contrastRatio(c.focus, c.background)).toBeGreaterThanOrEqual(3);
    });
    it(`${mode}: status colours readable on their washes`, () => {
      expect(contrastRatio(c.danger, c.dangerSubtle)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.warning, c.warningSubtle)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.success, c.successSubtle)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.accent, c.accentSubtle)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('generated CSS', () => {
  it('is up to date with tokens.ts (run `pnpm --filter @aisle/ui build:css`)', () => {
    const committed = readFileSync(
      fileURLToPath(new URL('./web/tokens.css', import.meta.url)),
      'utf8',
    );
    expect(committed).toBe(buildTokenCss());
  });
});
