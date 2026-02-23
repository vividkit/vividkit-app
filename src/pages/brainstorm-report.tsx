import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Download, Share2 } from 'lucide-react'
import { AppHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const KEY_INSIGHTS = [
  { icon: '🏗️', title: 'Architecture', desc: 'Modular component design with clear separation of concerns' },
  { icon: '⚡', title: 'Performance', desc: 'Lazy loading and memoization for optimal render cycles' },
  { icon: '🔒', title: 'Security', desc: 'All AI calls routed through Rust backend, no client-side keys' },
]

const ACTION_ITEMS = [
  'Set up Tauri v2 project structure with plugin registration',
  'Implement Zustand stores for all domain entities',
  'Build xterm.js terminal components with proper disposal',
  'Create React Router layout with lazy-loaded pages',
  'Wire Rust commands for CCS subprocess management',
]

export default function BrainstormReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Brainstorm Report" subtitle={`Session #${id?.slice(0, 8)}`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/brainstorm')}>
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm"><Download className="size-4 mr-1.5" /> Export</Button>
          <Button variant="outline" size="sm"><Share2 className="size-4 mr-1.5" /> Share</Button>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KEY_INSIGHTS.map(({ icon, title, desc }) => (
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
          <h2 className="text-xl font-bold mb-4">Action Items</h2>
          <div className="space-y-2">
            {ACTION_ITEMS.map((item, i) => (
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
