import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
