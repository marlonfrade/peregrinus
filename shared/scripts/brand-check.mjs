#!/usr/bin/env node
/**
 * peregrinus: brand-leak gate.
 *
 * Collects every string literal, template-literal part and JSX text that
 * contains the whole word "TREK" in client/src and server/src (tests and i18n
 * tables excluded — locales are covered by src/brand/locale-leak.spec.ts) and
 * compares them with the reviewed baseline. Fails on a new literal (a leak) and
 * on a baseline entry that no longer exists (a stale exemption).
 *
 *   npm run brand:check              # verify
 *   npm run brand:check -- --update  # rewrite the baseline, then review its diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const WORD = /\bTREK\b/;
const LITERAL_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'tests', 'e2e', 'i18n']);
const SCAN_ROOTS = ['client/src', 'server/src'];

export function scanSource(fileName, source) {
  const kind = fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  const hits = [];
  const visit = (node) => {
    if (LITERAL_KINDS.has(node.kind)) {
      const text = (node.text ?? node.getText(sf)).replace(/\s+/g, ' ').trim();
      if (WORD.test(text)) hits.push(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (/\.(ts|tsx|mts)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
}

export function collectHits(repoRoot) {
  const files = [];
  for (const root of SCAN_ROOTS) walk(path.join(repoRoot, root), files);
  const hits = [];
  for (const file of files) {
    const rel = path.relative(repoRoot, file).split(path.sep).join('/');
    for (const text of scanSource(file, fs.readFileSync(file, 'utf8'))) hits.push(`${rel}\t${text}`);
  }
  return hits.sort();
}

export function diffBaseline(hits, baseline) {
  const remaining = new Map();
  for (const b of baseline) remaining.set(b, (remaining.get(b) ?? 0) + 1);
  const added = [];
  for (const h of hits) {
    const n = remaining.get(h) ?? 0;
    if (n > 0) remaining.set(h, n - 1);
    else added.push(h);
  }
  const stale = [];
  for (const [entry, n] of remaining) for (let i = 0; i < n; i++) stale.push(entry);
  return { added: added.sort(), stale: stale.sort() };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const baselinePath = path.join(repoRoot, 'shared', 'scripts', 'brand-check.baseline.json');
  const hits = collectHits(repoRoot);
  if (process.argv.includes('--update')) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(hits, null, 2)}\n`);
    console.log(`brand-check: baseline rewritten with ${hits.length} entries — review the diff.`);
    process.exit(0);
  }
  const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : [];
  const { added, stale } = diffBaseline(hits, baseline);
  for (const a of added) console.error(`NEW   ${a.replace('\t', '  ')}`);
  for (const s of stale) console.error(`STALE ${s.replace('\t', '  ')}`);
  if (added.length || stale.length) {
    console.error(
      `\nbrand-check: ${added.length} new, ${stale.length} stale. ` +
        'Patch user-facing literals to use BRAND (spec §4.2); for internal ones, or after removing stale entries, run `npm run brand:check -- --update` and review the baseline diff.',
    );
    process.exit(1);
  }
  console.log(`brand-check: OK (${hits.length} baselined literals).`);
}
