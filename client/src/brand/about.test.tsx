import { render, screen } from '@testing-library/react'
import { BRAND } from '@trek/shared'
import AboutTab from '../components/Settings/AboutTab'
import { TranslationProvider } from '../i18n/TranslationContext'
import { useAuthStore } from '../store/authStore'

describe('About tab (AGPL §13 + credits)', () => {
  it.each([false, true])('always offers our source and credits TREK (managed=%s)', (managed) => {
    useAuthStore.setState({ managed })
    render(<TranslationProvider><AboutTab appVersion="4.3.0" /></TranslationProvider>)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain(BRAND.repoUrl)
    expect(hrefs).toContain(BRAND.upstream.url)
    expect(hrefs.some((h) => h?.includes('ko-fi') || h?.includes('buymeacoffee') || h?.includes('discord'))).toBe(false)
  })
})
