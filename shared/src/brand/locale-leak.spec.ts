/**
 * Every UI locale, once branded, must be free of "TREK". The client brands
 * tables with applyBrandToStrings (TranslationContext), so this is exactly
 * what a user can see.
 */
import ar from '../i18n/ar';
import br from '../i18n/br';
import ca from '../i18n/ca';
import cs from '../i18n/cs';
import de from '../i18n/de';
import en from '../i18n/en';
import es from '../i18n/es';
import fr from '../i18n/fr';
import gr from '../i18n/gr';
import hu from '../i18n/hu';
import id from '../i18n/id';
import it_ from '../i18n/it';
import ja from '../i18n/ja';
import ko from '../i18n/ko';
import nl from '../i18n/nl';
import pl from '../i18n/pl';
import ru from '../i18n/ru';
import sv from '../i18n/sv';
import tr from '../i18n/tr';
import uk from '../i18n/uk';
import vi from '../i18n/vi';
import zh from '../i18n/zh';
import zhTW from '../i18n/zh-TW';
import { applyBrandToStrings } from './index';

import { describe, expect, it } from 'vitest';

const LOCALES = {
  ar,
  br,
  ca,
  cs,
  de,
  en,
  es,
  fr,
  gr,
  hu,
  id,
  it: it_,
  ja,
  ko,
  nl,
  pl,
  ru,
  sv,
  tr,
  uk,
  vi,
  zh,
  'zh-TW': zhTW,
};

describe('branded UI locales', () => {
  it('covers all 23 languages', () => {
    expect(Object.keys(LOCALES)).toHaveLength(23);
  });

  it.each(Object.entries(LOCALES))('%s has no TREK after branding', (_lang, table) => {
    const leaks = Object.entries(applyBrandToStrings(table))
      .filter(([, v]) => JSON.stringify(v).match(/\bTREK\b/))
      .map(([k]) => k);
    expect(leaks).toEqual([]);
  });
});
