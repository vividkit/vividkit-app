import { AppHeader } from '@/components/layout'
import { CcsTestConsole } from '@/components/settings/ccs-test-console'

export default function CcsTestPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="CCS Test Console" subtitle="Developer tool — validate ccs subprocess + xterm streaming" />
      <div className="py-6">
        <CcsTestConsole />
      </div>
    </div>
  )
}
