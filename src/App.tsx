import { ThemeProvider } from '@/components/layout'
import { AppRouter } from './router'
import './App.css'

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
