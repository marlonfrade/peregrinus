/** Peregrinus compass mark (brainstorm variant V1: coral north tip). 64×64 units. */
export const BRAND_COLORS = {
  petrol: '#0B2E33',
  petrolDeep: '#071B1E',
  teal: '#0E7C86',
  coral: '#FF6B57',
  mist: '#F2F7F7',
  ice: '#DDEFF0',
} as const;

export interface CompassOptions {
  /** Structure colour (outer ring, needle, axis). */
  ink: string;
  /** Fill of the centre pin — the surface the mark sits on. */
  hole: string;
  ring?: string;
  needle?: string;
  /** Favicon form: no dashed ring, no east-west axis. */
  simplified?: boolean;
}

export function compassMarkup({
  ink,
  hole,
  ring = BRAND_COLORS.teal,
  needle = BRAND_COLORS.coral,
  simplified = false,
}: CompassOptions): string {
  return [
    `<circle cx="32" cy="32" r="29" fill="none" stroke="${ink}" stroke-width="${simplified ? 4 : 2.5}"/>`,
    simplified
      ? ''
      : `<circle cx="32" cy="32" r="22" fill="none" stroke="${ring}" stroke-width="1.4" stroke-dasharray="2 3"/>`,
    `<path d="M32 6 L37 32 L32 58 L27 32 Z" fill="${ink}"/>`,
    `<path d="M32 6 L37 32 L32 32 Z" fill="${needle}"/>`,
    simplified ? '' : `<path d="M6 32 L32 28 L58 32 L32 36 Z" fill="${ink}" opacity=".35"/>`,
    `<circle cx="32" cy="32" r="3" fill="${hole}" stroke="${ink}" stroke-width="1.5"/>`,
  ].join('');
}

export function compassSvg(o: CompassOptions & { size?: number; background?: string; radius?: number }): string {
  const size = o.size ?? 64;
  const tile = o.background ? `<rect width="64" height="64" rx="${o.radius ?? 0}" fill="${o.background}"/>` : '';
  // With a tile the mark is inset to 80% so it reads as an app icon.
  const inner = o.background
    ? `<g transform="translate(6.4 6.4) scale(0.8)">${compassMarkup(o)}</g>`
    : compassMarkup(o);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${tile}${inner}</svg>`;
}

/**
 * One filled path for the mascot body (MDancingTrek draws its body as a single
 * currentColor path in a 1500×1500 box): outer ring (annulus, opposite winding)
 * plus the north-south needle.
 */
export const MASCOT_COMPASS_PATH =
  'M 50 750 A 700 700 0 1 0 1450 750 A 700 700 0 1 0 50 750 Z ' +
  'M 130 750 A 620 620 0 1 1 1370 750 A 620 620 0 1 1 130 750 Z ' +
  'M 750 120 L 880 750 L 750 1380 L 620 750 Z';
