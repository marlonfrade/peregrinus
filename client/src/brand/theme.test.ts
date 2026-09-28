import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { APPEARANCE_SCHEMES } from '../theme/schemes'

// Read from disk: vitest stubs CSS imports (even ?raw) to an empty string.
const css = readFileSync(join(__dirname, 'peregrinus.css'), 'utf8')
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')

function block(selector: string): Record<string, string> {
  const start = bare.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`missing block ${selector}`)
  const body = bare.slice(bare.indexOf('{', start) + 1, bare.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe.each([
  ['light', ':root:not([data-scheme])'],
  ['dark', '.dark:not([data-scheme])'],
])('%s brand tokens', (_mode, selector) => {
  const t = block(selector)

  it('meets AA for text and accent pairs', () => {
    expect(contrast(t['--text-primary'], t['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--text-secondary'], t['--bg-card'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--text-muted'], t['--bg-card'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--text-faint'], t['--bg-card'])).toBeGreaterThanOrEqual(3)
    expect(contrast(t['--accent-text'], t['--accent'])).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t['--accent-on'], t['--bg-card'])).toBeGreaterThanOrEqual(4.5)
  })

  it('leaves alpha tokens to upstream (transparency setting)', () => {
    for (const k of ['--bg-elevated', '--bg-hover', '--border-faint', '--sidebar-bg', '--tooltip-bg']) expect(t[k]).toBeUndefined()
  })
})

describe('brand stylesheet scope', () => {
  it('only targets the default scheme (no data-scheme attribute)', () => {
    const selectors = [...bare.matchAll(/([^{}]+)\{[^}]*\}/g)].map((m) => m[1].trim())
    for (const s of selectors) {
      if (s === ':root') continue // font variables only
      expect(s, s).toMatch(/:not\(\[data-scheme\]\)/)
    }
  })

  it('uses Familjen Grotesk as the UI face', () => {
    expect(block(':root')['--font-system']).toMatch(/^'Familjen Grotesk'/)
  })

  it('shows the brand accent in the scheme picker', () => {
    expect(APPEARANCE_SCHEMES.find((s) => s.id === 'default')!.swatch).toEqual({ light: '#0E7C86', dark: '#FF6B57' })
  })
})
