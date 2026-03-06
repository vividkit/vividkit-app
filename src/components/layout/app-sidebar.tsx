import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Lightbulb, ListTodo, FileText, Layers, GitBranch,
  Settings, HelpCircle, PanelLeftClose, PanelLeft, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useProjectStore } from '@/stores/project-store'
import { useTaskStore } from '@/stores/task-store'
import { cn } from '@/lib/utils'

const MAIN_NAV = [
  { to: '/', labelKey: 'navigation.main.dashboard', icon: LayoutDashboard, exact: true },
  { to: '/brainstorm', labelKey: 'navigation.main.brainstorm', icon: Lightbulb },
  { to: '/tasks', labelKey: 'navigation.main.tasks', icon: ListTodo, badge: true },
  { to: '/plans', labelKey: 'navigation.main.plans', icon: FileText },
  { to: '/decks', labelKey: 'navigation.main.decks', icon: Layers },
  { to: '/worktrees', labelKey: 'navigation.main.worktrees', icon: GitBranch },
]

const BOTTOM_NAV = [
  { to: '/settings', labelKey: 'navigation.bottom.settings', icon: Settings },
  { to: '/ccs-test', labelKey: 'navigation.bottom.devConsole', icon: HelpCircle },
]

export function AppSidebar() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { projects, activeProjectId } = useProjectStore()
  const tasks = useTaskStore((s) => s.tasks)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const projectInitial = activeProject?.name?.charAt(0)?.toUpperCase() ?? 'V'
  const inProgressCount = tasks.filter((t) => (t.status as string) === 'in_progress').length

  return (
    <TooltipProvider>
      <aside className={cn(
        'flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 overflow-hidden shrink-0',
        collapsed ? 'w-[60px]' : 'w-64',
      )}>
        {/* Header: project switcher + collapse toggle */}
        <div className={cn(
          'flex items-center px-3 py-4',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0"
                  onClick={() => setCollapsed(false)}
                >
                  {projectInitial}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {activeProject?.name ?? t('common.app.name')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <button
                className="flex flex-1 min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-secondary transition-colors text-left"
                onClick={() => navigate('/decks')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {projectInitial}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {activeProject?.name ?? t('navigation.sidebar.noProject')}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {activeProject?.description ?? t('navigation.sidebar.selectProject')}
                  </p>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(true)}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="mx-3 border-t border-sidebar-border" />

        {/* Main nav */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {MAIN_NAV.map(({ to, labelKey, icon: Icon, exact, badge }) => (
            <NavItem
              key={to}
              to={to}
              label={t(labelKey)}
              icon={<Icon className="h-5 w-5 shrink-0" />}
              collapsed={collapsed}
              badge={badge && inProgressCount > 0 ? String(inProgressCount) : undefined}
              end={exact}
            />
          ))}
        </nav>

        <div className="mx-3 border-t border-sidebar-border" />

        {/* Bottom nav */}
        <nav className="space-y-1 px-2 py-4">
          {BOTTOM_NAV.map(({ to, labelKey, icon: Icon }) => (
            <NavItem
              key={to}
              to={to}
              label={t(labelKey)}
              icon={<Icon className="h-5 w-5 shrink-0" />}
              collapsed={collapsed}
            />
          ))}
          {!collapsed && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 text-xs"
              onClick={() => navigate('/new-project')}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {t('navigation.sidebar.newProject')}
            </Button>
          )}
          {collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9"
                  onClick={() => setCollapsed(false)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>{t('navigation.sidebar.expand')}</TooltipContent>
            </Tooltip>
          )}
        </nav>
      </aside>
    </TooltipProvider>
  )
}

interface NavItemProps {
  to: string
  label: string
  icon: React.ReactNode
  collapsed: boolean
  badge?: string
  end?: boolean
}

function NavItem({ to, label, icon, collapsed, badge, end }: NavItemProps) {
  // Compute isActive manually so className is a static string — required for
  // TooltipTrigger asChild (Radix Slot can't merge function classNames)
  const location = useLocation()
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to)

  const linkClass = cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    collapsed && 'justify-center',
    isActive
      ? 'bg-accent text-accent-foreground border border-primary/20'
      : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground',
  )

  const link = (
    <NavLink to={to} end={end} className={linkClass}>
      {icon}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="text-xs text-muted-foreground">{badge}</span>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}
