import { BRAND } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { buildEmailHtml } from '../../../src/nest/notifications/mailer/email-html';

describe('branded e-mail shell', () => {
  const html = buildEmailHtml('Subject', 'Body with TREK Patagonia', 'en');

  it('shows the Peregrinus name and credits upstream in the footer', () => {
    expect(html).toContain(`>${BRAND.name}</div>`);
    expect(html).toContain(`alt="${BRAND.name}"`);
    expect(html).toContain(`href="${BRAND.repoUrl}"`);
    expect(html).toContain(`href="${BRAND.upstream.url}"`);
  });

  it('drops the TREK acronym subtitle and the maintainer line', () => {
    expect(html).not.toContain('Travel Resource &amp; Exploration Kit');
    expect(html).not.toContain('by Maurice');
  });

  it('never rewrites the message body', () => {
    expect(html).toContain('Body with TREK Patagonia');
  });
});
