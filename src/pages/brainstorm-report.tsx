import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Download, Share2 } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function BrainstormReportPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const keyInsights = [
    {
      icon: '🏗️',
      title: t('brainstorm.reportPage.insights.architecture.title'),
      desc: t('brainstorm.reportPage.insights.architecture.desc'),
    },
    {
      icon: '⚡',
      title: t('brainstorm.reportPage.insights.performance.title'),
      desc: t('brainstorm.reportPage.insights.performance.desc'),
    },
    {
      icon: '🔒',
      title: t('brainstorm.reportPage.insights.security.title'),
      desc: t('brainstorm.reportPage.insights.security.desc'),
    },
  ]

  const actionItems = [
    t('brainstorm.reportPage.actionItems.item1'),
    t('brainstorm.reportPage.actionItems.item2'),
    t('brainstorm.reportPage.actionItems.item3'),
    t('brainstorm.reportPage.actionItems.item4'),
    t('brainstorm.reportPage.actionItems.item5'),
  ]

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        title={t('pages.brainstormReport.title')}
        subtitle={t('pages.brainstormReport.subtitleSession', { id: id?.slice(0, 8) ?? '-' })}
      />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/brainstorm')}>
            <ChevronLeft className="size-4 mr-1" /> {t('pages.brainstormReport.back')}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm"><Download className="size-4 mr-1.5" /> {t('common.actions.export')}</Button>
          <Button variant="outline" size="sm"><Share2 className="size-4 mr-1.5" /> {t('common.actions.share')}</Button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">{t('pages.brainstormReport.keyInsights')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyInsights.map(({ icon, title, desc }) => (
              <Card key={title}>
                <CardContent className="p-4 space-y-2">
                  <p className="text-2xl">{icon}</p>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">{t('pages.brainstormReport.actionItems')}</h2>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </div>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
