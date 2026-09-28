import { BRAND_COLORS, MASCOT_COMPASS_PATH, compassMarkup, compassSvg } from './mark';

import { describe, expect, it } from 'vitest';

describe('compass mark', () => {
  it('draws the V1 mark: ink structure, teal dashed ring, coral north tip', () => {
    const m = compassMarkup({ ink: '#000', hole: '#fff' });
    expect(m).toContain(`stroke="${BRAND_COLORS.teal}"`);
    expect(m).toContain(`fill="${BRAND_COLORS.coral}"`);
    expect(m).toContain('stroke-dasharray');
  });

  it('simplified drops the dashed ring and the east-west axis', () => {
    const m = compassMarkup({ ink: '#000', hole: '#fff', simplified: true });
    expect(m).not.toContain('stroke-dasharray');
    expect(m).not.toContain('M6 32');
  });

  it('compassSvg returns a standalone document with optional tile', () => {
    const svg = compassSvg({
      ink: '#fff',
      hole: BRAND_COLORS.petrol,
      background: BRAND_COLORS.petrol,
      radius: 14,
      size: 512,
    });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain(`<rect width="64" height="64" rx="14" fill="${BRAND_COLORS.petrol}"/>`);
  });

  it('mascot path is a closed path in the 1500 box', () => {
    expect(MASCOT_COMPASS_PATH.trim().endsWith('Z')).toBe(true);
    const nums = (MASCOT_COMPASS_PATH.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    expect(nums.length).toBeGreaterThan(0);
    expect(Math.max(...nums)).toBeLessThanOrEqual(1500);
  });
});
