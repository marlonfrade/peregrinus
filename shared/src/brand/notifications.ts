import { applyBrand } from './index';
import type { EventTextFn, NotificationLocale } from '../i18n/externalNotifications/types';

/**
 * Brand an event-text function without touching its params: params are swapped
 * for sentinels, the template output is branded, then the real values go back.
 * A trip named "TREK Patagonia" therefore stays exactly that.
 */
export function brandEventFn(fn: EventTextFn): EventTextFn {
  return (params) => {
    const keys = Object.keys(params);
    const masked = Object.fromEntries(keys.map((k, i) => [k, `\u0000${i}\u0000`]));
    const out = fn(masked);
    const restore = (s: string) =>
      applyBrand(s).replace(/\u0000(\d+)\u0000/g, (_m, i: string) => params[keys[Number(i)] ?? ''] ?? '');
    return { title: restore(out.title), body: restore(out.body) };
  };
}

function brandRecord<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? applyBrand(v) : v]),
  ) as T;
}

export function brandNotificationLocale(locale: NotificationLocale): NotificationLocale {
  return {
    email: brandRecord(locale.email),
    passwordReset: brandRecord(locale.passwordReset),
    events: Object.fromEntries(
      Object.entries(locale.events).map(([k, fn]) => [k, brandEventFn(fn)]),
    ) as NotificationLocale['events'],
  };
}
