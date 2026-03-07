import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout'
import { useProjectStore } from '@/stores/project-store'

const Onboarding = lazy(() => import('@/pages/onboarding'))
const NewProject = lazy(() => import('@/pages/new-project'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
const Decks = lazy(() => import('@/pages/decks'))
const Brainstorm = lazy(() => import('@/pages/brainstorm'))
const BrainstormReport = lazy(() => import('@/pages/brainstorm-report'))
const GeneratePlan = lazy(() => import('@/pages/generate-plan'))
const Plans = lazy(() => import('@/pages/plans'))
const PlanReview = lazy(() => import('@/pages/plan-review'))
const Tasks = lazy(() => import('@/pages/tasks'))
const Cook = lazy(() => import('@/pages/cook'))
const Worktrees = lazy(() => import('@/pages/worktrees'))
const Settings = lazy(() => import('@/pages/settings'))
const CcsTest = lazy(() => import('@/pages/ccs-test'))

/** Redirect to /onboarding if no projects exist */
function RootRedirect() {
  const { t } = useTranslation()
  const { loaded, projects, loadProjects } = useProjectStore()

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
        {t('common.messages.loading')}
      </div>
    )
  }

  if (projects.length === 0) {
    return <Navigate to="/onboarding" replace />
  }

  return <Dashboard />
}

function PageLoader() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
      {t('common.messages.loading')}
    </div>
  )
}

function wrap(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: wrap(<Onboarding />),
  },
  {
    path: '/new-project',
    element: <AppLayout />,
    children: [{ index: true, element: wrap(<NewProject />) }],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Suspense fallback={<PageLoader />}><RootRedirect /></Suspense> },
      { path: '/decks', element: wrap(<Decks />) },
      { path: '/brainstorm', element: wrap(<Brainstorm />) },
      { path: '/brainstorm/:id', element: wrap(<BrainstormReport />) },
      { path: '/generate-plan', element: wrap(<GeneratePlan />) },
      { path: '/plans', element: wrap(<Plans />) },
      { path: '/plans/:id', element: wrap(<PlanReview />) },
      { path: '/tasks', element: wrap(<Tasks />) },
      { path: '/cook/:taskId', element: wrap(<Cook />) },
      { path: '/worktrees', element: wrap(<Worktrees />) },
      { path: '/settings', element: wrap(<Settings />) },
      { path: '/ccs-test', element: wrap(<CcsTest />) },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
