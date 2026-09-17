import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/i18n'
import type { CalculatorController } from './state.ts'
import { PlanControls } from './PlanControls.tsx'

/** Collapsible what-if panel on the results page. Always open on desktop. */
export function QuickAdjust({ c, alwaysOpen = false }: { c: CalculatorController; alwaysOpen?: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(alwaysOpen)
  const expanded = alwaysOpen || open
  return (
    <Card className="border-postal-200 dark:border-postal-900">
      <CardHeader
        className={alwaysOpen ? 'flex-row items-center justify-between space-y-0' : 'flex-row items-center justify-between space-y-0 cursor-pointer select-none'}
        onClick={alwaysOpen ? undefined : () => setOpen((o) => !o)}
      >
        <div>
          <CardTitle>
            <SlidersHorizontal size={14} /> {t('results.adjust')}
          </CardTitle>
          <CardDescription>{t('results.adjustHint')}</CardDescription>
        </div>
        {!alwaysOpen && (
          <Button variant="ghost" size="sm" aria-expanded={expanded} aria-label={t('results.adjust')} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        )}
      </CardHeader>
      {expanded && (
        <CardContent>
          <PlanControls c={c} compact />
        </CardContent>
      )}
    </Card>
  )
}
