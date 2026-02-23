import { AppHeader } from '@/components/layout'
import { PlanList } from '@/components/plans'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PlansPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Plans" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Implementation plans generated from brainstorm sessions</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/generate-plan')}>
            <Plus className="size-4 mr-1" /> Create New Plan
          </Button>
        </div>
        <PlanList />
      </div>
    </div>
  )
}
