import { useEffect, useState } from 'react'

/**
 * Lets a controlled numeric input be cleared and retyped freely.
 * While the field is focused the raw text is kept locally; valid numbers are
 * pushed up as they are typed and the value is clamped/committed on blur.
 */
export function useDraftNumber(value: number, commit: (v: number) => void, clamp: (v: number) => number) {
  const [draft, setDraft] = useState<string | null>(null)

  // If the value changes from elsewhere (preset chip, stepper button) drop the draft.
  useEffect(() => {
    setDraft(null)
  }, [value])

  return {
    text: draft ?? String(value),
    onChange: (raw: string) => {
      setDraft(raw)
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n)) commit(n)
    },
    onBlur: () => {
      const n = parseInt(draft ?? String(value), 10)
      commit(clamp(Number.isNaN(n) ? value : n))
      setDraft(null)
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
  }
}
