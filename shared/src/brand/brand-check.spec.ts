// @ts-expect-error — plain .mjs script with no .d.ts; import as JS module.
import { diffBaseline, scanSource } from '../../scripts/brand-check.mjs';

import { describe, expect, it } from 'vitest';

describe('scanSource', () => {
  it('finds TREK in string, template and JSX text, not in comments or identifiers', () => {
    const src = [
      '// TREK in a comment',
      '/* TREK block */',
      'const TREK_FLAG = 1',
      "const a = 'Open TREK'",
      'const b = `TREK — ${x}`',
      'const c = <p>Made with TREK</p>',
      'const d = <img alt="TREK" />',
      "const e = 'trekking @trek/shared'",
    ].join('\n');
    expect(scanSource('x.tsx', src)).toEqual(['Open TREK', 'TREK —', 'Made with TREK', 'TREK']);
  });
});

describe('diffBaseline', () => {
  it('reports new hits and stale baseline entries, as multisets', () => {
    const baseline = ['a.ts\tTREK', 'a.ts\tTREK', 'b.ts\tTREK MCP'];
    const hits = ['a.ts\tTREK', 'c.ts\tTREK new'];
    expect(diffBaseline(hits, baseline)).toEqual({
      added: ['c.ts\tTREK new'],
      stale: ['a.ts\tTREK', 'b.ts\tTREK MCP'],
    });
  });

  it('is clean when hits equal the baseline', () => {
    expect(diffBaseline(['a\tTREK'], ['a\tTREK'])).toEqual({ added: [], stale: [] });
  });
});
