import { BRAND, applyBrand, applyBrandToStrings, brandCredit } from './index';

import { describe, expect, it } from 'vitest';

describe('applyBrand', () => {
  it('replaces the whole word TREK', () => {
    expect(applyBrand('Welcome to TREK')).toBe('Welcome to Peregrinus');
    expect(applyBrand('TREK — TREK')).toBe('Peregrinus — Peregrinus');
  });

  it('handles possessives and punctuation', () => {
    expect(applyBrand("TREK's admin panel.")).toBe("Peregrinus's admin panel.");
    expect(applyBrand('(TREK)')).toBe('(Peregrinus)');
  });

  it('leaves look-alike words alone', () => {
    for (const s of ['trekking', 'Trek', '@trek/shared', 'TREK_MANAGED', 'trek_session', 'TREKS', 'MYTREK']) {
      expect(applyBrand(s)).toBe(s);
    }
  });

  it('is idempotent and safe on empty input', () => {
    const once = applyBrand('Open TREK');
    expect(applyBrand(once)).toBe(once);
    expect(applyBrand('')).toBe('');
  });
});

describe('applyBrandToStrings', () => {
  it('brands string values and the name/category of list values', () => {
    const out = applyBrandToStrings({
      a: 'Sign in to TREK',
      b: [{ name: 'TREK pick', category: 'TREK' }],
      c: 'no brand here',
    });
    expect(out).toEqual({
      a: 'Sign in to Peregrinus',
      b: [{ name: 'Peregrinus pick', category: 'Peregrinus' }],
      c: 'no brand here',
    });
  });

  it('does not mutate its input', () => {
    const input = { a: 'TREK' };
    applyBrandToStrings(input);
    expect(input.a).toBe('TREK');
  });
});

describe('brandCredit', () => {
  it('returns Portuguese for br and falls back to English', () => {
    expect(brandCredit('br').basedOn).toBe('Baseado no');
    expect(brandCredit('xx').basedOn).toBe('Based on');
  });
});

describe('BRAND', () => {
  it('points at the Peregrinus repository and credits upstream', () => {
    expect(BRAND.repoUrl).toBe(`https://github.com/${BRAND.repoSlug}`);
    expect(BRAND.upstream.url).toBe('https://github.com/liketrek/TREK');
  });
});
