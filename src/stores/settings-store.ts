import { create } from 'zustand'
import { getSettings as getSettingsCommand, updateSettings as updateSettingsCommand } from '@/lib/tauri'
import type { AppSettings } from '@/types'

type SettingsPatch = Partial<AppSettings>

interface SettingsStore {
  settings: AppSettings
  loading: boolean
  initialized: boolean
  error: string | null
  loadSettings: () => Promise<AppSettings | null>
  saveSettings: (settings: AppSettings) => Promise<AppSettings | null>
  updateSettings: (patch: SettingsPatch) => Promise<AppSettings | null>
  clearError: () => void
}

const defaults: AppSettings = {
  language: 'en',
  theme: 'light',
  autoSave: true,
  fontSize: 14,
  defaultBranch: 'main',
  worktreesDir: '.worktrees',
  commandProviders: {},
  lastActiveProjectId: null,
}

let settingsMutationQueue: Promise<AppSettings | null> = Promise.resolve(null)

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function applySettingsPatch(current: AppSettings, base: AppSettings, patch: SettingsPatch): AppSettings {
  const next: AppSettings = { ...current, ...patch }

  if (patch.commandProviders) {
    const commandProviderDelta = Object.fromEntries(
      Object.entries(patch.commandProviders).filter(([command, provider]) => base.commandProviders[command] !== provider),
    ) as Record<string, string>

    next.commandProviders = { ...current.commandProviders, ...commandProviderDelta }
  }

  return next
}

function notifyError(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vividkit:toast', { detail: { type: 'error', message } }))
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaults,
  loading: false,
  initialized: false,
  error: null,
  loadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const settings = await getSettingsCommand()
      set({ settings, loading: false, initialized: true })
      return settings
    } catch (error) {
      const message = toErrorMessage(error)
      set({ loading: false, initialized: true, error: message })
      notifyError(message)
      return null
    }
  },
  saveSettings: async (settings) => {
    settingsMutationQueue = settingsMutationQueue.then(async () => {
      set({ loading: true, error: null })
      try {
        const saved = await updateSettingsCommand(settings)
        set({ settings: saved, loading: false, initialized: true })
        return saved
      } catch (error) {
        const message = toErrorMessage(error)
        set({ loading: false, error: message })
        notifyError(message)
        return null
      }
    })
    return settingsMutationQueue
  },
  updateSettings: async (patch) => {
    const base = get().settings
    settingsMutationQueue = settingsMutationQueue.then(async () => {
      set({ loading: true, error: null })
      try {
        const next = applySettingsPatch(get().settings, base, patch)
        const saved = await updateSettingsCommand(next)
        set({ settings: saved, loading: false, initialized: true })
        return saved
      } catch (error) {
        const message = toErrorMessage(error)
        set({ loading: false, error: message })
        notifyError(message)
        return null
      }
    })
    return settingsMutationQueue
  },
  clearError: () => {
    if (get().error) {
      set({ error: null })
    }
  },
}))
