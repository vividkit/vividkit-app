import { AppHeader } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { CcsTestConsole } from '@/components/settings/ccs-test-console'

export default function CcsTestPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      <AppHeader title={t('pages.ccsTest.title')} subtitle={t('pages.ccsTest.subtitle')} />
      <div className="flex-1 min-h-0 px-6 py-4 flex flex-col">
        <CcsTestConsole />
      </div>
    </div>
  )
}
