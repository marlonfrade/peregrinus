import { compassMarkup } from '@trek/shared'

// peregrinus: the compass mark, inline so it follows the theme ink via currentColor.
const MARKUP = compassMarkup({ ink: 'currentColor', hole: 'var(--bg-card)' })

export default function CompassMark({ size = 24, className, title }: { size?: number; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      // Static markup built from constants in @trek/shared — no user input.
      dangerouslySetInnerHTML={{ __html: MARKUP }}
    />
  )
}
