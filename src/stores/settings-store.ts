import { create } from 'zustand'
import type { AppSettings } from '@/types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

const defaults: AppSettings = {
  language: 'en',
  theme: 'light',
  autoSave: true,
  fontSize: 14,
  defaultBranch: 'main',
  worktreesDir: '.worktrees',
  commandProviders: {},
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaults,
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
}))
