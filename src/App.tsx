import { lazy, Suspense } from 'react'
import { ThemeProvider } from '@/components/layout'
import { useAppInit } from '@/hooks/use-app-init'
import './App.css'

const AppRouter = lazy(async () => {
  const mod = await import('./router')
  return { default: mod.AppRouter }
})

function AppBootLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Initializing VividKit…
    </div>
  )
}

function AppBootErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-lg border border-destructive/20 bg-card p-6">
        <h1 className="text-lg font-semibold text-foreground">Startup failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">Unable to initialize local data.</p>
        <pre className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
          {message}
        </pre>
      </div>
    </div>
  )
}

export default function App() {
  const { ready, error } = useAppInit()

  return (
    <ThemeProvider>
      {error ? (
        <AppBootErrorScreen message={error} />
      ) : ready ? (
        <Suspense fallback={<AppBootLoadingScreen />}>
          <AppRouter />
        </Suspense>
      ) : (
        <AppBootLoadingScreen />
      )}
    </ThemeProvider>
  )
}
