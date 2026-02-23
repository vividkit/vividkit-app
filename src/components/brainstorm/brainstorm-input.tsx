import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BrainstormInputProps {
  onSubmit: (prompt: string) => void
  disabled?: boolean
}

export function BrainstormInput({ onSubmit, disabled }: BrainstormInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe what you want to brainstorm…"
        disabled={disabled}
        className="flex-1 font-mono text-sm"
      />
      <Button type="submit" disabled={!value.trim() || disabled}>
        <Send className="size-4" />
      </Button>
    </form>
  )
}
