import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { TranslationProvider, useTranslation } from '../i18n/TranslationContext'
import { useSettingsStore } from '../store/settingsStore'

function Probe({ k, params }: { k: string; params?: Record<string, string> }) {
  const { t } = useTranslation()
  return <p data-testid="out">{t(k, params)}</p>
}

function setLanguage(language: string) {
  act(() => {
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, language } }))
  })
}

describe('branded translations', () => {
  it('brands English immediately (synchronous fallback)', () => {
    setLanguage('en')
    render(<TranslationProvider><Probe k="oauth.authorize.loginButton" /></TranslationProvider>)
    expect(screen.getByTestId('out').textContent).toBe('Sign in to Peregrinus')
  })

  it('brands a lazily loaded locale', async () => {
    setLanguage('br')
    render(<TranslationProvider><Probe k="system_notice.welcome_v1.title" /></TranslationProvider>)
    await waitFor(() => expect(screen.getByTestId('out').textContent).toBe('Bem-vindo ao Peregrinus'))
  })

  it('never brands interpolated params', () => {
    setLanguage('en')
    render(
      <TranslationProvider>
        <Probe k="oauth.authorize.loginDescription" params={{ client: 'TREK Bot' }} />
      </TranslationProvider>,
    )
    expect(screen.getByTestId('out').textContent).toBe(
      'TREK Bot wants access to your Peregrinus account. Please sign in first.',
    )
  })
})
