import type { SVGProps } from 'react'
import { compassMarkup } from '@trek/shared'

// peregrinus: TREK's glyph replaced by the Peregrinus compass (trademark policy).
// Inlined so it takes `currentColor` and follows the theme.
const MARKUP = compassMarkup({ ink: 'currentColor', hole: 'var(--bg-card)' })

export default function TrekIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 64 64" aria-hidden className={className} {...props} dangerouslySetInnerHTML={{ __html: MARKUP }} />
}
