import { describe, expect, it } from 'vitest';
import { PEREGRINUS_HIDDEN_NOTICE_IDS, SYSTEM_NOTICES } from '../../src/systemNotices/registry';

describe('peregrinus: maintainer notices', () => {
  it('hides the donation-asking notices', () => {
    const ids = SYSTEM_NOTICES.map((n) => n.id);
    expect(ids).not.toContain('thank-you-support');
    expect(ids).not.toContain('release-notes');
  });

  it('only hides ids that exist upstream, and keeps the rest', () => {
    expect([...PEREGRINUS_HIDDEN_NOTICE_IDS].sort()).toEqual(['release-notes', 'thank-you-support']);
    expect(SYSTEM_NOTICES.map((n) => n.id)).toContain('v3014-whitespace-collision');
  });
});
