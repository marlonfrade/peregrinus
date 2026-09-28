import { describe, expect, it } from 'vitest';
import { brandEventFn, brandNotificationLocale } from './notifications';
import { EMAIL_I18N, EVENT_TEXTS, PASSWORD_RESET_I18N } from '../i18n/externalNotifications';

describe('brandEventFn', () => {
  const fn = (p: Record<string, string>) => ({
    title: `${p.actor} invited you`,
    body: `${p.actor} shared "${p.trip}". Open TREK to view it.`,
  });

  it('brands the template but never the params', () => {
    const out = brandEventFn(fn)({ actor: 'TREK fan', trip: 'TREK Patagonia' });
    expect(out.title).toBe('TREK fan invited you');
    expect(out.body).toBe('TREK fan shared "TREK Patagonia". Open Peregrinus to view it.');
  });

  it('works with no params and with params containing regex-special text', () => {
    expect(brandEventFn(() => ({ title: 'TREK', body: '' }))({})).toEqual({ title: 'Peregrinus', body: '' });
    const out = brandEventFn(fn)({ actor: '$& $1 \\u0000', trip: 'x' });
    expect(out.title).toBe('$& $1 \\u0000 invited you');
  });
});

describe('brandNotificationLocale', () => {
  it('brands email and password-reset strings', () => {
    const loc = brandNotificationLocale({
      email: { footer: 'enabled in TREK.', manage: 'm', madeWith: 'w', openTrek: 'Open TREK' },
      events: {} as never,
      passwordReset: { subject: 'Reset your TREK password', greeting: 'g', body: 'b', ctaIntro: 'c', expiry: 'e', ignore: 'i' },
    });
    expect(loc.email.openTrek).toBe('Open Peregrinus');
    expect(loc.passwordReset.subject).toBe('Reset your Peregrinus password');
  });
});

describe('externalNotifications exports are branded', () => {
  it('no locale leaks TREK in email or password-reset strings', () => {
    for (const [lang, strings] of Object.entries({ ...EMAIL_I18N, ...PASSWORD_RESET_I18N })) {
      for (const v of Object.values(strings)) expect(v, lang).not.toMatch(/\bTREK\b/);
    }
  });

  it('no locale leaks TREK in event texts', () => {
    // Every p.<name> read by shared/src/i18n/en/externalNotifications.ts.
    const params = {
      actor: 'A', backend: 'B', body: 'Y', booking: 'K', category: 'C', count: '2', due: 'D', error: 'E', invitee: 'I',
      key: 'k', op: 'o', preview: 'P', suppressed: '0', title: 'X', todo: 'T', trip: 'T', type: 't', version: '1',
    };
    for (const [lang, events] of Object.entries(EVENT_TEXTS)) {
      for (const [key, fn] of Object.entries(events)) {
        const out = fn(params);
        expect(`${out.title} ${out.body}`, `${lang}.${key}`).not.toMatch(/\bTREK\b/);
      }
    }
  });
});
