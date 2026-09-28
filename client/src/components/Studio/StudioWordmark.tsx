import type { CSSProperties } from 'react'
import { BRAND } from '@trek/shared'
import CompassMark from '../../brand/CompassMark'

// peregrinus: "TREK Studio" lockup replaced by compass + "Peregrinus Studio".
// Callers size it by height (StudioShell passes { height: 26 }).
export function StudioWordmark({ style, title }: { style?: CSSProperties; title?: string }) {
  const label = title ?? `${BRAND.name} Studio`
  const h = typeof style?.height === 'number' ? style.height : 26
  return (
    <span
      role="img"
      aria-label={label}
      style={{ display: 'flex', alignItems: 'center', gap: h * 0.3, fontFamily: 'var(--font-system)', fontWeight: 700, fontSize: h * 0.72, lineHeight: 1, color: 'currentColor', ...style }}
    >
      <CompassMark size={h} />
      <span aria-hidden>{label}</span>
    </span>
  )
}
