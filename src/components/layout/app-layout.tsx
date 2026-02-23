import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
