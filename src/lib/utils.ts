import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TerminalTheme {
  background: string
  foreground: string
  cursor: string
}

const DEFAULT_TERMINAL_THEME: TerminalTheme = {
  background: 'hsl(240 10% 4%)',
  foreground: 'hsl(210 20% 85%)',
  cursor: 'hsl(190 95% 70%)',
}

function readCssVar(name: '--terminal-background' | '--terminal-foreground' | '--terminal-cursor') {
  if (typeof window === 'undefined') return null
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || null
}

export function getTerminalTheme(): TerminalTheme {
  return {
    background: readCssVar('--terminal-background') ?? DEFAULT_TERMINAL_THEME.background,
    foreground: readCssVar('--terminal-foreground') ?? DEFAULT_TERMINAL_THEME.foreground,
    cursor: readCssVar('--terminal-cursor') ?? DEFAULT_TERMINAL_THEME.cursor,
  }
}
