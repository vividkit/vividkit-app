import i18n from './i18n'
import type { AppSettings } from '@/types'

export type AppLanguage = AppSettings['language']

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'en' ? 'en' : 'vi'
}

export async function applyLanguage(language: AppLanguage): Promise<void> {
  const nextLanguage = normalizeLanguage(language)
  if (i18n.language !== nextLanguage) {
    await i18n.changeLanguage(nextLanguage)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLanguage
  }
}
