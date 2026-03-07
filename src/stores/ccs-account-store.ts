import { create } from 'zustand'
import type { CcsAccount } from '@/types'

interface CcsAccountStore {
  accounts: CcsAccount[]
  setAccounts: (accounts: CcsAccount[]) => void
}

export const useCcsAccountStore = create<CcsAccountStore>((set) => ({
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
}))
