import { render } from '@testing-library/react'
import CompassMark from './CompassMark'
import TrekIcon from '../components/shared/TrekIcon'
import TrekMark from '../components/shared/TrekMark'
import { StudioWordmark } from '../components/Studio/StudioWordmark'

describe('brand marks', () => {
  it('CompassMark uses currentColor and the card surface for the pin', () => {
    const { container } = render(<CompassMark size={24} title="Peregrinus" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg.innerHTML).toContain('currentColor')
    expect(svg.innerHTML).toContain('var(--bg-card)')
    expect(svg.getAttribute('aria-label')).toBe('Peregrinus')
  })

  it('upstream mark components now render the compass and the brand name', () => {
    expect(render(<TrekIcon />).container.innerHTML).toContain('stroke-dasharray')
    expect(render(<TrekMark />).container.textContent).toContain('Peregrinus')
    expect(render(<StudioWordmark />).container.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Peregrinus Studio')
  })
})
