import { AppHeader } from '@/components/layout'
import { CcsTestConsole } from '@/components/settings/ccs-test-console'

export default function CcsTestPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="CCS Test Console" subtitle="Developer tool — validate ccs subprocess + stream output" />
      <div className="flex-1 min-h-0 px-6 py-4 flex flex-col">
        <CcsTestConsole />
      </div>
    </div>
  )
}
