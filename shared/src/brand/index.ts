/**
 * Peregrinus identity — the single source of the product name, links and the
 * rule that rewrites upstream's "TREK" in user-facing text.
 *
 * Peregrinus is a modified version of TREK (https://github.com/liketrek/TREK),
 * AGPL-3.0. See NOTICE.md and PEREGRINUS.md.
 */
import type { TranslationStrings, TranslationValue } from '../i18n/types';

export const BRAND = {
  name: 'Peregrinus',
  repoSlug: 'marlonfrade/peregrinus',
  repoUrl: 'https://github.com/marlonfrade/peregrinus',
  upstream: {
    name: 'TREK',
    url: 'https://github.com/liketrek/TREK',
    wikiUrl: 'https://github.com/liketrek/TREK/wiki',
  },
  /** Upstream's donation/Discord/issue grid in Settings → About. */
  upstreamSupportLinks: false as boolean,
} as const;

const TREK_WORD = /\bTREK\b/g;

export function applyBrand(s: string): string {
  return s.replace(TREK_WORD, BRAND.name);
}

function brandValue(v: TranslationValue): TranslationValue {
  if (typeof v === 'string') return applyBrand(v);
  return v.map((item) => ({ name: applyBrand(item.name), category: applyBrand(item.category) }));
}

export function applyBrandToStrings(dict: TranslationStrings): TranslationStrings {
  const out: TranslationStrings = {};
  for (const [key, value] of Object.entries(dict)) out[key] = brandValue(value);
  return out;
}

type BrandCredit = { basedOn: string; license: string };

const CREDIT_EN: BrandCredit = { basedOn: 'Based on', license: 'AGPL-3.0' };
const CREDITS: Record<string, BrandCredit> = {
  en: CREDIT_EN,
  br: { basedOn: 'Baseado no', license: 'AGPL-3.0' },
};

export function brandCredit(language: string): BrandCredit {
  return CREDITS[language] ?? CREDIT_EN;
}
