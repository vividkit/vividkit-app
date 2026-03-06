import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '@/types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

export const SETTINGS_STORAGE_KEY = 'vividkit-settings'

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'vi',
  theme: 'light',
  autoSave: true,
  fontSize: 14,
  defaultBranch: 'main',
  worktreesDir: '.worktrees',
  commandProviders: {},
}

const FONT_SIZES: readonly AppSettings['fontSize'][] = [12, 14, 16, 18]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizeCommandProviders(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
      .map(([command, provider]) => [command, provider.trim()]),
  )
}

function normalizeSettings(value: unknown): AppSettings {
  const data = isRecord(value) ? value : {}
  return {
    language: data.language === 'en' ? 'en' : 'vi',
    theme: data.theme === 'dark' ? 'dark' : 'light',
    autoSave: typeof data.autoSave === 'boolean' ? data.autoSave : DEFAULT_SETTINGS.autoSave,
    fontSize:
      typeof data.fontSize === 'number' && FONT_SIZES.includes(data.fontSize as AppSettings['fontSize'])
        ? (data.fontSize as AppSettings['fontSize'])
        : DEFAULT_SETTINGS.fontSize,
    defaultBranch: normalizeText(data.defaultBranch, DEFAULT_SETTINGS.defaultBranch),
    worktreesDir: normalizeText(data.worktreesDir, DEFAULT_SETTINGS.worktreesDir),
    commandProviders: normalizeCommandProviders(data.commandProviders),
  }
}

function readPersistedSettings(persistedState: unknown): unknown {
  if (!isRecord(persistedState)) return undefined
  if (isRecord(persistedState.state)) return persistedState.state.settings
  return persistedState.settings
}

function readStoredSettingsFromLocalStorage(): unknown {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return undefined
    return readPersistedSettings(JSON.parse(raw))
  } catch {
    return undefined
  }
}

const initialSettings = normalizeSettings(readStoredSettingsFromLocalStorage())

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: initialSettings,
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({ settings: state.settings }),
      migrate: (persistedState) => ({
        settings: normalizeSettings(readPersistedSettings(persistedState)),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        settings: normalizeSettings(readPersistedSettings(persistedState)),
      }),
    },
  ),
)
