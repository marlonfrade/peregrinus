import React from 'react'
import { BRAND } from '@trek/shared'
import CompassMark from '../../brand/CompassMark'

// peregrinus: TREK wordmark replaced by compass + name. `pill` kept for API compatibility.
export default function TrekMark({ pill: _pill = true, className, style }: React.SVGProps<SVGSVGElement> & { pill?: boolean }): React.ReactElement {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em', fontWeight: 700, ...(style as React.CSSProperties) }}>
      <CompassMark size={16} />
      {BRAND.name}
    </span>
  )
}
