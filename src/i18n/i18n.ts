import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/stores/settings-store'

import commonEn from '@/locales/en/common.json'
import navigationEn from '@/locales/en/navigation.json'
import pagesEn from '@/locales/en/pages.json'
import dashboardEn from '@/locales/en/dashboard.json'
import onboardingEn from '@/locales/en/onboarding.json'
import settingsEn from '@/locales/en/settings.json'
import tasksEn from '@/locales/en/tasks.json'
import plansEn from '@/locales/en/plans.json'
import worktreesEn from '@/locales/en/worktrees.json'
import cookEn from '@/locales/en/cook.json'
import brainstormEn from '@/locales/en/brainstorm.json'
import generatePlanEn from '@/locales/en/generate-plan.json'
import ccsStreamEn from '@/locales/en/ccs-stream.json'

import commonVi from '@/locales/vi/common.json'
import navigationVi from '@/locales/vi/navigation.json'
import pagesVi from '@/locales/vi/pages.json'
import dashboardVi from '@/locales/vi/dashboard.json'
import onboardingVi from '@/locales/vi/onboarding.json'
import settingsVi from '@/locales/vi/settings.json'
import tasksVi from '@/locales/vi/tasks.json'
import plansVi from '@/locales/vi/plans.json'
import worktreesVi from '@/locales/vi/worktrees.json'
import cookVi from '@/locales/vi/cook.json'
import brainstormVi from '@/locales/vi/brainstorm.json'
import generatePlanVi from '@/locales/vi/generate-plan.json'
import ccsStreamVi from '@/locales/vi/ccs-stream.json'

const en = {
  common: commonEn,
  navigation: navigationEn,
  pages: pagesEn,
  dashboard: dashboardEn,
  onboarding: onboardingEn,
  settings: settingsEn,
  tasks: tasksEn,
  plans: plansEn,
  worktrees: worktreesEn,
  cook: cookEn,
  brainstorm: brainstormEn,
  generatePlan: generatePlanEn,
  ccsStream: ccsStreamEn,
}

const vi = {
  common: commonVi,
  navigation: navigationVi,
  pages: pagesVi,
  dashboard: dashboardVi,
  onboarding: onboardingVi,
  settings: settingsVi,
  tasks: tasksVi,
  plans: plansVi,
  worktrees: worktreesVi,
  cook: cookVi,
  brainstorm: brainstormVi,
  generatePlan: generatePlanVi,
  ccsStream: ccsStreamVi,
}

type LanguageCode = 'en' | 'vi'

function normalizeLanguage(value: unknown): LanguageCode {
  return value === 'en' ? 'en' : 'vi'
}

function resolveInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS.language
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS.language
    const parsed = JSON.parse(raw) as {
      state?: { settings?: { language?: unknown } }
      settings?: { language?: unknown }
    }
    const persistedLanguage = parsed?.state?.settings?.language ?? parsed?.settings?.language
    return normalizeLanguage(persistedLanguage)
  } catch {
    return DEFAULT_SETTINGS.language
  }
}

const initialLanguage = resolveInitialLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: initialLanguage,
  fallbackLng: {
    en: ['en', 'vi'],
    vi: ['vi', 'en'],
    default: ['vi', 'en'],
  },
  supportedLngs: ['en', 'vi'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage
}

export default i18n
