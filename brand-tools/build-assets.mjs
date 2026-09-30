// peregrinus: writes every static brand asset from the single mark definition in
// shared/src/brand/mark.ts (via shared/dist). Run after `npm run build --workspace=shared`:
//   npm ci --prefix brand-tools && npm run build --prefix brand-tools
// Uses the root workspace's sharp for the e-mail logo PNG.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { BRAND, BRAND_COLORS as C, compassMarkup, compassSvg } from '../shared/dist/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'client', 'public');
const fontFile = path.join(root, 'node_modules', '@fontsource', 'familjen-grotesk', 'files', 'familjen-grotesk-latin-700-normal.woff');
const font = opentype.loadSync(fontFile);
const write = (rel, svg) => {
  fs.writeFileSync(path.join(pub, rel), `${svg}\n`);
  console.log(`  ✓ ${rel}`);
};

// Outlined wordmark, baseline at y=48 in a 64-high box.
const word = font.getPath(BRAND.name, 0, 48, 44);
const box = word.getBoundingBox();
const wordWidth = Math.ceil(box.x2) + 2;
const wordPath = (fill) => word.toSVG(2).replace('<path ', `<path fill="${fill}" `);

const markOn = (ink, hole) => compassMarkup({ ink, hole });

// Text-only wordmark
for (const [name, ink] of [['text-dark.svg', C.petrol], ['text-light.svg', C.ice]]) {
  write(name, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wordWidth} 64">${wordPath(ink)}</svg>`);
}
// Mark + wordmark lockup (mark 64, gap 14)
for (const [name, ink, hole] of [['logo-dark.svg', C.petrol, C.mist], ['logo-light.svg', C.ice, C.petrolDeep]]) {
  write(name, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${64 + 14 + wordWidth} 64">${markOn(ink, hole)}<g transform="translate(78 0)">${wordPath(ink)}</g></svg>`);
}
// Mark alone, for in-app use
write('icons/icon-dark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markOn(C.petrol, C.mist)}</svg>`);
write('icons/icon-white.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${markOn('#FFFFFF', C.petrol)}</svg>`);
// Master app icon: keeps upstream's glyph transform so generate-icons.mjs can make maskable variants.
// The inner scale(23.4375) maps the 64 box onto upstream's 1500 glyph box.
write('icons/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${C.petrol}"/><g transform="translate(56,51) scale(0.267)"><g transform="scale(23.4375)">${markOn(C.ice, C.petrol)}</g></g></svg>`);
// Favicon: simplified mark on the tile
write('icons/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${C.petrol}"/><g transform="translate(6.4 6.4) scale(0.8)">${compassMarkup({ ink: C.ice, hole: C.petrol, simplified: true })}</g></svg>`);

// E-mail header logo: a 96×96 PNG (twice the displayed size, corner radius baked in,
// as upstream does in email-logo.ts #2507) written into the base64 literal there.
const emailLogo = path.join(root, 'server', 'src', 'nest', 'notifications', 'mailer', 'email-logo.ts');
const png = await sharp(Buffer.from(compassSvg({ ink: '#FFFFFF', hole: C.petrol, background: C.petrol, radius: 14, size: 96 })), { density: 300 })
  .resize(96, 96)
  .png({ compressionLevel: 9 })
  .toBuffer();
const src = fs.readFileSync(emailLogo, 'utf8');
const next = src.replace(/(const EMAIL_LOGO_PNG = Buffer\.from\(\n\s*')[A-Za-z0-9+/=]+(',)/, `$1${png.toString('base64')}$2`);
if (next === src) throw new Error('email-logo.ts: EMAIL_LOGO_PNG literal not found');
fs.writeFileSync(emailLogo, next);
console.log('  ✓ server email-logo.ts (EMAIL_LOGO_PNG)');
